import React from 'react';
import { Link } from 'react-router-dom';
import './ServicesGrid.css';

function ServicesGrid() {
  return (
    <main id="services" className="services-section">
      <h2>Serviços Disponíveis</h2>
      <div className="services-grid">
        <Link to="/boletim" className="service-card">
          <i className="fas fa-file-alt"></i>
          <h3>Registrar B.O. Online</h3>
          <p>Registre um boletim de ocorrência de forma rápida e segura.</p>
        </Link>
        <Link to="/batalhoes" className="service-card">
          <i className="fas fa-shield-alt"></i>
          <h3>Batalhões</h3>
          <p>Conheça as unidades especializadas da Polícia RP.</p>
        </Link>
        <Link to="/concursos" className="service-card">
          <i className="fas fa-user-plus"></i>
          <h3>Concursos Públicos</h3>
          <p>Faça parte da corporação. Confira os editais abertos.</p>
        </Link>
        <Link to="/juridico" className="service-card">
          <i className="fas fa-gavel"></i>
          <h3>Portal Jurídico</h3>
          <p>Consulte leis, códigos e documentos oficiais.</p>
        </Link>
      </div>
    </main>
  );
}
export default ServicesGrid;