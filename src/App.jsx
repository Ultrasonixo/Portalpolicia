import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Importando os Layouts e a Proteção
import MainLayout from './components/MainLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import PoliceLayout from './components/PoliceLayout.jsx';

// Importando as Páginas
import HomePage from './pages/HomePage.jsx';
import BoletimPage from './pages/BoletimPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import LoginPolicial from './pages/LoginPolicial.jsx';
import RegisterPolicial from './pages/RegisterPolicial.jsx';
import ConcursosPage from './pages/ConcursosPage.jsx';
import JuridicoPage from './pages/Portaljuridico.jsx';
import PoliceDashboard from './pages/PoliceDashboard.jsx';

import './App.css';

function App() {
  return (
    // O <AuthProvider> está no seu main.jsx, o que é correto.
    // O <BrowserRouter> também está no main.jsx, o que é correto.
    // Este arquivo agora só contém as <Routes>.
    <Routes>
      {/* GRUPO 1: ROTAS DE AUTENTICAÇÃO POLICIAL (TELA CHEIA) */}
      <Route path="/policia/login" element={<LoginPolicial />} />
      <Route path="/policia/register" element={<RegisterPolicial />} />


      {/* GRUPO 2: ROTAS PÚBLICAS E CIVIS (COM HEADER E FOOTER) */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/juridico" element={<JuridicoPage />} /> 
        <Route path="/concursos" element={<ConcursosPage />} />
        <Route 
          path="/boletim" 
          element={
            <ProtectedRoute requiredType="civil">
              <BoletimPage />
            </ProtectedRoute>
          } 
        />
      </Route>


      {/* GRUPO 3: DASHBOARD POLICIAL (PROTEGIDO E COM LAYOUT PRÓPRIO) */}
      <Route 
        path="/policia" 
        element={
          <ProtectedRoute requiredType="policial">
            <PoliceLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" />} />
        <Route path="dashboard" element={<PoliceDashboard />} />
      </Route>

      {/* Rota para qualquer caminho não encontrado */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;