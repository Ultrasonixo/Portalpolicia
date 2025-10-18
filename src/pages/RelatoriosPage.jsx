import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { Link } from 'react-router-dom';
import '../components/RelatoriosPage.css'; // O novo CSS

/* --- Componente: Cartão de Estatística (Resumo) --- */
const StatCard = ({ title, value, icon, color }) => (
    <div className="stat-card" style={{ '--icon-color': color }}>
        <div className="stat-card-icon">
            <i className={`fas ${icon}`}></i>
        </div>
        <div className="stat-card-info">
            <span className="stat-card-value">{value}</span>
            <span className="stat-card-title">{title}</span>
        </div>
    </div>
);

/* --- Componente: Cartão de Acesso (Estratégico) --- */
const StrategicReportCard = ({ title, description, icon, to }) => (
    <Link to={to} className="strategic-card">
        <div className="strategic-card-icon">
            <i className={`fas ${icon}`}></i>
        </div>
        <div className="strategic-card-content">
            <h3 className="strategic-card-title">{title}</h3>
            <p className="strategic-card-description">{description}</p>
        </div>
        <div className="strategic-card-arrow">
            <i className="fas fa-chevron-right"></i>
        </div>
    </Link>
);

/* --- Visão 1: Componente do Resumo (Stats) --- */
const ResumoView = ({ stats, loading, error, user }) => {
    if (loading) return <p className="loading-text">Carregando estatísticas...</p>;
    if (error) return <p className="error-message">{error}</p>;
    if (!stats) return null;

    return (
        <div className="report-view-content">
            {/* Categoria 1: Ocorrências */}
            <h2 className="content-title">Resumo de Ocorrências</h2>
            <div className="stat-grid">
                <StatCard title="Total Registrados" value={stats.boletins.total} icon="fa-copy" color="#3b82f6" />
                <StatCard title="Aguardando Análise" value={stats.boletins.aguardando} icon="fa-hourglass-start" color="#f59e0b" />
                <StatCard title="Em Investigação" value={stats.boletins.investigacao} icon="fa-search" color="#0ea5e9" />
                <StatCard title="Resolvidos" value={stats.boletins.resolvido} icon="fa-check-circle" color="#10b981" />
            </div>

            {/* Categoria 3: Operacional */}
            <h2 className="content-title">Atividade Recente (Últimos 30 Dias)</h2>
            <div className="stat-grid">
                <StatCard title="Promoções" value={stats.historico.promocao} icon="fa-arrow-up" color="#10b981" />
                <StatCard title="Rebaixamentos" value={stats.historico.rebaixamento} icon="fa-arrow-down" color="#f59e0b" />
                <StatCard title="Demissões" value={stats.historico.demissao} icon="fa-user-slash" color="#ef4444" />
                <StatCard title="Novos Alistamentos" value={stats.historico.aprovacao} icon="fa-user-plus" color="#0ea5e9" />
            </div>
            
            {/* Categoria 2: Pessoal (RH) - Condicional */}
            {user?.permissoes?.is_rh && (
                <>
                    <h2 className="content-title">Resumo de Efetivo (RH)</h2>
                    <div className="stat-grid">
                        <StatCard title="Efetivo Polícia Militar (PM)" value={stats.efetivo.PM || 0} icon="fa-shield-alt" color="#ef4444" />
                        <StatCard title="Efetivo Polícia Civil (PC)" value={stats.efetivo.PC || 0} icon="fa-user-secret" color="#3b82f6" />
                        <StatCard title="Efetivo Guarda Civil (GCM)" value={stats.efetivo.GCM || 0} icon="fa-hard-hat" color="#10b981" />
                        <StatCard title="Total Efetivo Ativo" value={stats.efetivo.total} icon="fa-users" color="#6366f1" />
                    </div>
                </>
            )}
        </div>
    );
};

/* --- Visão 2: Componente dos Relatórios Estratégicos --- */
const EstrategicoView = () => (
    <div className="report-view-content">
        <h2 className="content-title">Módulos de Inteligência</h2>
        <p className="content-subtitle">
            Acesse relatórios detalhados e análises estratégicas para auxiliar na tomada de decisão.
        </p>
        <div className="strategic-grid">
            <StrategicReportCard
                title="Relatório de Criminalidade"
                description="Análise de tipos de crime, comparativos mensais e mapas de calor."
                icon="fa-map-marked-alt"
                to="/policia/relatorios/criminalidade" // Link futuro
            />
            <StrategicReportCard
                title="Relatório de Eficiência Operacional"
                description="Tempo médio de resposta, taxa de solução de casos e performance."
                icon="fa-tachometer-alt"
                to="/policia/relatorios/eficiencia" // Link futuro
            />
            <StrategicReportCard
                title="Análise de Tendências"
                description="Identifique aumentos ou diminuições em atividades criminosas específicas."
                icon="fa-chart-line"
                to="/policia/relatorios/tendencias" // Link futuro
            />
            <StrategicReportCard
                title="Produtividade por Unidade"
                description="Compare o desempenho entre diferentes divisões, distritos e corporações."
                icon="fa-sitemap"
                to="/policia/relatorios/produtividade" // Link futuro
            />
        </div>
    </div>
);

/* --- Visão 3: Componente de Registro de Relatório --- */
const RegistrarRelatorioView = () => {
    const [formData, setFormData] = useState({
        titulo: '',
        conteudo: '',
        tipo_relatorio: 'Operacional',
        data_relatorio: new Date().toISOString().split('T')[0],
        id_ocorrencia_associada: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState({ type: '', text: '' });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmitReport = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitMessage({ type: '', text: '' });
        const token = localStorage.getItem('authToken');

        try {
            const response = await fetch('http://localhost:3000/api/policia/relatorios', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || `Erro HTTP ${response.status}`);
            setSubmitMessage({ type: 'success', text: 'Relatório enviado com sucesso!' });
            setFormData({
                titulo: '', conteudo: '', tipo_relatorio: 'Operacional',
                data_relatorio: new Date().toISOString().split('T')[0], id_ocorrencia_associada: ''
            });
            setTimeout(() => setSubmitMessage({ type: '', text: '' }), 4000);
        } catch (error) {
            console.error("Erro ao enviar relatório:", error);
            setSubmitMessage({ type: 'error', text: error.message || "Falha ao enviar o relatório." });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="report-view-content">
            <div className="form-container">
                <h2 className="content-title">Registrar Relatório Narrativo</h2>
                <form onSubmit={handleSubmitReport} className="report-form">
                    <div className="form-group">
                        <label htmlFor="titulo">Título do Relatório</label>
                        <input type="text" id="titulo" name="titulo" required value={formData.titulo} onChange={handleInputChange} />
                    </div>
                    
                    <div className="form-group-row">
                        <div className="form-group">
                            <label htmlFor="tipo_relatorio">Tipo de Relatório</label>
                            <select id="tipo_relatorio" name="tipo_relatorio" required value={formData.tipo_relatorio} onChange={handleInputChange}>
                                <option value="Operacional">Operacional</option>
                                <option value="Patrulhamento">Patrulhamento</option>
                                <option value="Pessoal">Pessoal</option>
                                <option value="Ocorrência">Ocorrência</option>
                                <option value="Interno">Interno</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label htmlFor="data_relatorio">Data do Fato</label>
                            <input type="date" id="data_relatorio" name="data_relatorio" required value={formData.data_relatorio} onChange={handleInputChange} />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="id_ocorrencia_associada">ID da Ocorrência Associada (Opcional)</label>
                        <input type="number" id="id_ocorrencia_associada" name="id_ocorrencia_associada" value={formData.id_ocorrencia_associada} onChange={handleInputChange} placeholder="Ex: 123"/>
                    </div>

                    <div className="form-group">
                        <label htmlFor="conteudo">Conteúdo / Narrativa</label>
                        <textarea id="conteudo" name="conteudo" rows="10" required value={formData.conteudo} onChange={handleInputChange}></textarea>
                    </div>

                    <button type="submit" className="submit-button" disabled={isSubmitting}>
                        {isSubmitting ? 'Enviando...' : 'Enviar Relatório'}
                    </button>

                    {submitMessage.text && (
                        <p className={`submit-message ${submitMessage.type}`}>
                            {submitMessage.text}
                        </p>
                    )}
                </form>
            </div>
        </div>
    );
};

/* --- Componente Principal da Página --- */
const RelatoriosPage = () => {
    const { user, logout } = useAuth();
    // Três visões: 'resumo', 'estrategico', 'registrar'
    const [view, setView] = useState('resumo'); 
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchReportData = useCallback(async () => {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('authToken');
        if (!token) {
            setError('Erro de autenticação: Token não encontrado.'); setLoading(false); return;
        }
        try {
            const response = await fetch('http://localhost:3000/api/policia/relatorios/estatisticas', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem('authToken'); if (logout) logout(); throw new Error('Sessão inválida ou sem permissão.');
            }
            if (!response.ok) {
                const errData = await response.json().catch(() => ({ message: `Erro HTTP ${response.status}` })); throw new Error(errData.message || 'Falha ao buscar dados.');
            }
            const data = await response.json();
            setStats(data);
        } catch (err) {
            console.error("Erro ao buscar dados de relatórios:", err);
            setError(`Falha ao carregar: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, [logout]);

    useEffect(() => {
        // Só busca os dados se a visão for 'resumo'
        if (user && view === 'resumo') {
            fetchReportData();
        } else {
            // Se mudar para outra visão, não precisa carregar dados de stats
            setLoading(false);
        }
    }, [user, fetchReportData, view]); // 'view' agora é uma dependência

    return (
        <div className="page-container">
            <header className="report-header">
                <h1 className="page-title">Central de Relatórios</h1>
                {/* Navegação interna da página */}
                <nav className="report-nav">
                    <button className={`nav-button ${view === 'resumo' ? 'active' : ''}`} onClick={() => setView('resumo')}>
                        <i className="fas fa-chart-pie"></i> Resumo
                    </button>
                    <button className={`nav-button ${view === 'estrategico' ? 'active' : ''}`} onClick={() => setView('estrategico')}>
                        <i className="fas fa-brain"></i> Estratégico
                    </button>
                    <button className={`nav-button ${view === 'registrar' ? 'active' : ''}`} onClick={() => setView('registrar')}>
                        <i className="fas fa-edit"></i> Registrar Relatório
                    </button>
                </nav>
            </header>

            {/* Conteúdo principal que muda baseado na 'view' */}
            <main className="report-content">
                {view === 'resumo' && <ResumoView stats={stats} loading={loading} error={error} user={user} />}
                {view === 'estrategico' && <EstrategicoView />}
                {view === 'registrar' && <RegistrarRelatorioView />}
            </main>
        </div>
    );
};

export default RelatoriosPage;