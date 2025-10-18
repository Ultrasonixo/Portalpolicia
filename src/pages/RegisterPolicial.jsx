// src/pages/RegisterPolicial.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/auth/AuthLayout.jsx'; // Confirme o caminho
import InputField from '../components/auth/InputField.jsx'; // Confirme o caminho
// Importe Auth.css se não for importado por AuthLayout
// import '../components/Auth.css';

const RegisterPolicial = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    passaporte: '',
    nome_completo: '',
    discord_id: '',
    telefone_rp: '',
    gmail: '',
    senha: '',
    registration_token: '', // <<< NOVO CAMPO ADICIONADO
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Validação extra (token não pode estar vazio)
    if (!formData.registration_token) {
        setError("O Token de Registo é obrigatório.");
        setLoading(false);
        return;
    }

    try {
      // Envia todos os dados, incluindo o token
      const response = await fetch('http://localhost:3000/api/policia/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData), // formData agora inclui registration_token
      });

      const data = await response.json();

      if (!response.ok) {
        // Exibe a mensagem de erro do backend (ex: token inválido)
        throw new Error(data.message || 'Não foi possível realizar o registo.');
      }

      setSuccess(data.message + ' Você será redirecionado para o login em 3 segundos.');
      // Limpa o formulário em caso de sucesso
      setFormData({ passaporte: '', nome_completo: '', discord_id: '', telefone_rp: '', gmail: '', senha: '', registration_token: '' });
      setTimeout(() => navigate('/policia/login'), 3000);

    } catch (err) {
      console.error("Erro no registo:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Alistamento Policial" // Título ajustado
      subtitle="Preencha os dados e insira o token fornecido pelo RH." // Subtítulo ajustado
    >
      <form onSubmit={handleSubmit}>
        <InputField label="Número do Passaporte" type="text" name="passaporte" value={formData.passaporte} onChange={handleChange} />
        <InputField label="Nome Completo" type="text" name="nome_completo" value={formData.nome_completo} onChange={handleChange} />
        <InputField label="Discord ID" type="text" name="discord_id" value={formData.discord_id} onChange={handleChange} />
        <InputField label="Telefone (RP)" type="text" name="telefone_rp" value={formData.telefone_rp} onChange={handleChange} />
        <InputField label="Gmail" type="email" name="gmail" value={formData.gmail} onChange={handleChange} />
        <InputField label="Senha" type="password" name="senha" value={formData.senha} onChange={handleChange} />
        {/* <<< NOVO CAMPO DE TOKEN ADICIONADO >>> */}
        <InputField label="Token de Registo" type="text" name="registration_token" value={formData.registration_token} onChange={handleChange} placeholder="Insira o token recebido"/>

        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}

        <button type="submit" className="auth-button" disabled={loading || success}>
          {loading ? 'Enviando Alistamento...' : 'Enviar Alistamento'}
        </button>

        <p className="auth-redirect-link">
          Já tem uma conta? <Link to="/policia/login">Faça o login</Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default RegisterPolicial;