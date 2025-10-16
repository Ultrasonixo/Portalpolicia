import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Importando o Layout
import MainLayout from './components/MainLayout.jsx';

// Importando as Páginas
import HomePage from './pages/HomePage.jsx';
import BoletimPage from './pages/BoletimPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import ConcursosPage from './pages/ConcursosPage.jsx'; // <-- PÁGINA NOVA
import ProtectedRoute from './components/ProtectedRoute.jsx';

import './App.css';

function App() {
  return (
    <Routes>
      {/* Todas as rotas dentro daqui terão o Header e o Footer */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/concursos" element={<ConcursosPage />} /> {/* <-- ROTA NOVA */}
        
        <Route 
          path="/boletim" 
          element={
            <ProtectedRoute>
              <BoletimPage />
            </ProtectedRoute>
          } 
        />
        {/* Adicione outras páginas aqui */}
      </Route>
    </Routes>
  );
}

export default App;