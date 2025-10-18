// src/components/GerenciarPolicialModal.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './GerenciarPolicialModal.css'; // Vamos criar este CSS genérico para modais

const GerenciarPolicialModal = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const [policiais, setPoliciais] = useState([]);
    const [selectedPolicial, setSelectedPolicial] = useState('');
    const [acao, setAcao] = useState('Promoção');
    const [novaPatente, setNovaPatente] = useState('');
    const [statusMessage, setStatusMessage] = useState('');

    // Busca a lista de policiais para preencher o dropdown
    useEffect(() => {
        if (isOpen) {
            const fetchPoliciais = async () => {
                const response = await fetch('http://localhost:3000/api/policia/policiais');
                const data = await response.json();
                setPoliciais(data);
            };
            fetchPoliciais();
        }
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatusMessage('Processando...');

        const response = await fetch('/api/admin/gerenciar-policial', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                policialId: selectedPolicial,
                acao: acao,
                novaPatente: novaPatente,
                adminNome: user.nome_completo,
            }),
        });
        
        const result = await response.json();
        setStatusMessage(result.message);

        // Limpa e fecha o modal após um tempo
        setTimeout(() => {
            onClose();
            setStatusMessage('');
        }, 2000);
    };

    if (!isOpen) return null;

    return (
        <div className="modal-backdrop">
            <div className="modal-content">
                <h2>Gerenciar Carreira do Policial</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Policial</label>
                        <select value={selectedPolicial} onChange={(e) => setSelectedPolicial(e.target.value)} required>
                            <option value="" disabled>Selecione um policial</option>
                            {policiais.map(p => (
                                <option key={p.id} value={p.id}>{p.nome_completo} ({p.patente})</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Ação</label>
                        <select value={acao} onChange={(e) => setAcao(e.target.value)} required>
                            <option>Promoção</option>
                            <option>Rebaixamento</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Nova Patente</label>
                        <input type="text" value={novaPatente} onChange={(e) => setNovaPatente(e.target.value)} placeholder="Ex: Sargento" required />
                    </div>
                    <div className="modal-actions">
                        <button type="button" onClick={onClose} className="btn-cancel">Cancelar</button>
                        <button type="submit" className="btn-save">Confirmar</button>
                    </div>
                </form>
                {statusMessage && <p className="status-message">{statusMessage}</p>}
            </div>
        </div>
    );
};

export default GerenciarPolicialModal;