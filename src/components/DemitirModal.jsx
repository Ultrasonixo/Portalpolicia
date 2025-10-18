// src/components/DemitirModal.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import './Modal.css'; // Reutilizar estilos

const DemitirModal = ({ isOpen, onClose }) => {
    const { user, logout } = useAuth(); // Admin logado
    const [policiais, setPoliciais] = useState([]);
    const [selectedPolicialId, setSelectedPolicialId] = useState('');
    const [selectedPolicialNome, setSelectedPolicialNome] = useState(''); // Para confirmação
    const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);

    // Busca policiais da corporação do admin quando o modal abre
    useEffect(() => {
        if (isOpen && user?.corporacao) { // Precisa que o admin tenha corporação
            setSelectedPolicialId('');
            setSelectedPolicialNome('');
            setStatusMessage({ type: '', text: '' });
            setPoliciais([]);
            setLoading(true);

            const token = localStorage.getItem('authToken'); // Chave correta
            if (!token) {
                setStatusMessage({ type: 'error', text: 'Token não encontrado.' });
                setLoading(false); return;
            }
            const headers = { 'Authorization': `Bearer ${token}` };

            const fetchPoliciais = async () => {
                try {
                    // Usa a rota que lista oficiais (já filtra pela corporação no backend)
                    const response = await fetch('http://localhost:3000/api/admin/lista-oficiais', { headers }); // <<< Envia Headers

                    if (response.status === 401 || response.status === 403) {
                         localStorage.removeItem('authToken'); if (logout) logout(); throw new Error('Sessão inválida.');
                    }
                    if (!response.ok) {
                         const errData = await response.json().catch(()=>({message: `Erro ${response.status}`})); throw new Error(errData.message);
                    }
                    const data = await response.json();
                    // Filtra para não incluir o próprio admin na lista de demissão
                    setPoliciais(data.filter(p => p.id !== user.id));
                } catch (error) {
                    console.error("Erro ao buscar policiais para demissão:", error);
                    setStatusMessage({ type: 'error', text: `Erro ao carregar: ${error.message}` });
                } finally {
                    setLoading(false);
                }
            };
            fetchPoliciais();
        } else if (isOpen && !user?.corporacao) {
             setStatusMessage({ type: 'error', text: 'Admin sem corporação definida.' });
             setLoading(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, user]); // Depende de user e isOpen

    // Atualiza o nome selecionado para a confirmação
    useEffect(() => {
        const policial = policiais.find(p => p.id === parseInt(selectedPolicialId));
        setSelectedPolicialNome(policial ? policial.nome_completo : '');
    }, [selectedPolicialId, policiais]);

    const handleConfirmarDemissao = async () => {
        if (!selectedPolicialId || !selectedPolicialNome) return;

        if (!window.confirm(`Tem certeza que deseja DEMITIR ${selectedPolicialNome}? Esta ação mudará o status para 'Reprovado' e registrará no histórico.`)) {
            return;
        }

        const token = localStorage.getItem('authToken'); // Chave correta
        if (!token) { setStatusMessage({ type: 'error', text: 'Token não encontrado.' }); return; }
        const headers = { 'Authorization': `Bearer ${token}` }; // Apenas Auth header para PUT

        setProcessing(true);
        setStatusMessage({ type: 'loading', text: 'Processando demissão...' });

        try {
            // Chama a nova rota do backend
            const response = await fetch(`http://localhost:3000/api/admin/demitir/${selectedPolicialId}`, {
                method: 'PUT', // Usando PUT para atualizar o status
                headers: headers // <<< Envia Headers
            });

            if (response.status === 401 || response.status === 403) {
                 localStorage.removeItem('authToken'); if (logout) logout(); throw new Error('Sessão inválida ou permissão negada.');
            }

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || 'Erro ao processar demissão.');
            }

            setStatusMessage({ type: 'success', text: result.message });
            setTimeout(() => { onClose(); }, 2500); // Fecha após sucesso

        } catch (error) {
            console.error("Erro ao demitir:", error);
            setStatusMessage({ type: 'error', text: error.message || 'Falha ao demitir.' });
        } finally {
            setProcessing(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h3>Demitir Policial ({user?.corporacao || 'N/A'})</h3>
                    <button onClick={onClose} className="close-btn" disabled={processing}>&times;</button>
                </div>
                <div className="modal-body">
                    {/* Mensagem de status vem primeiro */}
                    {statusMessage.text && (
                        <p className={`status-message status-${statusMessage.type}`}>
                            {statusMessage.text}
                        </p>
                    )}
                    {/* Select só aparece se não estiver carregando e não houver erro de token/sessão */}
                    {!loading && !statusMessage.text.includes('Token') && !statusMessage.text.includes('Sessão') && (
                        <div className="modal-form-group">
                            <label htmlFor="policialDemitirSelect">Selecione o Policial a ser Demitido</label>
                            {policiais.length > 0 ? (
                                <select
                                    id="policialDemitirSelect"
                                    value={selectedPolicialId}
                                    onChange={(e) => setSelectedPolicialId(e.target.value)}
                                    required
                                    disabled={processing} // Desabilita só no processamento
                                >
                                    <option value="" disabled>Selecione...</option>
                                    {policiais.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.nome_completo} ({p.patente || 'N/A'})
                                        </option>
                                    ))}
                                </select>
                             ) : (
                                 <p style={{color: '#94a3b8'}}>Nenhum outro policial encontrado na sua corporação para demitir.</p>
                             )}
                        </div>
                    )}
                     {/* Mostra loading de policiais se aplicável */}
                    {loading && <p>Carregando policiais...</p>}
                </div>
                <div className="modal-footer">
                    <button type="button" onClick={onClose} className="btn-secondary" disabled={processing}>Cancelar</button>
                    <button
                        type="button"
                        onClick={handleConfirmarDemissao}
                        className="btn-danger" // Certifique-se que esta classe existe no CSS
                        disabled={processing || loading || !selectedPolicialId || policiais.length === 0}
                    >
                        {processing ? 'Processando...' : `Confirmar Demissão de ${selectedPolicialNome || '...'}`}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DemitirModal;