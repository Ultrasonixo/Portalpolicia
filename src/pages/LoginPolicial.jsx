import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import AuthLayout from '../components/auth/AuthLayout.jsx';
import InputField from '../components/auth/InputField.jsx';

const LoginPolicial = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({ passaporte: '', senha: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

      // <<< --- MODIFICAÇÃO: Salvar o Token --- >>>
      if (data.token) {
        // Use a chave 'authToken' (ou outra de sua preferência)
        localStorage.setItem('authToken', data.token);
        console.log("Token salvo no localStorage:", data.token); // Para depuração
      } else {
         console.error("Token não recebido do backend na resposta de login.");
         throw new Error('Falha no login: Token não recebido.');
      }
      // <<< --- FIM DA MODIFICAÇÃO --- >>>


      // Passa os dados do policial E o tipo para o AuthContext
      login(data.policial, 'policial');

      navigate(from, { replace: true });

    } catch (err) {
      console.error("Erro no login:", err); // Log mais detalhado
      setError(err.message);
       // Limpa o token se o login falhar após salvar (caso raro)
       localStorage.removeItem('authToken');
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
          Não tem uma conta? <Link to="/policia/register">Crie uma aqui</Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default LoginPolicial;