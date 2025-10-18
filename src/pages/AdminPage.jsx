// src/pages/AdminPage.jsx - VERSÃO HUB (CONECTADO À PÁGINA DE LOGS)

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // <<< IMPORTAR useNavigate
import { useAuth } from '../context/AuthContext.jsx';
import ApprovalModal from '../components/ApprovalModal.jsx';
import GerenciarPolicialModal from '../components/GerenciarPolicialModal.jsx';
import RecruitListModal from '../components/RecruitListModal.jsx';
import AnuncioModal from '../components/AnuncioModal.jsx';
import DemitirModal from '../components/DemitirModal.jsx';
import GenerateTokenModal from '../components/GenerateTokenModal.jsx';

import '../components/AdminPage.css'; // Apenas CSS da Admin Page

// Componente ActionCard (inalterado)
const ActionCard = ({ title, description, icon, permission, onClick }) => {
    const { user } = useAuth();
    const hasPermission = user?.permissoes?.[permission] || user?.permissoes?.is_rh;
    const cardContent = (
        <div className={`action-card ${!hasPermission ? 'disabled' : ''}`}>
            <div className="action-card-icon"><i className={`fas ${icon}`}></i></div>
            <div className="action-card-info">
                <h3>{title}</h3><p>{description}</p>
            </div>
        </div>
    );
    const handleClick = hasPermission ? onClick : undefined;
    const cursorStyle = hasPermission ? 'pointer' : 'not-allowed';
    return <div onClick={handleClick} className="action-card-link" style={{cursor: cursorStyle}}>{cardContent}</div>;
};


const AdminPage = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate(); // <<< INICIAR O HOOK DE NAVEGAÇÃO

    // --- Estados para os Modais ---
    const [selectedRecrutaForApproval, setSelectedRecrutaForApproval] = useState(null);
    const [isGerenciarModalOpen, setIsGerenciarModalOpen] = useState(false);
    const [isRecruitListModalOpen, setIsRecruitListModalOpen] = useState(false);
    const [isAnuncioModalOpen, setIsAnuncioModalOpen] = useState(false);
    const [isDemitirModalOpen, setIsDemitirModalOpen] = useState(false);
    const [isGenerateTokenModalOpen, setIsGenerateTokenModalOpen] = useState(false);
    // --- Lógica de Logs foi REMOVIDA daqui ---

    // --- Funções Handler dos Modais (inalteradas) ---
    const handleOpenApprovalModal = (recruta) => { setSelectedRecrutaForApproval(recruta); setIsRecruitListModalOpen(false); };
    const handleConfirmApprovalFinal = async (id, divisao) => { /* ... (código completo da resposta anterior) ... */ };
    const handleReprovar = async (id) => { /* ... (código completo da resposta anterior) ... */ };
    // --- Fim Handlers Modais ---


    // Verifica se tem permissão de RH
    if (!user?.permissoes?.is_rh) {
         return (
            <div className="page-container">
                <h1 className="page-title">Acesso Negado</h1>
                <p className="page-subtitle">Apenas administradores RH podem aceder a esta área.</p>
            </div>
        );
    }

    // Renderização Principal (Apenas Cards e Modais)
    return (
        <div className="page-container">
            <h1 className="page-title">Painel de Administração ({user.corporacao || 'RH Geral'})</h1>
            <p className="page-subtitle">Ferramentas de gerenciamento do departamento.</p>

            {/* Grid de Ações (Cards) */}
            <div className="admin-hub-grid">
                 <ActionCard title="Gerar Token Registo" description="Crie tokens para alistamento." icon="fa-key" permission="is_rh" onClick={() => setIsGenerateTokenModalOpen(true)} />
                 <ActionCard title="Aprovar Recrutas" description="Analise alistamentos." icon="fa-user-check" permission="is_rh" onClick={() => setIsRecruitListModalOpen(true)} />
                 <ActionCard title="Gerenciar Carreira" description="Promova/rebaixe policiais." icon="fa-user-cog" permission="is_rh" onClick={() => setIsGerenciarModalOpen(true)} />
                 <ActionCard title="Anunciar" description="Crie anúncios." icon="fa-bullhorn" permission="is_rh" onClick={() => setIsAnuncioModalOpen(true)} />
                 <ActionCard title="Demitir Policial" description="Remova acesso policial." icon="fa-user-slash" permission="is_rh" onClick={() => setIsDemitirModalOpen(true)} />

                 {/* <<< CARD DE LOGS ATUALIZADO PARA NAVEGAR >>> */}
                 <ActionCard
                    title="Logs Auditoria" // Título
                    description="Visualize o registo de ações."
                    icon="fa-clipboard-list" // Ícone
                    permission="is_rh" // Apenas RH
                    onClick={() => navigate('/policia/logs')} // <<< Ação: Navegar para a página de logs
                 />
            </div>

            {/* Modais */}
            <ApprovalModal recruta={selectedRecrutaForApproval} onClose={() => setSelectedRecrutaForApproval(null)} onConfirm={handleConfirmApprovalFinal} />
            <GerenciarPolicialModal isOpen={isGerenciarModalOpen} onClose={() => setIsGerenciarModalOpen(false)} />
            <RecruitListModal isOpen={isRecruitListModalOpen} onClose={() => setIsRecruitListModalOpen(false)} onApproveClick={handleOpenApprovalModal} onRejectClick={handleReprovar} />
            <AnuncioModal isOpen={isAnuncioModalOpen} onClose={() => setIsAnuncioModalOpen(false)} />
            <DemitirModal isOpen={isDemitirModalOpen} onClose={() => setIsDemitirModalOpen(false)} />
            <GenerateTokenModal isOpen={isGenerateTokenModalOpen} onClose={() => setIsGenerateTokenModalOpen(false)} />
        </div>
    );
};

export default AdminPage;