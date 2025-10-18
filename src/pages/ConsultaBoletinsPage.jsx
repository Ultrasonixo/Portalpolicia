import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import '../components/ConsultaBoletins.css'; // Ajuste o caminho se necessário

const ConsultaBoletinsPage = () => {
    const { user, logout } = useAuth(); // Pegar usuário logado e logout
    const [boletins, setBoletins] = useState([]);
    const [filtro, setFiltro] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchBoletins = async () => {
            setLoading(true);
            setError(null);

            // <<< --- PEGAR TOKEN --- >>>
            const token = localStorage.getItem('authToken'); // Use a chave correta
            if (!token) {
                console.error("Consulta BOs Error: Token não encontrado.");
                setError('Erro de autenticação: Token não encontrado.');
                setLoading(false);
                // if(logout) logout();
                return;
            }
            const headers = { 'Authorization': `Bearer ${token}` };
            // <<< --- FIM PEGAR TOKEN --- >>>

             try {
                 // <<< --- ADICIONAR HEADERS --- >>>
                 const response = await fetch('http://localhost:3000/api/policia/boletins', { headers }); // Envia headers
                 // <<< --- FIM ADICIONAR HEADERS --- >>>

                  // Verifica token inválido/expirado
                 if (response.status === 401 || response.status === 403) {
                     console.error("Consulta BOs Error: Token inválido ou expirado (401/403).");
                     localStorage.removeItem('authToken');
                     if (logout) logout();
                     setError('Sua sessão expirou ou é inválida. Faça login novamente.');
                     setLoading(false);
                     return;
                 }


                 if (!response.ok) {
                    const errData = await response.json().catch(() => ({message: `Erro ${response.status}`}));
                    throw new Error(errData.message || 'Falha ao carregar os boletins.');
                 }
                 const data = await response.json();
                 setBoletins(data);
             } catch (err) {
                 console.error("Erro ao buscar boletins:", err);
                 setError(err.message);
             } finally {
                 setLoading(false);
             }
         };

         // Roda apenas se user estiver definido
         if (user) {
            fetchBoletins();
         } else if (user === null) {
            setError("Usuário não autenticado.");
            setLoading(false);
         }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]); // Depende do usuário

    const formatarData = (data) => data ? new Date(data).toLocaleString('pt-BR') : 'Inválida';

    const boletinsFiltrados = boletins.filter(bo =>
        (bo.protocolo?.toLowerCase() || '').includes(filtro.toLowerCase()) ||
        (bo.tipo?.toLowerCase() || '').includes(filtro.toLowerCase()) ||
        (bo.denunciante_nome?.toLowerCase() || '').includes(filtro.toLowerCase()) ||
        (bo.denunciante_passaporte?.toString() || '').includes(filtro) ||
        (bo.status?.toLowerCase() || '').includes(filtro.toLowerCase())
    );

    return (
        <div className="page-container">
            <h1 className="page-title">Consulta de Boletins de Ocorrência</h1>
            <p className="page-subtitle">Visualize e filtre todos os boletins registrados no sistema.</p>

            <div className="search-container">
                <i className="fas fa-search search-icon"></i>
                <input
                    type="text"
                    placeholder="Buscar por protocolo, tipo, status, denunciante..."
                    className="search-input"
                    value={filtro}
                    onChange={(e) => setFiltro(e.target.value)}
                />
            </div>

            {loading && <p style={{textAlign: 'center'}}>Carregando boletins...</p>}
            {error && <p className="error-message" style={{textAlign: 'center'}}>{error}</p>}

            {!loading && !error && (
                <div className="boletins-table-widget">
                    <div className="table-responsive">
                        <table className="boletins-table">
                            <thead>
                                <tr>
                                    <th>Protocolo</th><th>Tipo</th><th>Denunciante</th>
                                    <th>Passaporte</th><th>Data</th><th>Status</th><th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {boletinsFiltrados.length > 0 ? (
                                    boletinsFiltrados.map(bo => (
                                        <tr key={bo.id}>
                                            <td>{bo.protocolo}</td>
                                            <td>{bo.tipo}</td>
                                            <td>{bo.denunciante_nome || 'N/A'}</td>
                                            <td>{bo.denunciante_passaporte || 'N/A'}</td>
                                            <td>{formatarData(bo.data_registro)}</td>
                                            <td><span className={`status-badge status-${(bo.status || 'desconhecido').toLowerCase().replace(/ /g, '-')}`}>{bo.status || 'N/A'}</span></td>

                                            <td className="actions-cell">
                                                {/* Visualizar sempre disponível */}
                                                <Link to={`/policia/boletim/${bo.id}`} className="btn-action view" title="Visualizar Detalhes">
                                                    <i className="fas fa-eye"></i>
                                                </Link>

                                                {/* Editar/Assumir apenas se for PC */}
                                                {user?.corporacao === 'PC' && (
                                                    <Link
                                                        to={`/policia/boletim/${bo.id}`}
                                                        className="btn-action edit"
                                                        // O state define se abre em modo edição (se já tiver responsável)
                                                        // ou se mostra botão 'Assumir' (se não tiver responsável)
                                                        state={{ startInEditMode: !!bo.policial_responsavel_id }}
                                                        title={bo.policial_responsavel_id ? "Editar Boletim" : "Assumir Caso"}
                                                    >
                                                        <i className={`fas ${bo.policial_responsavel_id ? 'fa-pencil-alt' : 'fa-gavel'}`}></i>
                                                    </Link>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="7" style={{textAlign: 'center', color: '#64748b'}}>Nenhum boletim encontrado com os filtros aplicados.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ConsultaBoletinsPage;