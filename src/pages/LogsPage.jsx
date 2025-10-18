
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx'; // Confirme o caminho
import '../components/LogsPage.css'; // Certifique-se que este CSS existe e está correto

const LogsPage = () => {
    const { user, logout } = useAuth();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true); // Inicia carregando
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [limit] = useState(25); // Logs por página

    // Função para buscar os logs da API
    const fetchLogs = useCallback(async (pageToFetch) => {
        // Verifica permissão antes de buscar
        if (!user?.permissoes?.is_rh) {
            setError("Acesso negado. Apenas RH.");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        console.log(`LogsPage: Fetching logs for page ${pageToFetch}`);

        const token = localStorage.getItem('authToken'); // Use a chave correta
        if (!token) {
            setError('Erro de autenticação: Token não encontrado.'); setLoading(false); return;
        }
        const headers = { 'Authorization': `Bearer ${token}` };

        try {
            const response = await fetch(`http://localhost:3000/api/admin/logs?page=${pageToFetch}&limit=${limit}`, { headers });
            console.log(`LogsPage: Fetch status for page ${pageToFetch}:`, response.status);

            if (response.status === 401 || response.status === 403) {
                 localStorage.removeItem('authToken'); if (logout) logout(); throw new Error('Sessão inválida ou sem permissão para ver logs.');
            }
            if (!response.ok) {
                 const errData = await response.json().catch(()=>({message: `Erro HTTP ${response.status}`})); throw new Error(errData.message || 'Falha ao buscar logs.');
            }

            const data = await response.json();
            console.log(`LogsPage: Data received for page ${pageToFetch}:`, data);
            setLogs(data.logs || []);
            setCurrentPage(data.currentPage || 1);
            setTotalPages(data.totalPages || 1);

        } catch (err) {
            console.error("Erro ao buscar logs:", err);
            setError(`Falha ao carregar logs: ${err.message}`);
            setLogs([]); // Limpa logs em caso de erro
        } finally {
            setLoading(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, limit, logout]); // Depende do user (para permissão), limit e logout

    // useEffect para buscar Logs na montagem e mudança de página/usuário
    useEffect(() => {
        // Roda apenas se user estiver definido (carregado pelo AuthContext)
        if (user !== undefined) {
             fetchLogs(currentPage);
        }
        // Se user for undefined, espera carregar
    }, [currentPage, user, fetchLogs]); // Depende da página, user e da função fetchLogs

    // Funções de Paginação
    const handlePreviousPage = () => { if (currentPage > 1) setCurrentPage(p => p - 1); };
    const handleNextPage = () => { if (currentPage < totalPages) setCurrentPage(p => p + 1); };

    // Funções Auxiliares de Formatação (mesmas da AdminPage anterior)
    const formatDateTime = (dateTimeString) => {
         if (!dateTimeString) return 'N/A';
         try { return new Date(dateTimeString).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'medium' }); }
         catch (e) { return 'Inválida'; }
    };
    const renderDetails = (details) => {
        if (!details) return '-';
        if (typeof details === 'object') {
            try { return <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: '0.8em' }}>{JSON.stringify(details, null, 2)}</pre>; }
            catch (e) { return String(details); }
        }
        return String(details);
    };

    // Verifica permissão antes de renderizar conteúdo principal
     if (user !== undefined && !user?.permissoes?.is_rh) { // Checa apenas depois que user carregou
         return (
             <div className="page-container">
                 <h1 className="page-title">Acesso Negado</h1>
                 <p className="page-subtitle">Apenas administradores RH podem visualizar esta página.</p>
             </div>
         );
     }

    // Renderização Principal
    return (
        <div className="page-container">
            <h1 className="page-title">Logs de Auditoria ({user?.corporacao || 'RH Geral'})</h1>
            <p className="page-subtitle">Registro de ações administrativas realizadas.</p>

            {/* Mostra erro ou loading */}
            {loading && <p style={{textAlign: 'center'}}>Carregando logs...</p>}
            {error && <p className="error-message" style={{textAlign: 'center'}}>{error}</p>}

            {/* Tabela de Logs (só mostra se não estiver carregando e não houver erro) */}
            {!loading && !error && (
                <div className="logs-table-widget">
                    <div className="table-responsive">
                        <table className="logs-table">
                            <thead>
                                <tr>
                                    <th style={{width: '180px'}}>Data/Hora</th>
                                    <th style={{width: '180px'}}>Administrador</th>
                                    <th>Ação</th>
                                    <th>Detalhes</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.length > 0 ? (
                                    logs.map(log => (
                                        <tr key={log.id}>
                                            <td>{formatDateTime(log.data_log)}</td>
                                            <td>{log.admin_nome || `ID ${log.usuario_id}`} ({log.admin_corporacao || 'N/A'})</td>
                                            <td>{log.acao}</td>
                                            <td className="log-details">{renderDetails(log.detalhes)}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" style={{ textAlign: 'center', color: '#6c757d', padding: '20px' }}>
                                            Nenhum log encontrado{currentPage > 1 ? ` na página ${currentPage}`: ''}.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Controles de Paginação */}
                    {totalPages > 1 && (
                        <div className="pagination-controls">
                            <button onClick={handlePreviousPage} disabled={currentPage <= 1 || loading}>
                                &laquo; Anterior
                            </button>
                            <span>Página {currentPage} de {totalPages}</span>
                            <button onClick={handleNextPage} disabled={currentPage >= totalPages || loading}>
                                Próxima &raquo;
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default LogsPage;