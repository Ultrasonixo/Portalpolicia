// src/components/AnuncioModal.jsx
import React, { useState, useEffect } from 'react'; // Adicionado useEffect
import { useAuth } from '../context/AuthContext.jsx';
import './Modal.css'; // Reutilizar estilos

const AnuncioModal = ({ isOpen, onClose }) => {
    const { user, logout } = useAuth(); // Pegar user admin e logout
    const [titulo, setTitulo] = useState('');
    const [conteudo, setConteudo] = useState('');
    // Define a corporação alvo inicial como a do admin, ou null (Geral) se for RH sem corporação?
    // Permitimos selecionar 'Geral' (null) ou a própria corporação do admin.
    const [corporacaoAlvo, setCorporacaoAlvo] = useState(user?.corporacao || null);
    const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
    const [processing, setProcessing] = useState(false);

    // Limpa o formulário quando o modal fecha ou abre
    useEffect(() => { // Usar useEffect em vez de React.useEffect
        if (isOpen) {
            setTitulo('');
            setConteudo('');
            // Reinicia para a corporação do admin ou null
            setCorporacaoAlvo(user?.corporacao || null);
            setStatusMessage({ type: '', text: '' });
            setProcessing(false);
        }
    }, [isOpen, user?.corporacao]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!titulo || !conteudo) {
            setStatusMessage({ type: 'error', text: 'Título e conteúdo são obrigatórios.' });
            return;
        }

        const token = localStorage.getItem('authToken'); // Use a chave correta
        if (!token) {
            setStatusMessage({ type: 'error', text: 'Erro: Token não encontrado.' });
            return;
        }
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        setProcessing(true);
        setStatusMessage({ type: 'loading', text: 'Publicando...' });

        try {
            // Usa a rota /api/admin/anuncios (corrigido do exemplo anterior)
            const response = await fetch('http://localhost:3000/api/admin/anuncios', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    titulo: titulo,
                    conteudo: conteudo,
                    corporacao: corporacaoAlvo // Envia null para 'Geral'
                }),
            });

            if (response.status === 401 || response.status === 403) {
                 localStorage.removeItem('authToken'); if (logout) logout(); throw new Error('Sessão inválida ou permissão negada.');
            }

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || 'Erro ao publicar anúncio.');
            }

            setStatusMessage({ type: 'success', text: result.message });
            setTimeout(() => { onClose(); }, 2000); // Fecha após sucesso

        } catch (error) {
            console.error("Erro ao publicar anúncio:", error);
            setStatusMessage({ type: 'error', text: error.message || 'Falha ao publicar.' });
        } finally {
            setProcessing(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h3>Criar Novo Anúncio</h3>
                    <button onClick={onClose} className="close-btn" disabled={processing}>&times;</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="modal-form-group"> {/* Use as classes de Modal.css */}
                            <label htmlFor="anuncioTitulo">Título</label>
                            <input
                                id="anuncioTitulo"
                                type="text"
                                value={titulo}
                                onChange={(e) => setTitulo(e.target.value)}
                                maxLength={255}
                                required
                                disabled={processing}
                            />
                        </div>
                        <div className="modal-form-group">
                            <label htmlFor="anuncioConteudo">Conteúdo</label>
                            <textarea
                                id="anuncioConteudo"
                                value={conteudo}
                                onChange={(e) => setConteudo(e.target.value)}
                                rows={6}
                                required
                                disabled={processing}
                            />
                        </div>
                        <div className="modal-form-group">
                            <label htmlFor="anuncioCorporacao">Publicar Para</label>
                            <select
                                id="anuncioCorporacao"
                                // Ajuste para lidar com null corretamente no value
                                value={corporacaoAlvo === null ? 'Geral' : corporacaoAlvo}
                                onChange={(e) => setCorporacaoAlvo(e.target.value === 'Geral' ? null : e.target.value)}
                                disabled={processing}
                            >
                                <option value="Geral">Geral (Todas Corporações)</option>
                                {/* Permite selecionar apenas a própria corporação do admin */}
                                {user?.corporacao && <option value={user.corporacao}>{user.corporacao}</option>}
                            </select>
                        </div>

                        {statusMessage.text && (
                            <p className={`status-message status-${statusMessage.type}`}>
                                {statusMessage.text}
                            </p>
                        )}
                    </div>
                    <div className="modal-footer">
                        <button type="button" onClick={onClose} className="btn-secondary" disabled={processing}>Cancelar</button>
                        <button type="submit" className="btn-primary" disabled={processing}>
                            {processing ? 'Publicando...' : 'Publicar Anúncio'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AnuncioModal;