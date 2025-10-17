import React from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import '../components/PoliceDashboard.css';

const StatCard = ({ title, value, icon, color }) => (
    <div className="stat-card" style={{ borderLeftColor: color }}>
        <div className="stat-info"><span className="stat-title">{title}</span><span className="stat-value">{value}</span></div>
        <div className="stat-icon" style={{ backgroundColor: color }}><i className={`fas ${icon}`}></i></div>
    </div>
);

const PoliceDashboard = () => {
    const { user } = useAuth();
    const stats = [
        { title: 'Total de Boletins', value: 0, icon: 'fa-file-alt', color: '#0d6efd' },
        { title: 'Boletins Abertos', value: 0, icon: 'fa-exclamation-triangle', color: '#ffc107' },
        { title: 'Policiais Ativos', value: 2, icon: 'fa-users', color: '#0dcaf0' }
    ];

    return (
        <div className="page-container">
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">Visão geral das operações, {user?.nome_completo}.</p>
            <div className="stats-grid">{stats.map(stat => <StatCard key={stat.title} {...stat} />)}</div>
        </div>
    );
};
export default PoliceDashboard;