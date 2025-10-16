import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Form.css'; // Vamos reutilizar o CSS do login

function RegisterForm() {
    const [formData, setFormData] = useState({
        id_passaporte: '',
        nome_completo: '',
        telefone_rp: '',
        gmail: '',
        senha: ''
    });
    const [isRobot, setIsRobot] = useState(false);
    const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({ ...prevState, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isRobot) {
            setStatusMessage({ type: 'error', text: 'Por favor, confirme que você não é um robô.' });
            return;
        }

        setStatusMessage({ type: 'loading', text: 'Registrando...' });

        try {
            const response = await fetch('http://localhost:3000/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message);
            }

            setStatusMessage({ type: 'success', text: result.message });
        } catch (error) {
            setStatusMessage({ type: 'error', text: error.message });
        }
    };

    return (
        <section className="login-container">
            <div className="login-box">
                <img src="/brasao.png" alt="Brasão da Polícia" className="login-logo" />
                <h2>Criar Conta no Portal</h2>
                <p>Use os dados do seu personagem.</p>
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label htmlFor="id_passaporte">ID / Passaporte</label>
                        <input type="text" id="id_passaporte" name="id_passaporte" onChange={handleChange} required />
                    </div>
                    <div className="input-group">
                        <label htmlFor="nome_completo">Nome Completo (Personagem)</label>
                        <input type="text" id="nome_completo" name="nome_completo" onChange={handleChange} required />
                    </div>
                    <div className="input-group">
                        <label htmlFor="telefone_rp">Telefone (RP)</label>
                        <input type="text" id="telefone_rp" name="telefone_rp" onChange={handleChange} />
                    </div>
                    <div className="input-group">
                        <label htmlFor="gmail">Gmail (Real)</label>
                        <input type="email" id="gmail" name="gmail" onChange={handleChange} required />
                    </div>
                    <div className="input-group">
                        <label htmlFor="senha">Senha</label>
                        <input type="password" id="senha" name="senha" onChange={handleChange} required />
                    </div>
                    <div className="captcha-group">
                        <input type="checkbox" id="captcha" checked={isRobot} onChange={(e) => setIsRobot(e.target.checked)} />
                        <label htmlFor="captcha">Não sou um robô</label>
                    </div>

                    <button type="submit">Criar Conta</button>
                </form>
                {statusMessage.text && (
                    <div className={`status-message status-${statusMessage.type}`}>
                        {statusMessage.text}
                    </div>
                )}
                <p className="form-footer">Já tem uma conta? <Link to="/login">Faça o login</Link></p>
            </div>
        </section>
    );
}

export default RegisterForm;