// src/pages/AdminPage.jsx - VERSÃO HUB DE ADMINISTRAÇÃO
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ApprovalModal from '../components/ApprovalModal.jsx';
// Futuramente, criaremos modais para cada ação
import '../components/AdminPage.css';

const ActionCard = ({ title, description, icon, permission, onClick }) => {
    const { user } = useAuth();
    const hasPermission = user?.permissoes?.[permission];
    const cardContent = (
        <div className={`action-card ${!hasPermission ? 'disabled' : ''}`}>
            <div className="action-card-icon"><i className={`fas ${icon}`}></i></div>
            <div className="action-card-info">
                <h3>{title}</h3><p>{description}</p>
            </div>
        </div>
    );
    return hasPermission ? <div onClick={onClick} className="action-card-link" style={{cursor: 'pointer'}}>{cardContent}</div> : <div className="action-card-link">{cardContent}</div>;
};

const AdminPage = () => {
    const { user } = useAuth();
    const [recrutas, setRecrutas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRecruta, setSelectedRecruta] = useState(null);

    const fetchRecrutas = async () => { /* ... seu código original aqui ... */ };
    const handleConfirmApproval = async (id, patente, guarnicao) => { /* ... seu código original aqui ... */ };
    const handleReprovar = async (id) => { /* ... seu código original aqui ... */ };

    useEffect(() => {
        if (user?.permissoes?.setador) {
            fetchRecrutas();
        } else { setLoading(false); }
    }, [user]);

    if (!user?.permissoes?.is_rh) {
        return (
            <div className="page-container">
                <h1 className="page-title">Acesso Negado</h1>
                <p className="page-subtitle">Você não possui permissão para acessar esta área.</p>
            </div>
        );
    }

    return (
        <div className="page-container">
            <h1 className="page-title">Painel de Administração (RH)</h1>
            <p className="page-subtitle">Ferramentas de gerenciamento do departamento.</p>

            <div className="admin-hub-grid">
                <ActionCard title="Anunciar" description="Crie e publique anúncios." icon="fa-bullhorn" permission="anunciador" onClick={() => alert('Modal de Anúncios em breve!')} />
                <ActionCard title="Gerenciar Carreira" description="Promova ou rebaixe um policial." icon="fa-user-cog" permission="setador" onClick={() => alert('Modal de Gerenciamento em breve!')} />
                <ActionCard title="Demitir Policial" description="Remova o acesso de um policial." icon="fa-user-slash" permission="setador" onClick={() => alert('Modal de Demissão em breve!')} />
            </div>

            {user.permissoes.setador && (
                <div className="admin-table-widget">
                    <div className="widget-title">Recrutas em Análise</div>
                    <div className="table-responsive">
                        {/* Cole o JSX da sua tabela de recrutas original aqui */}
                    </div>
                </div>
            )}
            
            <ApprovalModal recruta={selectedRecruta} onClose={() => setSelectedRecruta(null)} onConfirm={handleConfirmApproval} />
        </div>
    );
};

export default AdminPage;