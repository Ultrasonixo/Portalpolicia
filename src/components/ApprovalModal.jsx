import React, { useState } from 'react';
import './Modal.css'; // Usaremos este CSS para o estilo

const ApprovalModal = ({ recruta, onClose, onConfirm }) => {
    const [patente, setPatente] = useState('');
    const [guarnicao, setGuarnicao] = useState('');

    if (!recruta) return null;

    const handleConfirm = () => {
    console.log('Enviando para aprovação:', { id: recruta.id, patente, guarnicao });

    if (!patente || !guarnicao) {
        alert('Por favor, selecione a patente e a guarnição.');
        return;
    }
    onConfirm(recruta.id, patente, guarnicao);
};

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h3>Aprovar Recruta</h3>
                    <button onClick={onClose} className="close-btn">&times;</button>
                </div>
                <div className="modal-body">
                    <p>Defina a patente e guarnição para <strong>{recruta.nome_completo}</strong>.</p>
                    <div className="modal-form-group">
                        <label htmlFor="patente">Patente</label>
                        <select id="patente" value={patente} onChange={(e) => setPatente(e.target.value)}>
                            <option value="" disabled>Selecione uma patente</option>
                            <option>Soldado</option>
                            <option>Cabo</option>
                            <option>Sargento</option>
                            <option>Tenente</option>
                            <option>Capitão</option>
                        </select>
                    </div>
                    <div className="modal-form-group">
                        <label htmlFor="guarnicao">Guarnição</label>
                        <select id="guarnicao" value={guarnicao} onChange={(e) => setGuarnicao(e.target.value)}>
                            <option value="" disabled>Selecione uma guarnição</option>
                            <option>ROTA</option>
                            <option>Força Tática</option>
                            <option>BAEP</option>
                            <option>Polícia Civil</option>
                            <option>Polícia Militar</option>
                        </select>
                    </div>
                </div>
                <div className="modal-footer">
                    <button onClick={onClose} className="btn-secondary">Cancelar</button>
                    <button onClick={handleConfirm} className="btn-primary">Confirmar Aprovação</button>
                </div>
            </div>
        </div>
    );
};

export default ApprovalModal;