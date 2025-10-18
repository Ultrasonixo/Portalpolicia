// src/pages/PoliceProfilePage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Timeline from '../components/Timeline.jsx';
import '../components/PoliceProfilePage.css';

const PoliceProfilePage = () => {
    const { id } = useParams();
    const [policial, setPolicial] = useState(null);
    const [historico, setHistorico] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [perfilResponse, historicoResponse] = await Promise.all([
                    fetch(`http://localhost:3000/api/policia/perfil/${id}`),
                    fetch(`http://localhost:3000/api/policia/perfil/${id}/historico`)
                ]);
                if (!perfilResponse.ok) throw new Error('Policial não encontrado.');
                const perfilData = await perfilResponse.json();
                const historicoData = await historicoResponse.json();
                setPolicial(perfilData);
                setHistorico(historicoData);
            } catch (error) { console.error("Erro:", error); } 
            finally { setLoading(false); }
        };
        fetchData();
    }, [id]);

    if (loading) return <div className="page-container"><p>Carregando perfil...</p></div>;
    if (!policial) return <div className="page-container"><h1>Ops!</h1><p>Policial não encontrado.</p></div>;

    return (
        <div className="page-container">
            <div className="profile-grid">
                <aside className="profile-sidebar">
                    <div className="profile-card">
                        <div className="profile-avatar">
                            <img src={`https://www.habbo.com.br/habbo-imaging/avatarimage?user=${policial.nome_completo}&action=std&direction=2&head_direction=2&gesture=sml&size=l`} alt={`Avatar de ${policial.nome_completo}`} />
                        </div>
                        <h3>{policial.nome_completo}</h3>
                        <p className="profile-passaporte">Passaporte: {policial.passaporte}</p>
                        <div className="profile-info-grid">
                            <strong>Patente:</strong><span>{policial.patente || 'Não definida'}</span>
                            <strong>Guarnição:</strong><span>{policial.guarnicao || 'Não definida'}</span>
                            <strong>Status:</strong><span><span className={`status-pill status-${policial.status}`}>{policial.status}</span></span>
                        </div>
                    </div>
                </aside>
                <main className="profile-main-content">
                    <div className="content-widget">
                        <h2 className="widget-title">Timeline do Policial</h2>
                        <Timeline events={historico} />
                    </div>
                </main>
            </div>
        </div>
    );
};
export default PoliceProfilePage;