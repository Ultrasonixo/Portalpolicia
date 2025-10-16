import React from 'react';
import { Link } from 'react-router-dom';
import ServicesGrid from '../components/ServicesGrid.jsx';
import './HomePage.css';

function HomePage() {
    return (
        <>
            <section className="hero-section">
                <div className="hero-overlay"></div>
                <div className="hero-content">
                    <h1>Polícia RP</h1>
                    <h2>Portal Oficial</h2>
                    <p>Servindo e protegendo a comunidade com excelência, transparência e compromisso.</p>
                    <div className="hero-buttons">
                        <Link to="/denunciar" className="btn btn-denunciar">
                            <i className="fas fa-bullhorn"></i> Denunciar Crime
                        </Link>
                        <Link to="/boletim" className="btn btn-registrar">
                            <i className="fas fa-file-alt"></i> Registrar B.O.
                        </Link>
                    </div>
                </div>
                <div className="hero-wave">
                    <svg data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
                        <path d="M985.66,92.83C906.67,72,823.78,31,743.84,14.19c-82.26-17.34-168.06-16.33-250.45.39-57.84,11.73-114,31.07-172,41.86A600.21,600.21,0,0,1,0,27.35V120H1200V95.8C1132.19,118.92,1055.71,111.31,985.66,92.83Z" className="shape-fill"></path>
                    </svg>
                </div>
            </section>
            
            <ServicesGrid />
        </>
    );
}

export default HomePage;