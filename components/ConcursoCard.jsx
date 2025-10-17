import React from 'react';
import './ConcursoCard.css';

function ConcursoCard({ concurso }) {
    const formatarData = (data) => {
        if (!data) return 'N/A';
        const dataObj = new Date(data);
        return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(dataObj);
    };

    return (
        <div className="concurso-card">
            <div className={`status-tag status-${concurso.status.toLowerCase().replace(' ', '-')}`}>
                {concurso.status}
            </div>
            <h3 className="card-titulo">{concurso.titulo}</h3>
            <div className="card-info">
                <span><i className="fas fa-users"></i> {concurso.vagas} Vagas</span>
                <span><i className="fas fa-calendar-times"></i> Encerra em: {formatarData(concurso.data_encerramento)}</span>
            </div>
            <p className="card-descricao">{concurso.descricao.substring(0, 150)}...</p>
            <a href={concurso.link_edital} target="_blank" rel="noopener noreferrer" className="btn-edital">
                Acessar Edital <i className="fas fa-arrow-right"></i>
            </a>
        </div>
    );
}

export default ConcursoCard;