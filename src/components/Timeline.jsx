// src/components/Timeline.jsx
import React from 'react';
import './Timeline.css';

const getEventStyle = (eventType) => {
    switch (eventType) {
        case 'Promoção': return { icon: 'fa-arrow-up', color: 'green' };
        case 'Demissão': case 'Rebaixamento': return { icon: 'fa-arrow-down', color: 'red' };
        case 'Aprovação': case 'Elogio': return { icon: 'fa-check', color: 'blue' };
        case 'Criação de Conta': return { icon: 'fa-user-plus', color: 'grey' };
        case 'Advertência': return { icon: 'fa-exclamation-triangle', color: 'orange' };
        default: return { icon: 'fa-info-circle', color: 'grey' };
    }
};

const Timeline = ({ events }) => {
    if (!events || events.length === 0) {
        return <p className="empty-state">Nenhum evento registrado no histórico deste policial.</p>;
    }
    const formatarData = (data) => new Date(data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
    return (
        <div className="timeline-container">
            {events.map((event, index) => {
                const { icon, color } = getEventStyle(event.tipo_evento);
                return (
                    <div key={index} className="timeline-item">
                        <div className={`timeline-icon ${color}`}><i className={`fas ${icon}`}></i></div>
                        <div className="timeline-content">
                            <h4>{event.tipo_evento}</h4>
                            <span className="timeline-date">{formatarData(event.data_evento)}</span>
                            <p>{event.descricao}</p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
export default Timeline;