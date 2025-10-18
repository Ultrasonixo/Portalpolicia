import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx'; // Caminho corrigido
import AuthLayout from '../components/auth/AuthLayout.jsx'; // Adicionado .jsx
import InputField from '../components/auth/InputField.jsx'; // Adicionado .jsx

const LoginPolicial = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({ passaporte: '', senha: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Lê a página que o usuário tentou acessar (útil para o dashboard)
  const from = location.state?.from?.pathname || "/policia/dashboard";

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3000/api/policia/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro na autenticação.');
      }

      // A CORREÇÃO PRINCIPAL: Informamos ao contexto que o tipo é 'policial'
      login(data.policial, 'policial');
      
      // Redireciona para o dashboard ou para a página que ele tentou acessar
      navigate(from, { replace: true });

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Identifique-se no portal"
      subtitle="Digite seu passaporte para acessar sua conta."
    >
      <form onSubmit={handleSubmit}>
        <InputField
          label="Número do Passaporte"
          type="text"
          name="passaporte"
          value={formData.passaporte}
          onChange={handleChange}
          placeholder="Digite seu passaporte"
        />
        <InputField
          label="Senha"
          type="password"
          name="senha"
          value={formData.senha}
          onChange={handleChange}
          placeholder="Digite sua senha"
        />
        
        {error && <p className="error-message">{error}</p>}

        <button type="submit" className="auth-button" disabled={loading}>
          {loading ? 'Verificando...' : 'Continuar'}
        </button>

        {/* Corrigindo a rota para o registro policial */}
        <p className="auth-redirect-link">
          Não tem uma conta? <Link to="/policia/register">Crie uma aqui</Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default LoginPolicial;