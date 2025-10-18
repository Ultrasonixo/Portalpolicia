// src/pages/ConsultaBoletinsPage.jsx - VERSÃO COM PERMISSÕES POR GUARNIÇÃO

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx'; // ✅ 1. IMPORTAR O useAuth
import '../components/ConsultaBoletins.css';

const ConsultaBoletinsPage = () => {
    const { user } = useAuth(); // ✅ 2. PEGAR OS DADOS DO USUÁRIO LOGADO
    const [boletins, setBoletins] = useState([]);
    const [filtro, setFiltro] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchBoletins = async () => {
            try {
                const response = await fetch('http://localhost:3000/api/policia/boletins');
                if (!response.ok) throw new Error('Falha ao carregar os dados.');
                const data = await response.json();
                setBoletins(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchBoletins();
    }, []);

    const formatarData = (data) => new Date(data).toLocaleString('pt-BR');

    const boletinsFiltrados = boletins.filter(bo =>
        bo.protocolo.toLowerCase().includes(filtro.toLowerCase())
    );

    return (
        <div className="page-container">
            <h1 className="page-title">Consulta de Boletins de Ocorrência</h1>
            <p className="page-subtitle">Visualize e filtre todos os boletins registrados no sistema.</p>
            
            <div className="search-container">
                <i className="fas fa-search search-icon"></i>
                <input
                    type="text"
                    placeholder="Buscar por protocolo..."
                    className="search-input"
                    value={filtro}
                    onChange={(e) => setFiltro(e.target.value)}
                />
            </div>

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
                            {loading && <tr><td colSpan="7">Carregando boletins...</td></tr>}
                            {error && <tr><td colSpan="7" className="error-row">{error}</td></tr>}
                            
                            {!loading && boletinsFiltrados.map(bo => (
                                <tr key={bo.id}>
                                    <td>{bo.protocolo}</td>
                                    <td>{bo.tipo}</td>
                                    <td>{bo.denunciante_nome}</td>
                                    <td>{bo.denunciante_passaporte}</td>
                                    <td>{formatarData(bo.data_registro)}</td>
                                    <td><span className={`status-badge status-${bo.status.toLowerCase().replace(/ /g, '-')}`}>{bo.status}</span></td>
                                    
                                    <td className="actions-cell">
                                        {/* O ícone de Olho sempre aparece para todos */}
                                        <Link to={`/policia/boletim/${bo.id}`} className="btn-action view" title="Visualizar Detalhes">
                                            <i className="fas fa-eye"></i>
                                        </Link>
                                        
                                        {/* ✅ 3. O LÁPIS SÓ APARECE SE A GUARNIÇÃO FOR "Policia Civil" */}
                                        {user?.guarnicao === 'Policia Civil' && (
                                            <Link 
                                                to={`/policia/boletim/${bo.id}`} 
                                                className="btn-action edit" 
                                                title="Editar Boletim"
                                                state={{ startInEditMode: true }} // Esta linha envia a instrução!
                                            >
                                                <i className="fas fa-pencil-alt"></i>
                                            </Link>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            
                            {!loading && boletinsFiltrados.length === 0 && (
                                <tr><td colSpan="7">Nenhum boletim encontrado.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ConsultaBoletinsPage;