// src/pages/RegisterPolicial.jsx

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/auth/AuthLayout';
import InputField from '../components/auth/InputField';

const RegisterPolicial = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    passaporte: '', 
    nome_completo: '', 
    discord_id: '', 
    telefone_rp: '', // <-- ADICIONADO
    gmail: '', 
    senha: '',
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

    try {
      const response = await fetch('http://localhost:3000/api/policia/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Não foi possível realizar o cadastro.');
      }

      setSuccess(data.message + ' Você será redirecionado para o login.');
      setTimeout(() => navigate('/policia/login'), 3000);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Crie sua conta no portal"
      subtitle="Preencha os dados abaixo para iniciar seu alistamento."
    >
      <form onSubmit={handleSubmit}>
        <InputField label="Número do Passaporte" type="text" name="passaporte" value={formData.passaporte} onChange={handleChange} />
        <InputField label="Nome Completo" type="text" name="nome_completo" value={formData.nome_completo} onChange={handleChange} />
        <InputField label="Discord ID" type="text" name="discord_id" value={formData.discord_id} onChange={handleChange} />
        <InputField label="Telefone (RP)" type="text" name="telefone_rp" value={formData.telefone_rp} onChange={handleChange} /> {/* <-- ADICIONADO */}
        <InputField label="Gmail" type="email" name="gmail" value={formData.gmail} onChange={handleChange} />
        <InputField label="Senha" type="password" name="senha" value={formData.senha} onChange={handleChange} />

        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}
        
        <button type="submit" className="auth-button" disabled={loading || success}>
          {loading ? 'Enviando...' : 'Criar Conta'}
        </button>

        <p className="auth-redirect-link">
          Já tem uma conta? <Link to="/policia/login">Faça o login</Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default RegisterPolicial;