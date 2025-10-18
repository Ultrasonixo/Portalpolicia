// src/App.jsx - VERSÃO CORRIGIDA

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts e Proteção
import MainLayout from './components/MainLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import PoliceLayout from './components/PoliceLayout.jsx';
import AntiDevTools from './components/AntiDevTools';

// Páginas
import HomePage from './pages/HomePage.jsx';
import BoletimPage from './pages/BoletimPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import LoginPolicial from './pages/LoginPolicial.jsx';
import RegisterPolicial from './pages/RegisterPolicial.jsx';
import ConcursosPage from './pages/ConcursosPage.jsx';
import JuridicoPage from './pages/Portaljuridico.jsx';
import SobreNosPage from './pages/SobreNosPage.jsx';
import PoliceDashboard from './pages/PoliceDashboard.jsx';
import AdminPage from './pages/AdminPage.jsx';
import ConsultaBoletinsPage from './pages/ConsultaBoletinsPage.jsx';
import BoletimDetailPage from './pages/BoletimDetailPage';
import PoliceProfilePage from './pages/PoliceProfilePage';
import ListaPoliciaisPage from './pages/ListaPoliciaisPage';
import LogsPage from './pages/LogsPage';
import RelatoriosPage from './pages/RelatoriosPage.jsx';

import './App.css';

function App() {
  return (
    // ✅ 1. ADICIONADO UM FRAGMENTO <>...</> PARA ENVOLVER TUDO
    <>
      {/* O AntiDevTools agora fica aqui fora, mas será renderizado em todas as páginas */}
      

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
          <Route path="/sobre-nos" element={<SobreNosPage />} />
          <Route path="/boletim" element={<ProtectedRoute requiredType="civil"><BoletimPage /></ProtectedRoute>} />
        </Route>

        {/* GRUPO 3: DASHBOARD POLICIAL (PROTEGIDO E COM LAYOUT PRÓPRIO) */}
        <Route path="/policia" element={<ProtectedRoute requiredType="policial"><PoliceLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="dashboard" />} />
          <Route path="dashboard" element={<PoliceDashboard />} />
          <Route path="admin" element={<AdminPage />} />
          <Route path="policiais" element={<ListaPoliciaisPage />} />
          <Route path="boletins" element={<ConsultaBoletinsPage />} />
          <Route path="logs" element={<LogsPage />} />
          <Route path="relatorios" element={<RelatoriosPage />} />
          <Route path="boletim/:id" element={<BoletimDetailPage />} />
          <Route path="perfil/:id" element={<PoliceProfilePage />} />
        </Route>

        {/* Rota para qualquer caminho não encontrado */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

export default App;