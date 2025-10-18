// src/components/Sidebar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import './PoliceLayout.css';

const Sidebar = () => {
    const { user, logout } = useAuth();
    return (
        <aside className="sidebar">
            <div className="sidebar-header"><h3>SSP-RP</h3><span>Painel de Controle</span></div>
            <nav className="sidebar-nav">
                <NavLink to="/policia/dashboard"><i className="fas fa-tachometer-alt"></i> Dashboard</NavLink>
                <NavLink to="/policia/boletins"><i className="fas fa-file-alt"></i> Boletins</NavLink>
                <NavLink to="/policia/policiais"><i className="fas fa-users"></i> Policiais</NavLink>
                <NavLink to="/policia/relatorios"><i className="fas fa-chart-pie"></i> Relatórios</NavLink>
                {user && <NavLink to={`/policia/perfil/${user.id}`}><i className="fas fa-user-circle"></i> Meu Perfil</NavLink>}
                {/* O LINK SÓ APARECE SE O USUÁRIO FOR DO RH */}
                {user?.permissoes?.is_rh && (
                    <NavLink to="/policia/admin"><i className="fas fa-user-shield"></i> Administração</NavLink>
                )}
            </nav>
            <div className="sidebar-footer">
                <button onClick={logout} className="logout-button-sidebar"><i className="fas fa-sign-out-alt"></i> Sair</button>
            </div>
        </aside>
    );
};
export default Sidebar;