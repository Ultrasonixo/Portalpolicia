import React, { useState, useEffect } from 'react';
import '../components/AdminPage.css';

// Botão de Ação (componente interno)
const ActionButton = ({ onClick, text, icon, type }) => (
    <button onClick={onClick} className={`action-btn ${type}`}>
        <i className={`fas ${icon}`}></i> {text}
    </button>
);

const AdminPage = () => {
    const [recrutas, setRecrutas] = useState([]);
    const [loading, setLoading] = useState(true);

    // DADOS DE EXEMPLO (no futuro, virão da API GET /api/admin/policiais?status=Em Análise)
    useEffect(() => {
        const fakeRecrutas = [
            { id: 1, nome_completo: 'Carlos Silva', passaporte: '12345', discord_id: 'carlos#123' },
            { id: 2, nome_completo: 'Ana Pereira', passaporte: '54321', discord_id: 'ana#321' },
        ];
        setRecrutas(fakeRecrutas);
        setLoading(false);
    }, []);

    const handleAprovar = (id) => {
        // Lógica para chamar a API: PUT /api/admin/policiais/:id/aprovar
        console.log(`Aprovar recruta com ID: ${id}`);
        setRecrutas(recrutas.filter(r => r.id !== id)); // Remove da lista (simulação)
    };

    const handleReprovar = (id) => {
        // Lógica para chamar a API e alterar status para 'Reprovado'
        console.log(`Reprovar recruta com ID: ${id}`);
        setRecrutas(recrutas.filter(r => r.id !== id)); // Remove da lista (simulação)
    };

    return (
        <div className="page-container">
            <h1 className="page-title">Administração de Recrutas</h1>
            <p className="page-subtitle">Aprove ou reprove os novos alistamentos pendentes.</p>

            <div className="admin-table-widget">
                <div className="widget-title">Recrutas em Análise</div>
                <div className="table-responsive">
                    <table className="recrutas-table">
                        <thead>
                            <tr>
                                <th>Nome Completo</th>
                                <th>Passaporte</th>
                                <th>Discord ID</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && <tr><td colSpan="4">Carregando...</td></tr>}
                            {!loading && recrutas.length === 0 && (
                                <tr><td colSpan="4">Nenhum recruta pendente.</td></tr>
                            )}
                            {recrutas.map(recruta => (
                                <tr key={recruta.id}>
                                    <td>{recruta.nome_completo}</td>
                                    <td>{recruta.passaporte}</td>
                                    <td>{recruta.discord_id}</td>
                                    <td className="actions-cell">
                                        <ActionButton onClick={() => handleAprovar(recruta.id)} text="Aprovar" icon="fa-check" type="approve" />
                                        <ActionButton onClick={() => handleReprovar(recruta.id)} text="Reprovar" icon="fa-times" type="reject" />
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

export default AdminPage;