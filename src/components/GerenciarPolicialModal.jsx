// src/components/GerenciarPolicialModal.jsx - VERSÃO COM TOKEN JWT
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext'; // Ajuste o caminho se necessário: ../context/AuthContext.jsx
import './GerenciarPolicialModal.css'; // Certifique-se que o CSS existe neste caminho

const GerenciarPolicialModal = ({ isOpen, onClose }) => {
    const { user, logout } = useAuth(); // Pega o usuário logado (admin) e logout
    const [policiais, setPoliciais] = useState([]);
    const [selectedPolicial, setSelectedPolicial] = useState('');
    const [acao, setAcao] = useState('Promoção');
    const [novaPatente, setNovaPatente] = useState('');
    const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
    const [loading, setLoading] = useState(false); // Loading para buscar a lista
    const [processing, setProcessing] = useState(false); // Loading para o submit

    useEffect(() => {
        // Busca a lista apenas se o modal estiver aberto E o usuário admin estiver carregado
        if (isOpen && user) {
            // Reseta os campos ao abrir
            setSelectedPolicial('');
            setAcao('Promoção');
            setNovaPatente('');
            setStatusMessage({ type: '', text: '' });
            setPoliciais([]);
            setLoading(true);

            // --- PEGAR TOKEN ---
            const token = localStorage.getItem('authToken'); // Use a chave correta onde salvou o token
            if (!token) {
                console.error("Gerenciar Modal Error: Token não encontrado.");
                setStatusMessage({ type: 'error', text: 'Erro de autenticação: Token não encontrado.' });
                setLoading(false);
                // Opcional: Deslogar ou fechar modal se não houver token
                // if (logout) logout();
                // onClose();
                return;
            }
            // --- FIM PEGAR TOKEN ---

            // Headers para buscar a lista
            const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            };

            const fetchPoliciais = async () => {
                try {
                    // Usa a rota /api/admin/lista-oficiais que já filtra pela corporação do admin no backend
                    const response = await fetch('http://localhost:3000/api/admin/lista-oficiais', { headers }); // <<< Envia Headers

                    // Verifica token inválido/expirado
                    if (response.status === 401 || response.status === 403) {
                        console.error("Gerenciar Modal Error: Token inválido ou expirado ao buscar lista (401/403).");
                        localStorage.removeItem('authToken'); // Limpa token inválido
                        if (logout) logout(); // Desloga
                        setStatusMessage({ type: 'error', text: 'Sessão inválida. Faça login novamente.' });
                        setLoading(false);
                        onClose(); // Fecha o modal
                        return;
                    }

                    if (!response.ok) {
                        const errData = await response.json().catch(() => ({ message: `Erro ${response.status}` }));
                        throw new Error(errData.message || 'Falha ao buscar policiais.');
                    }
                    const data = await response.json();
                    setPoliciais(data);
                } catch (error) {
                    console.error("Erro ao buscar policiais (modal):", error);
                    setStatusMessage({ type: 'error', text: `Erro ao carregar policiais: ${error.message}` });
                } finally {
                    setLoading(false);
                }
            };
            fetchPoliciais();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, user]); // Dependência: re-executa quando isOpen ou user mudam

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedPolicial || !novaPatente) {
            setStatusMessage({ type: 'error', text: 'Selecione um policial e informe a nova patente.' });
            return;
        }

        // --- PEGAR TOKEN PARA SUBMIT ---
        const token = localStorage.getItem('authToken');
        if (!token) {
            setStatusMessage({ type: 'error', text: 'Erro: Token não encontrado. Faça login novamente.' });
            return;
        }
        const headers = { // Define headers para o submit
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
        // --- FIM PEGAR TOKEN PARA SUBMIT ---

        setProcessing(true); // Ativa loading do submit
        setStatusMessage({ type: 'loading', text: 'Processando...' });

        try {
            const response = await fetch('http://localhost:3000/api/admin/gerenciar-policial', {
                method: 'PUT',
                headers: headers, // <<< Envia os headers com token
                body: JSON.stringify({
                    policialId: selectedPolicial,
                    acao: acao,
                    novaPatente: novaPatente,
                    // adminNome agora é pego pelo backend via req.user
                }),
            });

             // Verifica token inválido/expirado na resposta do PUT
             if (response.status === 401 || response.status === 403) {
                 console.error("Gerenciar Submit Error: Token inválido ou expirado (401/403).");
                 localStorage.removeItem('authToken');
                 if (logout) logout();
                 setStatusMessage({ type: 'error', text: 'Sessão inválida. Faça login novamente.' });
                 setProcessing(false);
                 onClose();
                 return;
             }

            const result = await response.json();
            if (!response.ok) {
                // Tenta pegar a mensagem de erro do backend
                throw new Error(result.message || 'Erro desconhecido no servidor.');
            }

            setStatusMessage({ type: 'success', text: result.message });
            // Fecha o modal após 2 segundos em caso de sucesso
            setTimeout(() => { onClose(); }, 2000);

        } catch (error) {
            console.error("Erro ao gerenciar carreira:", error);
            setStatusMessage({ type: 'error', text: error.message || 'Falha ao processar a solicitação.' });
        } finally {
             setProcessing(false); // Desativa loading do submit
        }
    };

    // Não renderiza nada se não estiver aberto
    if (!isOpen) return null;

    return (
        <div className="modal-backdrop">
            <div className="modal-content">
                {/* Mostra a corporação do admin no título */}
                <h2>Gerenciar Carreira ({user?.corporacao || 'N/A'})</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="policialSelect">Policial</label>
                        {/* Mostra loading ou a lista */}
                        {loading ? <p>Carregando policiais...</p> : policiais.length > 0 ? (
                            <select
                                id="policialSelect"
                                value={selectedPolicial}
                                onChange={(e) => setSelectedPolicial(e.target.value)}
                                required
                                disabled={processing || loading} // Desabilita se estiver carregando ou processando
                            >
                                <option value="" disabled>Selecione um policial</option>
                                {/* Mapeia a lista de policiais */}
                                {policiais.map(p => (
                                    <option key={p.id} value={p.id}>
                                        {p.nome_completo} ({p.patente || 'Sem Patente'})
                                    </option>
                                ))}
                            </select>
                        ) : (
                             <p style={{color: '#94a3b8'}}>Nenhum policial encontrado nesta corporação para gerenciar.</p> // Mensagem ajustada
                        )}
                    </div>
                    <div className="form-group">
                        <label htmlFor="acaoSelect">Ação</label>
                        <select
                            id="acaoSelect"
                            value={acao}
                            onChange={(e) => setAcao(e.target.value)}
                            required
                            disabled={processing || loading}
                        >
                            <option>Promoção</option>
                            <option>Rebaixamento</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="novaPatenteInput">Nova Patente</label>
                        <input
                            id="novaPatenteInput"
                            type="text"
                            value={novaPatente}
                            onChange={(e) => setNovaPatente(e.target.value)}
                            placeholder="Ex: Sargento, Cabo, etc."
                            required
                            disabled={processing || loading}
                         />
                    </div>

                    {/* Exibe a mensagem de status (loading, success, error) */}
                    {statusMessage.text && (
                         <p className={`status-message status-${statusMessage.type}`}>
                             {statusMessage.text}
                         </p>
                    )}

                    <div className="modal-actions">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn-cancel" // Use as classes CSS definidas para os botões
                            disabled={processing} // Desabilita durante o processamento
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="btn-save" // Use as classes CSS definidas para os botões
                            disabled={loading || processing || policiais.length === 0} // Desabilita se carregando, processando ou sem policiais
                        >
                            {processing ? 'Salvando...' : 'Confirmar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default GerenciarPolicialModal;