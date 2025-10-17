import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import '../components/PoliceDashboard.css';

const StatCard = ({ title, value, icon, color, loading }) => (
    <div className={`stat-card ${loading ? 'loading' : ''}`} style={{ borderLeftColor: color }}>
        <div className="stat-info">
            <span className="stat-title">{title}</span>
            <span className="stat-value">{loading ? '...' : value}</span>
        </div>
        <div className="stat-icon" style={{ backgroundColor: color }}><i className={`fas ${icon}`}></i></div>
    </div>
);
const QuickActionButton = ({ to, icon, text }) => ( <Link to={to} className="quick-action-button"><i className={`fas ${icon}`}></i><span>{text}</span></Link> );

const PoliceDashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({ totalBoletins: 0, boletinsAbertos: 0, policiaisAtivos: 0 });
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch('http://localhost:3000/api/policia/dashboard-stats');
                const data = await response.json();
                if (response.ok) setStats(data);
            } catch (error) {
                console.error("Falha ao buscar estatísticas:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const statCardsData = [
        { title: 'Total de Boletins', value: stats.totalBoletins, icon: 'fa-file-alt', color: '#0d6efd' },
        { title: 'Boletins Abertos', value: stats.boletinsAbertos, icon: 'fa-exclamation-triangle', color: '#ffc107' },
        { title: 'Concluídos', value: stats.totalBoletins - stats.boletinsAbertos, icon: 'fa-check-circle', color: '#198754' },
        { title: 'Policiais Ativos', value: stats.policiaisAtivos, icon: 'fa-users', color: '#0dcaf0' }
    ];

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
                        <h3 className="widget-title">Boletins Recentes</h3>
                        <p className="empty-state">Nenhum boletim registrado ainda.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default PoliceDashboard;