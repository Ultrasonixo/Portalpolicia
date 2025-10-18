// src/pages/PoliceProfilePage.jsx - VERSÃO COM TOKEN JWT
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx'; // Importar useAuth
import Timeline from '../components/Timeline.jsx';
import '../components/PoliceProfilePage.css'; // Ajuste o caminho se necessário

const PoliceProfilePage = () => {
    const { id: profileId } = useParams(); // Renomeia id para profileId para clareza
    const { user, logout } = useAuth(); // Pega o usuário logado e a função logout
    const [policial, setPolicial] = useState(null);
    const [historico, setHistorico] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null); // Estado de erro

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null); // Limpa erro anterior

            // <<< --- PEGAR TOKEN --- >>>
            const token = localStorage.getItem('authToken');
            if (!token) {
                console.error("Profile Error: Token não encontrado.");
                setError('Erro de autenticação: Token não encontrado.');
                setLoading(false);
                // if(logout) logout(); // Deslogar se não houver token
                return;
            }
            const headers = { 'Authorization': `Bearer ${token}` };
            // <<< --- FIM PEGAR TOKEN --- >>>

            try {
                 // <<< --- ADICIONAR HEADERS --- >>>
                const [perfilResponse, historicoResponse] = await Promise.all([
                    fetch(`http://localhost:3000/api/policia/perfil/${profileId}`, { headers }),
                    fetch(`http://localhost:3000/api/policia/perfil/${profileId}/historico`, { headers })
                ]);
                 // <<< --- FIM ADICIONAR HEADERS --- >>>

                 // Verifica token inválido/expirado
                 if (perfilResponse.status === 401 || perfilResponse.status === 403 || historicoResponse.status === 401 || historicoResponse.status === 403) {
                     console.error("Profile Error: Token inválido ou expirado (401/403).");
                     localStorage.removeItem('authToken');
                     if (logout) logout();
                     setError('Sua sessão expirou ou é inválida. Faça login novamente.');
                     setLoading(false);
                     return;
                 }


                // Tratamento de erro
                if (!perfilResponse.ok) {
                    const perfilErrorData = await perfilResponse.json().catch(()=>({message: 'Erro ao buscar perfil.'}));
                    throw new Error(`Perfil: ${perfilErrorData.message || perfilResponse.statusText}`);
                }
                 if (!historicoResponse.ok) {
                     const histErrorData = await historicoResponse.json().catch(()=>({message: 'Erro ao buscar histórico.'}));
                    throw new Error(`Histórico: ${histErrorData.message || historicoResponse.statusText}`);
                }

                const perfilData = await perfilResponse.json();
                const historicoData = await historicoResponse.json();
                setPolicial(perfilData);
                setHistorico(historicoData);
            } catch (error) {
                console.error("Erro ao buscar dados do perfil:", error);
                setError(`Falha ao carregar perfil: ${error.message}`);
                setPolicial(null); // Garante que não mostra dados antigos em caso de erro
                setHistorico([]);
            }
            finally { setLoading(false); }
        };

        // Roda apenas se user estiver definido
         if (user) {
            fetchData();
        } else if (user === null) {
            setError("Usuário não autenticado.");
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [profileId, user]); // Depende do ID do perfil e do usuário logado

    if (loading) return <div className="page-container"><p>Carregando perfil...</p></div>;
    // Mostra erro ANTES de checar 'policial'
    if (error) return <div className="page-container"><h1>Erro</h1><p className="error-message">{error}</p><Link to="/policia/policiais">Voltar para Lista</Link></div>;
    if (!policial) return <div className="page-container"><h1>Ops!</h1><p>Policial não encontrado.</p><Link to="/policia/policiais">Voltar para Lista</Link></div>;

    // Lógica para imagem do Habbo (ou placeholder)
    const habboUsername = policial.nome_completo?.replace(/\s+/g, '-'); // Adapta nome para URL Habbo
    const avatarUrl = habboUsername
        ? `https://www.habbo.com.br/habbo-imaging/avatarimage?user=${habboUsername}&action=std&direction=2&head_direction=2&gesture=sml&size=l`
        : '/placeholder-avatar.png'; // Use um placeholder se não conseguir gerar URL

    return (
        <div className="page-container">
            <div className="profile-grid">
                <aside className="profile-sidebar">
                    <div className="profile-card">
                        <div className="profile-avatar" style={{ backgroundImage: `url(${avatarUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                            {/* Opcional: <img src={avatarUrl} alt={`Avatar de ${policial.nome_completo}`} onError={(e)=>{e.target.onerror = null; e.target.src="/placeholder-avatar.png"}}/> */}
                        </div>
                        <h3>{policial.nome_completo}</h3>
                        <p className="profile-passaporte">Passaporte: {policial.passaporte}</p>
                        <div className="profile-info-grid">
                            <strong>Patente:</strong><span>{policial.patente || 'Não definida'}</span>
                            <strong>Corporação:</strong><span>{policial.corporacao || 'N/A'}</span>
                            <strong>Divisão:</strong><span>{policial.divisao || 'Não definida'}</span>
                            <strong>Status:</strong><span><span className={`status-pill status-${policial.status?.toLowerCase()}`}>{policial.status || 'N/A'}</span></span>
                        </div>
                         {/* Opcional: Botão para editar perfil se for o próprio usuário ou RH */}
                         {(user?.id === policial.id || user?.permissoes?.is_rh) && (
                            <Link to={`/policia/perfil/${policial.id}/editar`} className="btn-edit-profile" style={{marginTop: '15px', display: 'inline-block'}}>Editar Perfil</Link>
                         )}
                    </div>
                </aside>
                <main className="profile-main-content">
                    <div className="content-widget">
                        <h2 className="widget-title">Timeline do Policial</h2>
                        <Timeline events={historico} />
                    </div>
                </main>
            </div>
        </div>
    );
};
export default PoliceProfilePage;