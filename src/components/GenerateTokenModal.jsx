// src/components/GenerateTokenModal.jsx - Versão com Melhorias de Design
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx'; // Confirme o caminho
import './Modal.css'; // Reutilizar estilos

// Adicionando alguns estilos inline para layout específico deste modal
// Ou crie um GenerateTokenModal.css dedicado se preferir
const styles = {
    inputRow: {
        display: 'flex',
        gap: '15px',
        marginBottom: '20px',
        alignItems: 'flex-end', // Alinha label e input
    },
    inputGroupFlex: {
        flex: 1, // Faz cada grupo ocupar metade do espaço
    },
    tokenDisplayWrapper: {
        marginTop: '15px',
        marginBottom: '15px',
    },
    tokenDisplayBox: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        backgroundColor: '#e9ecef', // Fundo cinza claro
        padding: '8px 12px',
        borderRadius: '6px',
        border: '1px solid #ced4da', // Borda sutil
    },
    tokenInput: {
        flexGrow: 1,
        border: 'none',
        backgroundColor: 'transparent',
        fontSize: '0.9rem', // Tamanho um pouco menor
        fontFamily: 'monospace', // Fonte monoespaçada para tokens
        color: '#495057', // Cor do texto
        overflow: 'hidden', // Evita que texto longo quebre o layout
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    copyButton: {
        flexShrink: 0,
        padding: '6px 12px', // Botão um pouco menor
        fontSize: '0.85rem',
    }
};

const GenerateTokenModal = ({ isOpen, onClose }) => {
    const { user, logout } = useAuth();
    const [maxUses, setMaxUses] = useState(1);
    const [durationHours, setDurationHours] = useState(24);
    const [generatedToken, setGeneratedToken] = useState('');
    const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
    const [processing, setProcessing] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false); // Estado para feedback de cópia

    useEffect(() => {
        if (isOpen) {
             setGeneratedToken('');
             setStatusMessage({ type: '', text: '' });
             setProcessing(false);
             setMaxUses(1);
             setDurationHours(24);
             setCopySuccess(false); // Reseta feedback de cópia
        }
    }, [isOpen]);

    const handleGenerate = async () => {
        if (maxUses < 1) { setStatusMessage({ type: 'error', text: 'Quantidade deve ser 1 ou mais.' }); return; }
        if (durationHours <= 0) { setStatusMessage({ type: 'error', text: 'Duração deve ser positiva.' }); return; }
        setProcessing(true);
        setGeneratedToken('');
        setStatusMessage({ type: 'loading', text: 'Gerando...' });
        setCopySuccess(false); // Reseta cópia
        const authToken = localStorage.getItem('authToken');
        if (!authToken) { setStatusMessage({ type: 'error', text: 'Erro: Token admin não encontrado.' }); setProcessing(false); return; }
        const headers = { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' };
        try {
            const response = await fetch('http://localhost:3000/api/admin/generate-token', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    max_uses: parseInt(maxUses, 10),
                    duration_hours: parseInt(durationHours, 10)
                })
            });
            if (response.status === 401 || response.status === 403) { localStorage.removeItem('authToken'); if (logout) logout(); throw new Error('Sessão inválida.'); }
            const result = await response.json();
            if (!response.ok) { throw new Error(result.message || 'Erro ao gerar token.'); }
            setGeneratedToken(result.token);
            setStatusMessage({ type: 'success', text: result.message || `Token gerado!` });
        } catch (error) {
            console.error("Erro ao gerar token:", error);
            setStatusMessage({ type: 'error', text: error.message || 'Falha ao gerar.' });
        } finally {
            setProcessing(false);
        }
    };

    const copyToClipboard = () => {
        if (generatedToken) {
            navigator.clipboard.writeText(generatedToken)
                .then(() => {
                    setCopySuccess(true); // Ativa feedback de sucesso
                    // Remove o feedback após alguns segundos
                    setTimeout(() => setCopySuccess(false), 2000);
                })
                .catch(err => {
                    console.error('Erro ao copiar token: ', err);
                    setStatusMessage({ type: 'error', text: 'Falha ao copiar. Selecione manualmente.' });
                });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h3>Gerar Token de Registo ({user?.corporacao || 'N/A'})</h3>
                    <button onClick={onClose} className="close-btn" disabled={processing}>&times;</button>
                </div>
                <div className="modal-body">
                    <p>Gere um token para um candidato se registar na sua corporação ({user?.corporacao || 'N/A'}).</p>

                     {/* Linha para Inputs */}
                     <div style={styles.inputRow}>
                         {/* Grupo Quantidade */}
                         <div className="modal-form-group" style={styles.inputGroupFlex}>
                             <label htmlFor="maxUsesInput">Qtde. Usos</label>
                             <input
                                 id="maxUsesInput" type="number" min="1"
                                 value={maxUses}
                                 onChange={(e) => setMaxUses(parseInt(e.target.value, 10) || 1)}
                                 disabled={processing}
                             />
                         </div>
                         {/* Grupo Duração */}
                         <div className="modal-form-group" style={styles.inputGroupFlex}>
                             <label htmlFor="durationInput">Validade (horas)</label>
                             <input
                                 id="durationInput" type="number" min="1"
                                 value={durationHours}
                                 onChange={(e) => setDurationHours(parseInt(e.target.value, 10) || 1)}
                                 disabled={processing}
                             />
                         </div>
                     </div>

                    {/* Mostra o token gerado (Design Melhorado) */}
                    {generatedToken && (
                        <div style={styles.tokenDisplayWrapper}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.9rem', color: '#475569' }}>
                                Token Gerado:
                            </label>
                            <div style={styles.tokenDisplayBox}>
                                <input type="text" readOnly value={generatedToken} style={styles.tokenInput} />
                                <button
                                    type="button"
                                    onClick={copyToClipboard}
                                    className="btn-secondary" // Reutiliza estilo secundário
                                    style={styles.copyButton}
                                    disabled={processing}
                                >
                                    {copySuccess ? 'Copiado!' : 'Copiar'} {/* Feedback no botão */}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Mensagem de status */}
                    {statusMessage.text && !generatedToken && ( // Só mostra se não houver token gerado (evita duplicar msg de sucesso)
                         <p className={`status-message status-${statusMessage.type}`}>
                             {statusMessage.text}
                         </p>
                    )}
                    {/* Mensagem de status específica para sucesso (quando token é mostrado) */}
                     {statusMessage.type === 'success' && generatedToken && (
                         <p className={`status-message status-${statusMessage.type}`}>
                             {statusMessage.text}
                         </p>
                     )}
                     {/* Mensagem de info (cópia) */}
                     {copySuccess && !statusMessage.text.includes('Falha') && (
                          <p className={`status-message status-info`} style={{backgroundColor: '#d1ecf1', color: '#0c5460'}}>
                              Token copiado para a área de transferência!
                          </p>
                     )}


                </div>
                <div className="modal-footer">
                    <button type="button" onClick={onClose} className="btn-secondary" disabled={processing}>Fechar</button>
                    <button
                        type="button"
                        onClick={handleGenerate}
                        className="btn-primary"
                        disabled={processing || !user?.corporacao}
                    >
                        {processing ? 'Gerando...' : 'Gerar Novo Token'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GenerateTokenModal;