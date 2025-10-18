// src/components/BoletimForm.jsx - VERSÃO COM DATA DA OCORRÊNCIA

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import './BoletimForm.css';

function BoletimForm() {
    const { user } = useAuth();

    // ✅ 1. ADICIONADO 'data_ocorrido' AO ESTADO INICIAL
    const [formData, setFormData] = useState({
        tipo: '',
        data_ocorrido: '', // Adicionado aqui
        local: '',
        descricao: '',
    });

    const [arquivos, setArquivos] = useState(null);
    const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({ ...prevState, [name]: value }));
    };
    
    const handleFileChange = (e) => {
        setArquivos(e.target.files);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatusMessage({ type: 'loading', text: 'Registrando ocorrência...' });

        if (!user || !user.id) {
            setStatusMessage({ type: 'error', text: 'Erro: Usuário não identificado. Faça login novamente.' });
            return;
        }

        const dataParaEnviar = new FormData();

        // ✅ 2. ADICIONADO 'data_ocorrido' AO FORMDATA
        dataParaEnviar.append('tipo', formData.tipo);
        dataParaEnviar.append('data_ocorrido', formData.data_ocorrido); // Adicionado aqui
        dataParaEnviar.append('local', formData.local);
        dataParaEnviar.append('descricao', formData.descricao);
        dataParaEnviar.append('usuario_id', user.id);

        if (arquivos && arquivos.length > 0) {
            for (let i = 0; i < arquivos.length; i++) {
                dataParaEnviar.append('anexos', arquivos[i]);
            }
        }

        try {
            const response = await fetch('http://localhost:3000/api/boletim/registrar', {
                method: 'POST',
                body: dataParaEnviar,
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            
            setStatusMessage({ type: 'success', text: result.message });
            
            // ✅ 3. ADICIONADO 'data_ocorrido' AO RESET DO FORMULÁRIO
            setFormData({ tipo: '', data_ocorrido: '', local: '', descricao: '' });
            setArquivos(null);
            e.target.reset();

        } catch (error) {
            setStatusMessage({ type: 'error', text: error.message || 'Falha ao registrar B.O.' });
        }
    };

    if (!user) {
        return <p>Carregando informações do usuário...</p>;
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
                    <div><label>Nome do Denunciante</label><p>{user.nome_completo}</p></div>
                    <div><label>RG do Denunciante</label><p>{user.id_passaporte}</p></div>
                </div>

                <div className="form-row">
                    <div className="input-group">
                        <label htmlFor="tipo">Tipo de Ocorrência</label>
                        <select id="tipo" name="tipo" value={formData.tipo} onChange={handleChange} required>
                            <option value="" disabled>Selecione o tipo</option>
                            <option>Furto</option> <option>Roubo</option> <option>Homicídio</option>
                            <option>Agressão</option> <option>Tráfico</option> <option>Porte Ilegal</option>
                            <option>Sequestro</option> <option>Extorsão</option> <option>Estelionato</option>
                            <option>Outros</option>
                        </select>
                    </div>

                    {/* ✅ 4. CAMPO DE DATA ADICIONADO DE VOLTA AO FORMULÁRIO */}
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
                    <textarea id="descricao" name="descricao" value={formData.descricao} onChange={handleChange} rows="6" placeholder="Descreva com o máximo de detalhes o que aconteceu..." required></textarea>
                </div>

                <div className="input-group">
                    <label htmlFor="anexos">Anexar Evidências (Imagens)</label>
                    <input type="file" id="anexos" name="anexos" onChange={handleFileChange} multiple accept="image/png, image/jpeg" />
                    <small>Você pode anexar até 5 imagens.</small>
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