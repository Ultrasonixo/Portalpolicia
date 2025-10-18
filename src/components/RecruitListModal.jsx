// src/components/RecruitListModal.jsx - VERSÃO COM TOKEN JWT
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx'; // Importar useAuth para logout
import './Modal.css';
import './AdminPage.css';

const RecruitListModal = ({ isOpen, onClose, onApproveClick, onRejectClick }) => {
    const { logout } = useAuth(); // Usar logout do contexto
    const [recrutas, setRecrutas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            setError('');
            setRecrutas([]);

            // <<< --- PEGAR TOKEN --- >>>
            const token = localStorage.getItem('authToken'); // Use a chave correta
            if (!token) {
                console.error("RecruitList Modal Error: Token não encontrado.");
                setError('Erro de autenticação: Token não encontrado.');
                setLoading(false);
                // Opcional: Deslogar ou fechar
                // if(logout) logout();
                // onClose();
                return;
            }
            // <<< --- FIM PEGAR TOKEN --- >>>

            // <<< --- CRIAR HEADERS --- >>>
            const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json' // Manter se necessário
            };
            // <<< --- FIM CRIAR HEADERS --- >>>

            // <<< --- ADICIONAR HEADERS AO FETCH --- >>>
            fetch('http://localhost:3000/api/admin/recrutas', { headers }) // Envia os headers
                .then(async res => { // Tornar async para usar await no .json() do erro
                    // Verifica token inválido/expirado PRIMEIRO
                    if (res.status === 401 || res.status === 403) {
                        console.error("RecruitList Modal Error: Token inválido ou expirado (401/403).");
                        localStorage.removeItem('authToken');
                        if (logout) logout();
                        throw new Error('Sessão inválida. Faça login novamente.'); // Lança erro para o catch
                    }
                    if (!res.ok) {
                        // Tenta ler a mensagem de erro do backend
                        const errData = await res.json().catch(() => ({ message: `Erro HTTP ${res.status}` }));
                        throw new Error(errData.message || 'Falha ao buscar recrutas.'); // Lança erro para o catch
                    }
                    return res.json(); // Continua se a resposta for OK
                })
                .then(data => {
                    setRecrutas(data);
                })
                .catch(err => {
                    console.error("Erro no fetch de recrutas:", err);
                    setError(err.message || 'Erro ao carregar recrutas.');
                 })
                .finally(() => {
                    setLoading(false);
                });
            // <<< --- FIM ADICIONAR HEADERS --- >>>
        }
    // Adiciona logout à dependência
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, logout]); // Depende de isOpen e logout (estável com useCallback)

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{maxWidth: '750px', minWidth: '600px'}}>
                <div className="modal-header">
                    <h3>Recrutas Pendentes de Análise</h3>
                    <button onClick={onClose} className="close-btn">&times;</button>
                </div>
                <div className="modal-body">
                    {loading && <p style={{textAlign: 'center'}}>Carregando...</p>}
                    {/* Exibe erro se houver */}
                    {error && <p className="error-message" style={{textAlign: 'center'}}>{error}</p>}
                    {/* Só mostra a tabela/mensagem "nenhum pendente" se NÃO estiver carregando E NÃO houver erro */}
                    {!loading && !error && (
                        recrutas.length === 0 ? (
                            <p style={{textAlign: 'center', color: '#94a3b8'}}>Nenhum recruta pendente no momento.</p>
                        ) : (
                            <div className="table-responsive">
                                <table className="recrutas-table">
                                    <thead>
                                        <tr>
                                            <th>Nome Completo</th>
                                            <th>Passaporte</th>
                                            <th>Discord</th>
                                            <th style={{width: '210px'}}>Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recrutas.map(recruta => (
                                            <tr key={recruta.id}>
                                                <td>{recruta.nome_completo}</td>
                                                <td>{recruta.passaporte}</td>
                                                <td>{recruta.discord_id}</td>
                                                <td className="actions-cell">
                                                    <button onClick={() => onApproveClick(recruta)} className="action-btn approve">
                                                        <i className="fas fa-check"></i> Aprovar
                                                    </button>
                                                    <button onClick={() => onRejectClick(recruta.id)} className="action-btn reject">
                                                        <i className="fas fa-times"></i> Reprovar
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )
                    )}
                </div>
                 <div className="modal-footer">
                    <button onClick={onClose} className="btn-secondary">Fechar</button>
                </div>
            </div>
        </div>
    );
};

export default RecruitListModal;