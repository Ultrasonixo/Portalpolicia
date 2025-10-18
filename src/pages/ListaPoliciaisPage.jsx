// src/pages/ListaPoliciaisPage.jsx - VERSÃO ATUALIZADA COM GRID DE CARDS

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../components/ListaPoliciaisPage.css';

const ListaPoliciaisPage = () => {
    const [policiais, setPoliciais] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPoliciais = async () => {
            try {
                const response = await fetch('http://localhost:3000/api/policia/policiais');
                if (!response.ok) {
                    throw new Error('Falha ao carregar a lista de policiais.');
                }
                const data = await response.json();
                setPoliciais(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchPoliciais();
    }, []);

    if (loading) return <div className="page-container"><p>Carregando lista de policiais...</p></div>;
    if (error) return <div className="page-container"><p className="error-message">{error}</p></div>;

    return (
        <div className="page-container">
            <h1 className="page-title">Corpo Policial</h1>
            <p className="page-subtitle">Lista de todos os oficiais ativos no departamento.</p>

            {/* ✅ TROCAMOS A TABELA POR ESTA DIV COM GRID */}
            <div className="policiais-grid">
                {policiais.map(policial => (
                    // Cada card é um link para o perfil do policial
                    <Link to={`/policia/perfil/${policial.id}`} key={policial.id} className="policial-card-link">
                        <div className="policial-card">
                            <div className="policial-avatar">
                                {/* Usamos um ícone padrão do Font Awesome */}
                                <i className="fas fa-user-shield"></i>
                            </div>
                            <div className="policial-info">
                                <h3 className="policial-nome">{policial.nome_completo}</h3>
                                <p className="policial-patente">{policial.patente}</p>
                                <p className="policial-guarnicao">{policial.guarnicao}</p>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default ListaPoliciaisPage;