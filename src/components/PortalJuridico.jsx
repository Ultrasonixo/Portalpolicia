import React from 'react';
import './PortalJuridico.css'; // ou .module.css

export default function PortalJuridico() {
  return (
    <div className="portal-container">
      <header className="portal-header">
        <h1>Portal Jurídico</h1>
        <p>Informações e serviços legais</p>
      </header>

      <section className="portal-cards">
        <div className="portal-card">
          <h2>Serviço 1</h2>
          <p>Descrição do serviço 1</p>
        </div>
        <div className="portal-card">
          <h2>Serviço 2</h2>
          <p>Descrição do serviço 2</p>
        </div>
        <div className="portal-card">
          <h2>Serviço 3</h2>
          <p>Descrição do serviço 3</p>
        </div>
      </section>
    </div>
  );
}
