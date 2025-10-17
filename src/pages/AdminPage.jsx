import React, { useState, useEffect } from 'react';
import ApprovalModal from '../components/ApprovalModal.jsx'; // 1. Importe o modal
import '../components/AdminPage.css';

const ActionButton = ({ onClick, text, icon, type }) => (
    <button onClick={onClick} className={`action-btn ${type}`}><i className={`fas ${icon}`}></i> {text}</button>
);

const AdminPage = () => {
    const [recrutas, setRecrutas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRecruta, setSelectedRecruta] = useState(null); // 2. Estado para controlar o modal

    const fetchRecrutas = async () => { /* ... (seu código de fetch continua o mesmo) ... */ };
    useEffect(() => { fetchRecrutas(); }, []);

    // 3. Função chamada pelo modal para confirmar a aprovação
    const handleConfirmApproval = async (id, patente, guarnicao) => {
        try {
            await fetch(`http://localhost:3000/api/admin/recrutas/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ novoStatus: 'Aprovado', patente, guarnicao }),
            });
            fetchRecrutas(); // Atualiza a lista
        } catch (error) {
            console.error("Falha ao aprovar recruta:", error);
        } finally {
            setSelectedRecruta(null); // Fecha o modal
        }
    };

    const handleReprovar = async (id) => { /* ... (seu código de reprovar continua o mesmo) ... */ };

    return (
        <div className="page-container">
            <h1 className="page-title">Administração de Recrutas</h1>
            <p className="page-subtitle">Aprove ou reprove os novos alistamentos pendentes.</p>
            <div className="admin-table-widget">
                <div className="widget-title">Recrutas em Análise</div>
                <div className="table-responsive">
                    <table className="recrutas-table">
                        <thead>
                            <tr><th>Nome Completo</th><th>Passaporte</th><th>Discord ID</th><th>Ações</th></tr>
                        </thead>
                        <tbody>
                            {loading && <tr><td colSpan="4">Carregando...</td></tr>}
                            {!loading && recrutas.length === 0 && (<tr><td colSpan="4">Nenhum recruta pendente.</td></tr>)}
                            {recrutas.map(recruta => (
                                <tr key={recruta.id}>
                                    <td>{recruta.nome_completo}</td>
                                    <td>{recruta.passaporte}</td>
                                    <td>{recruta.discord_id}</td>
                                    <td className="actions-cell">
                                        {/* 4. O botão agora abre o modal */}
                                        <ActionButton onClick={() => setSelectedRecruta(recruta)} text="Aprovar" icon="fa-check" type="approve" />
                                        <ActionButton onClick={() => handleReprovar(recruta.id)} text="Reprovar" icon="fa-times" type="reject" />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {/* 5. Renderiza o modal */}
            <ApprovalModal 
                recruta={selectedRecruta} 
                onClose={() => setSelectedRecruta(null)} 
                onConfirm={handleConfirmApproval} 
            />
        </div>
    );
};
export default AdminPage;