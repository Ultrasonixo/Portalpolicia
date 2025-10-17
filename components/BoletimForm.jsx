import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import './BoletimForm.css';

function BoletimForm() {
    const { user } = useAuth(); // Pega os dados do usuário logado do nosso AuthContext
    const [formData, setFormData] = useState({
        tipo: '',
        data_ocorrido: '',
        local: '',
        descricao: '',
        anexos: null
    });
    const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({ ...prevState, [name]: value }));
    };
    
    // Futuramente, aqui ficará a lógica para anexos
    const handleFileChange = (e) => {
        setFormData(prevState => ({ ...prevState, anexos: e.target.files[0] }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatusMessage({ type: 'loading', text: 'Registrando ocorrência...' });

        const dataToSend = {
            ...formData,
            usuario_id: user.id, // Pega o ID do usuário logado
            nome: user.nome_completo,
            rg: user.id_passaporte // Ou a coluna correta do passaporte
        };

        try {
            const response = await fetch('http://localhost:3000/api/boletim/registrar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSend)
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            
            setStatusMessage({ type: 'success', text: result.message });
            // Limpar formulário após sucesso
            setFormData({ tipo: '', data_ocorrido: '', local: '', descricao: '', anexos: null });
        } catch (error) {
            setStatusMessage({ type: 'error', text: error.message || 'Falha ao registrar B.O.' });
        }
    };

    if (!user) {
        return <p>Carregando informações do usuário...</p>; // Mensagem enquanto o user não é carregado
    }

    return (
        <div className="bo-page-container">
            <form className="bo-form-card" onSubmit={handleSubmit}>
                <div className="bo-form-header">
                    <i className="fas fa-file-alt form-icon"></i>
                    <h2>Registro de Boletim de Ocorrência</h2>
                    <p>Descreva o ocorrido para que a polícia possa investigar.</p>
                </div>

                <div className="user-info-box">
                    <div>
                        <label>Nome do Denunciante</label>
                        <p>{user.nome_completo}</p>
                    </div>
                    <div>
                        <label>RG do Denunciante</label>
                        <p>{user.id_passaporte}</p>
                    </div>
                </div>

                <div className="form-row">
                    <div className="input-group">
                        <label htmlFor="tipo">Tipo de Ocorrência</label>
                        <select id="tipo" name="tipo" value={formData.tipo} onChange={handleChange} required>
                            <option value="" disabled>Selecione o tipo</option>
                            <option>Furto</option>
                            <option>Roubo</option>
                            <option>Homicídio</option>
                            <option>Agressão</option>
                            <option>Tráfico</option>
                            <option>Porte Ilegal</option>
                            <option>Sequestro</option>
                            <option>Extorsão</option>
                            <option>Estelionato</option>
                            <option>Outros</option>
                        </select>
                    </div>
                    <div className="input-group">
                        <label htmlFor="data_ocorrido">Data da Ocorrência</label>
                        <input type="date" id="data_ocorrido" name="data_ocorrido" value={formData.data_ocorrido} onChange={handleChange} required />
                    </div>
                </div>

                <div className="input-group">
                    <label htmlFor="local">Local da Ocorrência</label>
                    <input type="text" id="local" name="local" value={formData.local} onChange={handleChange} placeholder="Ex: Rua das Flores, 123, Bairro Central" required />
                </div>

                <div className="input-group">
                    <label htmlFor="descricao">Descrição Detalhada</label>
                    <textarea id="descricao" name="descricao" value={formData.descricao} onChange={handleChange} rows="6" placeholder="Descreva com o máximo de detalhes o que aconteceu, pessoas envolvidas, veículos, etc." required></textarea>
                </div>

                <div className="input-group">
                    <label htmlFor="anexos">Anexos (Opcional)</label>
                    <input type="file" id="anexos" name="anexos" onChange={handleFileChange} />
                    <small>Você pode anexar imagens, vídeos ou documentos.</small>
                </div>

                <button type="submit" className="submit-bo-button">
                    <i className="fas fa-paper-plane"></i> Registrar Ocorrência
                </button>

                {statusMessage.text && (
                    <div className={`status-message status-${statusMessage.type}`}>
                        {statusMessage.text}
                    </div>
                )}
            </form>
        </div>
    );
}

export default BoletimForm;