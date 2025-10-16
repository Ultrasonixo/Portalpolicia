import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import './Form.css';

function LoginForm() {
    // MUDANÇA 1: Voltamos a usar o estado 'id_passaporte'
    const [id_passaporte, setIdPassaporte] = useState('');
    const [senha, setSenha] = useState('');
    const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from?.pathname || "/";

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatusMessage({ type: 'loading', text: 'Autenticando...' });

        try {
            // MUDANÇA 2: Enviamos 'id_passaporte' no corpo da requisição
            const response = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_passaporte, senha }),
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.message);

            login(result.usuario);
            navigate(from, { replace: true });

        } catch (error) {
            setStatusMessage({ type: 'error', text: error.message });
        }
    };

    return (
        <section className="login-container">
            <div className="login-box">
                <img src="/brasao.png" alt="Brasão da Polícia" className="login-logo" />
                <h2>Acesso ao Sistema</h2>
                <p>Use suas credenciais para acessar o portal.</p>
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        {/* MUDANÇA 3: Alteramos o label de volta para ID */}
                        <label htmlFor="id_passaporte">ID / Passaporte</label>
                        <input
                            type="text"
                            id="id_passaporte"
                            value={id_passaporte}
                            // MUDANÇA 4: Atualizamos o onChange
                            onChange={(e) => setIdPassaporte(e.target.value)}
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label htmlFor="senha">Senha</label>
                        <input
                            type="password"
                            id="senha"
                            value={senha}
                            onChange={(e) => setSenha(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit">Entrar</button>
                </form>
                {statusMessage.text && (
                    <div className={`status-message status-${statusMessage.type}`}>
                        {statusMessage.text}
                    </div>
                )}
                <p className="form-footer">Não tem uma conta? <Link to="/register">Crie uma agora</Link></p>
            </div>
        </section>
    );
}

export default LoginForm;