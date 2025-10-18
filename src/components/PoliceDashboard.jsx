// src/pages/PoliceDashboard.jsx - VERSÃO COM JSX CORRIGIDO

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import '../components/PoliceDashboard.css';

// ... (Componentes StatCard e QuickActionButton continuam os mesmos)
const StatCard = ({ title, value, icon, color, loading }) => ( <div className={`stat-card ${loading ? 'loading' : ''}`} style={{ borderLeftColor: color }}> <div className="stat-info"> <span className="stat-title">{title}</span> <span className="stat-value">{loading ? '...' : value}</span> </div> <div className="stat-icon" style={{ backgroundColor: color }}><i className={`fas ${icon}`}></i></div> </div> );
const QuickActionButton = ({ to, icon, text }) => ( <Link to={to} className="quick-action-button"> <i className={`fas ${icon}`}></i> <span>{text}</span> </Link> );

const PoliceDashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({ totalBoletins: 0, boletinsAbertos: 0, policiaisAtivos: 0 });
    const [anuncios, setAnuncios] = useState([]);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsResponse, anunciosResponse] = await Promise.all([
                    fetch('http://localhost:3000/api/policia/dashboard-stats'),
                    fetch('http://localhost:3000/api/anuncios')
                ]);
                if (!statsResponse.ok || !anunciosResponse.ok) { throw new Error('Falha ao carregar dados.'); }
                const statsData = await statsResponse.json();
                const anunciosData = await anunciosResponse.json();
                setStats(statsData);
                setAnuncios(anunciosData);
            } catch (error) { console.error("Erro:", error); } 
            finally { setLoading(false); }
        };
        fetchData();
    }, []);

    const statCardsData = [
        { title: 'Total de Boletins', value: stats.totalBoletins, icon: 'fa-file-alt', color: '#0d6efd' },
        { title: 'Boletins Abertos', value: stats.boletinsAbertos, icon: 'fa-exclamation-triangle', color: '#ffc107' },
        { title: 'Concluídos', value: stats.totalBoletins - stats.boletinsAbertos, icon: 'fa-check-circle', color: '#198754' },
        { title: 'Policiais Ativos', value: stats.policiaisAtivos, icon: 'fa-users', color: '#0dcaf0' }
    ];
    
    const formatarData = (data) => new Date(data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

    return (
        <div className="page-container">
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">Visão geral das operações e estatísticas, {user?.nome_completo}.</p>
            
            <div className="stats-grid">
                {statCardsData.map(stat => <StatCard key={stat.title} {...stat} loading={loading} />)}
            </div>
            
            <div className="dashboard-columns">
                <div className="column-left">
                    <div className="dashboard-widget">
                        <h3 className="widget-title">Ações Rápidas</h3>
                        <div className="quick-actions-grid">
                            <QuickActionButton to="/policia/boletins" icon="fa-file-signature" text="Consultar B.O.s" />
                            <QuickActionButton to="/policia/policiais" icon="fa-address-book" text="Ver Policiais" />
                            <QuickActionButton to="/policia/relatorios/novo" icon="fa-pen-to-square" text="Criar Relatório" />
                            <QuickActionButton to="/policia/admin" icon="fa-user-shield" text="Administração" />
                        </div>
                    </div>
                </div>

                <div className="column-right">
                    <div className="dashboard-widget">
                        <h3 className="widget-title">Anúncios Recentes</h3>
                        {loading ? (<p>Carregando anúncios...</p>) : 
                         anuncios.length > 0 ? (
                            anuncios.map(anuncio => (
                                // ✅ ESTRUTURA HTML CORRIGIDA AQUI ✅
                                <div key={anuncio.id} className="anuncio-card">
                                    <div className="anuncio-header">
                                        <h4>{anuncio.titulo}</h4>
                                        <p className="anuncio-meta">
                                            Publicado por <strong>{anuncio.autor_nome || 'Administração'}</strong> em {formatarData(anuncio.data_publicacao)}
                                        </p>
                                    </div>
                                    <p className="anuncio-conteudo">{anuncio.conteudo}</p>
                                </div>
                            ))
                        ) : (
                            <p className="empty-state">Nenhum anúncio recente.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
export default PoliceDashboard;