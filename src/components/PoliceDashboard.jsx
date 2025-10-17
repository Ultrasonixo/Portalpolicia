import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import '../components/PoliceDashboard.css'; // Usaremos este CSS

// Card de Estatística (componente interno)
const StatCard = ({ title, value, icon, color }) => (
    <div className="stat-card" style={{ borderLeftColor: color }}>
        <div className="stat-info">
            <span className="stat-title">{title}</span>
            <span className="stat-value">{value}</span>
        </div>
        <div className="stat-icon" style={{ backgroundColor: color }}>
            <i className={`fas ${icon}`}></i>
        </div>
    </div>
);

// Componente para Ações Rápidas
const QuickActionButton = ({ to, icon, text }) => (
    <Link to={to} className="quick-action-button">
        <i className={`fas ${icon}`}></i>
        <span>{text}</span>
    </Link>
);


const PoliceDashboard = () => {
    const { user } = useAuth();

    // DADOS DE EXEMPLO (no futuro, virão da sua API)
    const stats = [
        { title: 'Total de Boletins', value: 12, icon: 'fa-file-alt', color: '#0d6efd' },
        { title: 'Boletins Abertos', value: 3, icon: 'fa-exclamation-triangle', color: '#ffc107' },
        { title: 'Concluídos', value: 9, icon: 'fa-check-circle', color: '#198754' },
        { title: 'Policiais Ativos', value: 47, icon: 'fa-users', color: '#0dcaf0' }
    ];

    const recentBoletins = [
        { id: 1, tipo: 'Furto', local: 'Loja 24/7, Centro', status: 'Em Análise' },
        { id: 2, tipo: 'Agressão', local: 'Praça da Sé', status: 'Em Análise' },
    ];

    const announcements = [
        { id: 1, title: 'Nova Diretriz de Patrulhamento', date: '17/10/2025', author: 'Comando Geral' },
    ];

    return (
        <div className="page-container">
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">Visão geral das operações e estatísticas, {user?.nome_completo}.</p>

            <div className="stats-grid">
                {stats.map(stat => <StatCard key={stat.title} {...stat} />)}
            </div>

            <div className="dashboard-columns">
                {/* Coluna da Esquerda */}
                <div className="column-left">
                    <div className="dashboard-widget">
                        <h3 className="widget-title">Ações Rápidas</h3>
                        <div className="quick-actions-grid">
                            <QuickActionButton to="/policia/boletins/novo" icon="fa-plus-circle" text="Criar Novo Boletim" />
                            <QuickActionButton to="/policia/policiais" icon="fa-address-book" text="Ver Policiais" />
                            <QuickActionButton to="/policia/relatorios/novo" icon="fa-pen-to-square" text="Criar Relatório" />
                            <QuickActionButton to="/policia/documentos" icon="fa-book" text="Ver Documentos" />
                        </div>
                    </div>

                    <div className="dashboard-widget">
                        <h3 className="widget-title">Mural de Anúncios</h3>
                        <ul className="announcement-list">
                            {announcements.map(item => (
                                <li key={item.id}>
                                    <div className="announcement-icon"><i className="fas fa-bullhorn"></i></div>
                                    <div className="announcement-details">
                                        <strong>{item.title}</strong>
                                        <span>Postado por {item.author} em {item.date}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Coluna da Direita */}
                <div className="column-right">
                    <div className="dashboard-widget">
                        <h3 className="widget-title">Boletins Recentes</h3>
                        <ul className="boletim-list">
                            {recentBoletins.map(bo => (
                                <li key={bo.id}>
                                    <div className="boletim-icon"><i className="fas fa-file-signature"></i></div>
                                    <div className="boletim-details">
                                        <strong>{bo.tipo}</strong>
                                        <span>{bo.local}</span>
                                    </div>
                                    <span className="boletim-status">{bo.status}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PoliceDashboard;