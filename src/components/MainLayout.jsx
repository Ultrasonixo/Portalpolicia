import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header.jsx';
import Footer from './Footer.jsx'; // 1. Importe o componente Footer

function MainLayout() {
  return (
    <>
      <Header />
      <main>
        <Outlet />
      </main>
      <Footer /> {/* 2. Adicione o componente aqui */}
    </>
  );
}

export default MainLayout;