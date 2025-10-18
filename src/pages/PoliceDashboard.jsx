// src/pages/PoliceDashboard.jsx - VERSÃO COM TOKEN JWT CORRIGIDA

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import '../components/PoliceDashboard.css';

// Componente StatCard (inalterado)
const StatCard = ({ title, value, icon, color, loading }) => ( <div className={`stat-card ${loading ? 'loading' : ''}`} style={{ borderLeftColor: color }}> <div className="stat-info"> <span className="stat-title">{title}</span> <span className="stat-value">{loading ? '...' : value}</span> </div> <div className="stat-icon" style={{ backgroundColor: color }}><i className={`fas ${icon}`}></i></div> </div> );

// Componente QuickActionButton (inalterado)
const QuickActionButton = ({ to, icon, text }) => ( <Link to={to} className="quick-action-button"> <i className={`fas ${icon}`}></i> <span>{text}</span> </Link> );

const PoliceDashboard = () => {
    const { user, logout } = useAuth(); // Adicionado logout para caso de token inválido
    const [stats, setStats] = useState({ totalBoletins: 0, boletinsAbertos: 0, policiaisAtivos: 0 });
    const [anuncios, setAnuncios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);

            // <<< --- PEGAR TOKEN DO LOCALSTORAGE --- >>>
            // Use a mesma chave que foi usada no LoginPolicial.jsx
            const token = localStorage.getItem('authToken');

            if (!token) {
                console.error("Dashboard Error: Token não encontrado no localStorage."); // Log de erro
                setError('Erro de autenticação: Token não encontrado. Faça login novamente.');
                setLoading(false);
                // Opcional: Deslogar se não houver token
                // if (logout) logout();
                return;
            }

            // Cria os headers com o token
            const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            };
            // <<< --- FIM PEGAR TOKEN --- >>>

            try {
                // Adiciona headers às requisições
                const [statsResponse, anunciosResponse] = await Promise.all([
                    fetch('http://localhost:3000/api/policia/dashboard-stats', { headers }),
                    fetch('http://localhost:3000/api/anuncios', { headers })
                ]);

                // Verifica se o token foi rejeitado (401 ou 403)
                 if (statsResponse.status === 401 || statsResponse.status === 403 || anunciosResponse.status === 401 || anunciosResponse.status === 403) {
                     console.error("Dashboard Error: Token inválido ou expirado (recebido 401/403).");
                     localStorage.removeItem('authToken'); // Limpa o token inválido
                     if (logout) logout(); // Desloga o usuário
                     setError('Sua sessão expirou ou é inválida. Faça login novamente.');
                     setLoading(false);
                     return;
                 }


                // Tratamento de erro robusto
                if (!statsResponse.ok) {
                    const statsErrorData = await statsResponse.json().catch(() => ({ message: `Erro ${statsResponse.status} ao buscar estatísticas` }));
                    throw new Error(`Estatísticas: ${statsErrorData.message || statsResponse.statusText}`);
                }
                 if (!anunciosResponse.ok) {
                    const anunciosErrorData = await anunciosResponse.json().catch(() => ({ message: `Erro ${anunciosResponse.status} ao buscar anúncios` }));
                    throw new Error(`Anúncios: ${anunciosErrorData.message || anunciosResponse.statusText}`);
                }

                const statsData = await statsResponse.json();
                const anunciosData = await anunciosResponse.json();

                setStats(statsData);
                setAnuncios(anunciosData);

            } catch (error) {
                console.error("Erro ao buscar dados do dashboard:", error);
                setError(`Falha ao carregar dados do painel: ${error.message}`);
            } finally {
                setLoading(false);
            }
        };

        // Roda fetchData apenas se user estiver definido (após o AuthContext carregar)
        if (user) {
             fetchData();
        } else if (user === null) { // Se user for null (não logado ou deslogado)
             setError("Usuário não autenticado.");
             setLoading(false);
        }
        // Se user for undefined (inicializando), espera

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]); // Dependência no usuário do contexto

    const statCardsData = [
        { title: 'Total de Boletins', value: stats.totalBoletins, icon: 'fa-file-alt', color: '#0d6efd' },
        { title: 'Boletins Abertos', value: stats.boletinsAbertos, icon: 'fa-exclamation-triangle', color: '#ffc107' },
        { title: 'Concluídos', value: stats.totalBoletins - stats.boletinsAbertos, icon: 'fa-check-circle', color: '#198754' },
        { title: 'Policiais Ativos', value: stats.policiaisAtivos, icon: 'fa-users', color: '#0dcaf0' }
    ];

    const formatarData = (data) => data ? new Date(data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Data inválida';

    return (
        <div className="page-container">
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">Visão geral das operações e estatísticas, {user?.nome_completo || 'Policial'}.</p>

            {error && <p className="error-message" style={{textAlign: 'center', marginBottom: '20px', background: '#f8d7da', color: '#721c24', padding: '10px', borderRadius: '5px'}}>{error}</p>}

            <div className="stats-grid">
                {statCardsData.map(stat => <StatCard key={stat.title} {...stat} loading={loading && !error} />)}
            </div>

            <div className="dashboard-columns">
                <div className="column-left">
                    <div className="dashboard-widget">
                        <h3 className="widget-title">Ações Rápidas</h3>
                        <div className="quick-actions-grid">
                            <QuickActionButton to="/policia/boletins" icon="fa-file-signature" text="Consultar B.O.s" />
                            <QuickActionButton to="/policia/policiais" icon="fa-address-book" text="Ver Policiais" />
                            {(user?.permissoes?.is_rh || user?.permissoes?.setador || user?.permissoes?.anunciador) && (
                                <QuickActionButton to="/policia/admin" icon="fa-user-shield" text="Administração" />
                            )}
                        </div>
                    </div>
                </div>

                <div className="column-right">
                    <div className="dashboard-widget">
                        <h3 className="widget-title">Anúncios Recentes</h3>
                        {(loading && !error) ? (<p>Carregando anúncios...</p>) :
                         !error && anuncios.length > 0 ? (
                            anuncios.map(anuncio => (
                                <div key={anuncio.id} className="anuncio-card">
                                    <div className="anuncio-header">
                                        <h4>{anuncio.titulo}</h4>
                                        <p className="anuncio-conteudo">{anuncio.conteudo}</p>
                                    </div>
                                    <p className="anuncio-meta">
                                        Publicado por <strong>{anuncio.autor_nome || 'Administração'}</strong> em {formatarData(anuncio.data_publicacao)}
                                    </p>
                                </div>
                            ))
                        ) : !error ? (
                            <p className="empty-state">Nenhum anúncio recente.</p>
                        ): null }
                    </div>
                </div>
            </div>
        </div>
    );
};
export default PoliceDashboard;