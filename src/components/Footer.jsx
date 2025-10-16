import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="footer-container">
        <div className="footer-top">
          <div className="footer-about">
            <Link to="/" className="footer-logo-container">
              <img src="/brasao.png" alt="Brasão da Polícia" className="logo" />
              <div className="logo-text">
                <span>Polícia RP</span>
                <small>Portal Oficial</small>
              </div>
            </Link>
            <p className="footer-description">
              Servindo e protegendo a comunidade com excelência, transparência e compromisso.
            </p>
            <div className="social-icons">
              <a href="https://discord.gg/cno" target="_blank" rel="noopener noreferrer">
                <i className="fab fa-discord"></i>
              </a>
              <a href="https://twitter.com/SEU-USUARIO-AQUI" target="_blank" rel="noopener noreferrer">
                <i className="fab fa-twitter"></i>
              </a>
              <a href="https://youtube.com/SEU-CANAL-AQUI" target="_blank" rel="noopener noreferrer">
                <i className="fab fa-youtube"></i>
              </a>
            </div>
          </div>

          <div className="footer-links">
            <h3><i className="fas fa-link"></i> Acesso Rápido</h3>
            <ul>
              <li><Link to="/boletim">Registrar B.O.</Link></li>
              <li><Link to="/denunciar">Denúncia Anônima</Link></li>
              <li><Link to="/concursos">Concursos Abertos</Link></li>
              <li><Link to="/juridico">Portal Jurídico</Link></li>
            </ul>
          </div>

          <div className="footer-links">
            <h3><i className="fas fa-users"></i> Comunidade</h3>
            <ul>
              <li><a href="https://www.youtube.com/">Fórum da Cidade</a></li>
              <li><a href="#">Regras do Servidor</a></li>
              <li><a href="#">Documentação</a></li>
            </ul>
          </div>

          <div className="footer-links">
            <h3><i className="fas fa-building"></i> Institucional</h3>
            <ul>
              <li><Link to="/sobre">Sobre Nós</Link></li>
              <li><Link to="/contato">Entre em Contato</Link></li>
              <li><Link to="/termos">Termos de Serviço</Link></li>
              <li><Link to="/privacidade">Política de Privacidade</Link></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p><span className="online-indicator"></span> © {currentYear} Polícia RP. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;