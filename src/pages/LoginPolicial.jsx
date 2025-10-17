import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/auth/AuthLayout';
import InputField from '../components/auth/InputField';

const LoginPolicial = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ passaporte: '', senha: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

      login(data.policial);
      navigate('/policia/dashboard'); // Redireciona para o dashboard policial

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

        <p className="auth-redirect-link">
          Não tem uma conta? <Link to="/registroPolicial">Crie uma aqui</Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default LoginPolicial;