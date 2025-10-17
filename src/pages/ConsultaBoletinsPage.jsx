// src/pages/ConsultaBoletinsPage.jsx

import React, { useState, useEffect } from 'react';
import '../components/ConsultaBoletins.css'; // Usaremos este CSS

const ConsultaBoletinsPage = () => {
    const [boletins, setBoletins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchBoletins = async () => {
            try {
                // Chama a nova rota que criamos no backend
                const response = await fetch('http://localhost:3000/api/policia/boletins');
                if (!response.ok) {
                    throw new Error('Falha ao carregar os dados.');
                }
                const data = await response.json();
                setBoletins(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchBoletins();
    }, []); // O array vazio [] faz com que a busca aconteça uma vez quando a página carrega

    // Função para formatar a data
    const formatarData = (data) => {
        return new Date(data).toLocaleString('pt-BR');
    };

    return (
        <div className="page-container">
            <h1 className="page-title">Consulta de Boletins de Ocorrência</h1>
            <p className="page-subtitle">Visualize todos os boletins registrados no sistema.</p>

            <div className="boletins-table-widget">
                <div className="table-responsive">
                    <table className="boletins-table">
                        <thead>
                            <tr>
                                <th>Protocolo</th>
                                <th>Tipo</th>
                                <th>Denunciante</th>
                                <th>Passaporte</th>
                                <th>Data</th>
                                <th>Status</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && <tr><td colSpan="7">Carregando boletins...</td></tr>}
                            {error && <tr><td colSpan="7" className="error-row">{error}</td></tr>}
                            {!loading && boletins.length === 0 && (
                                <tr><td colSpan="7">Nenhum boletim de ocorrência encontrado.</td></tr>
                            )}
                            {boletins.map(bo => (
                                <tr key={bo.id}>
                                    <td>{bo.protocolo}</td>
                                    <td>{bo.tipo}</td>
                                    <td>{bo.denunciante_nome}</td>
                                    <td>{bo.denunciante_passaporte}</td>
                                    <td>{formatarData(bo.data_registro)}</td>
                                    <td><span className={`status-badge status-${bo.status.toLowerCase().replace(' ', '-')}`}>{bo.status}</span></td>
                                    <td className="actions-cell">
                                        <button className="btn-action view" title="Visualizar Detalhes">
                                            <i className="fas fa-eye"></i>
                                        </button>
                                        <button className="btn-action edit" title="Alterar Status">
                                            <i className="fas fa-pencil-alt"></i>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ConsultaBoletinsPage;