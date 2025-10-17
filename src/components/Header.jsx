import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import './Header.css';

function Header() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <header className="main-header">
            <div className="header-left">
                <Link to="/" className="logo-container">
                    <img src="/brasao.png" alt="Brasão da Polícia" className="logo" />
                    <div className="logo-text">
                        <span>Polícia RP</span>
                        <small>Portal Oficial</small>
                    </div>
                </Link>
            </div>
            <nav className="main-nav-desktop">
                <NavLink to="/"><i className="fas fa-home"></i> Início</NavLink>
                <NavLink to="/batalhoes"><i className="fas fa-shield-alt"></i> Batalhões</NavLink>
                <NavLink to="/concursos"><i className="fas fa-file-signature"></i> Concursos</NavLink>
                <NavLink to="/juridico"><i className="fas fa-gavel"></i> Portal Jurídico</NavLink>
                {user && user.type === 'policial' && (
                    <NavLink to="/policia/dashboard" className="dashboard-link">
                        <i className="fas fa-tachometer-alt"></i> Dashboard
                    </NavLink>
                )}
            </nav>
            <div className="user-actions">
                {user ? (
                    <div className="user-info">
                        <div className="user-details">
                            <span className="user-name">{user.nome_completo}</span>
                            <span className="user-role">{user.patente || user.cargo}</span>
                        </div>
                        <button onClick={handleLogout} className="logout-button">
                            <i className="fas fa-sign-out-alt"></i> Sair
                        </button>
                    </div>
                ) : (
                    <Link to="/login" className="btn-login">Entrar</Link>
                )}
            </div>
        </header>
    );
}
export default Header;