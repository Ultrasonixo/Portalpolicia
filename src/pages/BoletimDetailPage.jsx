// src/pages/BoletimDetailPage.jsx - VERSÃO COMPLETA E CORRIGIDA

import React, { useState, useEffect, useCallback } from 'react'; // <<< useCallback IMPORTADO
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Confirme o caminho
import '../components/BoletimDetailPage.css'; // Confirme o caminho

const BoletimDetailPage = () => {
    const { id: boletimId } = useParams(); // Renomeia id para boletimId
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth(); // Pega user e logout

    const [boletim, setBoletim] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [novoSuspeito, setNovoSuspeito] = useState({ nome: '', passaporte: '', status: 'Investigado' });
    const [arquivosParaUpload, setArquivosParaUpload] = useState([]);
    const [error, setError] = useState(null);

    // --- Permissões (recalculadas quando user ou boletim mudam) ---
    const isCivil = user?.corporacao === 'PC';
    const isResponsavelPeloCaso = boletim?.policial_responsavel_id === user?.id;
    const podeAssumir = isCivil && boletim && !boletim.policial_responsavel_id;
    const podeEditarCampos = isCivil && isResponsavelPeloCaso && isEditing;

    // --- Função para buscar dados (agora envolvida em useCallback) ---
    const fetchData = useCallback(async () => {
         console.log(`BoletimDetail (${boletimId}): Iniciando fetchData. User:`, user); // Log
         setLoading(true);
         setError(null);

         const token = localStorage.getItem('authToken'); // Use a chave correta
         if (!token) {
             console.error(`BoletimDetail (${boletimId}) Error: Token não encontrado.`);
             setError('Erro de autenticação: Token não encontrado. Faça login novamente.');
             setLoading(false);
             // if (logout) logout(); // Opcional: deslogar
             return;
         }
         const headers = { 'Authorization': `Bearer ${token}` }; // Headers para GET

         try {
             const response = await fetch(`http://localhost:3000/api/policia/boletins/${boletimId}`, { headers });
             console.log(`BoletimDetail (${boletimId}): Fetch status:`, response.status); // Log

             if (response.status === 401 || response.status === 403) {
                 console.error(`BoletimDetail (${boletimId}) Error: Token inválido ou expirado (401/403).`);
                 localStorage.removeItem('authToken');
                 if (logout) logout();
                 setError('Sua sessão expirou ou é inválida. Faça login novamente.');
                 setLoading(false);
                 return;
             }
             if (!response.ok) {
                 let errorMsg = `Erro ${response.status} ao carregar boletim.`;
                 try { const errData = await response.json(); errorMsg = errData.message || errorMsg; } catch (e) { /* ignore */ }
                 throw new Error(errorMsg);
             }

             const data = await response.json();
             console.log(`BoletimDetail (${boletimId}): Dados recebidos:`, data); // Log
             setBoletim(data);
             setIsEditing(location.state?.startInEditMode === true && data.policial_responsavel_id === user?.id);

         } catch (err) {
             console.error(`BoletimDetail (${boletimId}) CATCH:`, err);
             setError(`Falha ao carregar boletim: ${err.message}`);
             setBoletim(null); // Limpa dados em caso de erro
         } finally {
              console.log(`BoletimDetail (${boletimId}) FINALLY: Set loading false.`); // Log
             setLoading(false);
         }
     // eslint-disable-next-line react-hooks/exhaustive-deps
     }, [boletimId, user?.id, logout, location.state?.startInEditMode]); // Dependências atualizadas

    // useEffect para chamar fetchData
    useEffect(() => {
        if (user !== undefined) { // Só executa se user estiver definido (não inicial)
             fetchData();
        }
    }, [user, fetchData]); // Depende do user e da função fetchData memoizada


    // --- Handlers (Funções para Update, FileChange, Assumir, etc.) ---
     const handleUpdate = async (e) => {
        e.preventDefault();
        if(!podeEditarCampos) return;

        const token = localStorage.getItem('authToken');
        if (!token) { alert('Erro: Token não encontrado. Faça login.'); return; }
        const headers = { 'Authorization': `Bearer ${token}` };

        const formDataToSend = new FormData();
        formDataToSend.append('status', boletim.status);
        formDataToSend.append('policial_responsavel_id', boletim.policial_responsavel_id || null);
        formDataToSend.append('unidade_policial', boletim.unidade_policial || '');
        formDataToSend.append('envolvidos_identificados', JSON.stringify(boletim.envolvidos_identificados || []));
        formDataToSend.append('evidencias_coletadas', boletim.evidencias_coletadas || '');
        formDataToSend.append('relato_policial', boletim.relato_policial || '');
        formDataToSend.append('encaminhamento', boletim.encaminhamento || '');
        formDataToSend.append('observacoes_internas', boletim.observacoes_internas || '');
        formDataToSend.append('imagens_existentes', JSON.stringify(boletim.anexos_imagens || []));
        for (let i = 0; i < arquivosParaUpload.length; i++) { formDataToSend.append('anexos', arquivosParaUpload[i]); }

        try {
            const response = await fetch(`http://localhost:3000/api/policia/boletins/${boletimId}`, {
                method: 'PUT',
                headers: headers, // Envia o header Authorization
                body: formDataToSend,
            });

             if (response.status === 401 || response.status === 403) {
                 localStorage.removeItem('authToken'); if (logout) logout(); alert('Sessão inválida. Faça login.'); return;
             }

            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Falha ao atualizar');
            alert(result.message);
            setIsEditing(false);
            setArquivosParaUpload([]);
            fetchData(); // Recarrega os dados
        } catch (error) {
            alert('Falha ao atualizar o boletim: ' + error.message);
        }
    };

     const handleFileChange = (e) => { setArquivosParaUpload(Array.from(e.target.files).slice(0, 5)); };
     const removerImagemExistente = (nomeImagem) => { if (!podeEditarCampos) return; if (window.confirm("Remover esta imagem permanentemente? Salve as alterações para confirmar.")) { const novasImagens = boletim.anexos_imagens.filter(img => img !== nomeImagem); setBoletim({ ...boletim, anexos_imagens: novasImagens }); } };
     const handleInputChange = (e) => { if(!podeEditarCampos && e.target.name !== 'status') return; const { name, value } = e.target; setBoletim({ ...boletim, [name]: value }); };
     const adicionarSuspeito = () => { if(!podeEditarCampos) return; if (!novoSuspeito.nome || !novoSuspeito.passaporte) { alert('Nome e passaporte são obrigatórios.'); return; } const novaLista = [...(boletim.envolvidos_identificados || []), novoSuspeito]; setBoletim({ ...boletim, envolvidos_identificados: novaLista }); setNovoSuspeito({ nome: '', passaporte: '', status: 'Investigado' }); };
     const removerSuspeito = (index) => { if(!podeEditarCampos) return; const novaLista = boletim.envolvidos_identificados.filter((_, i) => i !== index); setBoletim({ ...boletim, envolvidos_identificados: novaLista }); };

    // Handler para Assumir Caso
    const handleAssumirCaso = async () => {
        if (!podeAssumir) return;

        const token = localStorage.getItem('authToken');
        if (!token) { alert('Erro: Token não encontrado. Faça login.'); return; }
        const headers = {
             'Authorization': `Bearer ${token}`,
             'Content-Type': 'application/json'
         };

        try {
            const response = await fetch(`http://localhost:3000/api/policia/boletins/${boletimId}/assumir`, {
                method: 'PUT',
                headers: headers,
            });

             if (response.status === 401 || response.status === 403) {
                 localStorage.removeItem('authToken'); if (logout) logout(); alert('Sessão inválida. Faça login.'); return;
             }

            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            alert(result.message);
            await fetchData(); // Recarrega os dados
            setIsEditing(true); // Entra no modo de edição
        } catch (error) {
            alert('Falha ao assumir o caso: ' + error.message);
        }
    };
    // --- Fim Handlers ---


    // --- Renderização ---
    if (loading) return <div className="page-container"><h1>Carregando...</h1></div>;
    if (error) return <div className="page-container"><h1>Erro</h1><p className="error-message">{error}</p><button onClick={() => navigate(-1)} className="back-button">Voltar</button></div>;
    if (!boletim) return <div className="page-container"><h1>Boletim não encontrado.</h1><button onClick={() => navigate(-1)} className="back-button">Voltar</button></div>;

    // Função interna para renderizar botões (COM JSX CORRETO)
    const BotaoAcaoPrincipal = () => {
        if (podeAssumir) {
            return (
                <button type="button" onClick={handleAssumirCaso} className="btn-assumir">
                    <i className="fas fa-gavel"></i> Assumir Caso
                </button>
            );
        }
        if (isResponsavelPeloCaso && isCivil) {
            if (isEditing) {
                return (
                    <div className="form-actions">
                        <button type="submit" className="btn-save">Salvar Alterações</button>
                        <button type="button" onClick={() => { setIsEditing(false); fetchData(); }} className="btn-cancel">Cancelar Edição</button>
                    </div>
                );
            } else {
                 return (
                    <button type="button" onClick={() => setIsEditing(true)} className="btn-edit">
                       <i className="fas fa-pencil-alt"></i> Editar Caso
                    </button>
                 );
            }
        }
        return null;
    };


    // JSX Principal
    return (
        <div className="page-container">
            <button type="button" onClick={() => navigate(-1)} className="back-button">&larr; Voltar</button>
            <h1 className="page-title">Boletim: {boletim.protocolo || 'N/A'}</h1>
            <form onSubmit={podeEditarCampos ? handleUpdate : (e) => e.preventDefault()} className="boletim-details-grid">

                {/* Card Denunciante */}
                <div className="details-card">
                    <div className="card-header"><i className="fas fa-user-tie"></i><h3>Info Denunciante</h3></div>
                    <div className="info-grid">
                        <strong>Nome:</strong> <span>{boletim.denunciante_nome || 'N/A'}</span>
                        <strong>Passaporte:</strong> <span>{boletim.denunciante_passaporte || 'N/A'}</span>
                        <strong>Telefone:</strong> <span>{boletim.denunciante_telefone || 'Não informado'}</span>
                        <strong>Gmail:</strong> <span>{boletim.denunciante_gmail || 'Não informado'}</span>
                    </div>
                    <hr/>
                    <strong>Relato:</strong>
                    <div className="descricao-box">{boletim.descricao || 'Sem descrição.'}</div>
                </div>

                 {/* Card Gerenciamento Policial */}
                <div className="details-card">
                    <div className="card-header"><i className="fas fa-shield-alt"></i><h3>Gerenciamento Policial</h3></div>
                     {boletim.policial_responsavel_id ? (
                         <div className="info-grid">
                            <strong>Responsável:</strong> <span>{boletim.policial_responsavel_nome || 'N/A'} ({boletim.policial_responsavel_passaporte || 'N/A'})</span>
                            <strong>Data Assumida:</strong> <span>{boletim.data_assumido ? new Date(boletim.data_assumido).toLocaleString('pt-BR') : 'N/A'}</span>
                        </div>
                     ) : ( <p style={{color: '#999', textAlign: 'center'}}>Aguardando Policial Civil assumir.</p> )}

                    <div className="form-group">
                        <label>Status</label>
                        <select name="status" value={boletim.status || ''} onChange={handleInputChange} disabled={!podeEditarCampos}>
                            <option value="Aguardando Análise">Aguardando Análise</option>
                            <option value="Em Investigação">Em Investigação</option>
                            <option value="Resolvido">Resolvido</option>
                            <option value="Arquivado">Arquivado</option>
                            <option value="Falso">Falso</option>
                        </select>
                    </div>
                     <div className="form-group">
                        <label>Unidade Policial</label>
                        <input type="text" name="unidade_policial" value={boletim.unidade_policial || ''} onChange={handleInputChange} disabled={!podeEditarCampos} placeholder="Ex: 80ª DP"/>
                    </div>
                     <div className="form-group">
                        <label>Encaminhamento</label>
                        <input type="text" name="encaminhamento" value={boletim.encaminhamento || ''} onChange={handleInputChange} disabled={!podeEditarCampos} placeholder="Ex: Arquivado, Ministério Público"/>
                    </div>
                    {/* Renderiza o botão principal (Assumir, Editar, Salvar) */}
                    <BotaoAcaoPrincipal />
                </div>

                 {/* Card Envolvidos/Suspeitos */}
                <div className="details-card full-width">
                     <div className="card-header"><i className="fas fa-users"></i><h3>Envolvidos Identificados</h3></div>
                     {podeEditarCampos && (
                        <div className="add-suspeito-form">
                            <input type="text" placeholder="Nome do Envolvido" value={novoSuspeito.nome} onChange={e => setNovoSuspeito({...novoSuspeito, nome: e.target.value})} />
                            <input type="text" placeholder="Passaporte" value={novoSuspeito.passaporte} onChange={e => setNovoSuspeito({...novoSuspeito, passaporte: e.target.value})} />
                            <select value={novoSuspeito.status} onChange={e => setNovoSuspeito({...novoSuspeito, status: e.target.value})}>
                                <option>Investigado</option>
                                <option>Preso</option>
                                <option>Foragido</option>
                                <option>Liberado</option>
                                <option>Vítima</option>
                                <option>Testemunha</option>
                                <option>Outro</option>
                            </select>
                            <button type="button" onClick={adicionarSuspeito} className="btn-add-small" title="Adicionar Envolvido">+</button>
                        </div>
                     )}
                     <div className="table-responsive">
                         <table className="suspeitos-table">
                            <thead><tr><th>Nome</th><th>Passaporte</th><th>Status</th>{podeEditarCampos && <th>Ação</th>}</tr></thead>
                            <tbody>
                                {boletim.envolvidos_identificados?.map((s, index) => (
                                    <tr key={index}>
                                        <td>{s.nome}</td><td>{s.passaporte}</td><td>{s.status}</td>
                                        {podeEditarCampos && <td><button type="button" onClick={() => removerSuspeito(index)} className="btn-remover" title="Remover Envolvido">Remover</button></td>}
                                    </tr>
                                ))}
                                {!boletim.envolvidos_identificados?.length && (
                                    <tr><td colSpan={podeEditarCampos ? 4: 3} style={{textAlign: 'center', color: '#999'}}>Nenhum envolvido adicionado.</td></tr>
                                )}
                            </tbody>
                         </table>
                     </div>
                </div>

                 {/* Card Evidências Anexadas */}
                <div className="details-card full-width">
                    <div className="card-header"><i className="fas fa-paperclip"></i><h3>Evidências Anexadas</h3></div>
                    <div className="galeria-imagens">
                        {boletim.anexos_imagens?.map(imagem => (
                            <div key={imagem} className="imagem-container">
                                <a href={`http://localhost:3000/uploads/${imagem}`} target="_blank" rel="noopener noreferrer" title="Ver imagem ampliada">
                                    <img src={`http://localhost:3000/uploads/${imagem}`} alt={`Anexo ${imagem}`} />
                                </a>
                                {podeEditarCampos && (
                                    <button type="button" className="btn-remover-img" onClick={() => removerImagemExistente(imagem)} title="Remover Imagem (ao salvar)">
                                        &times;
                                    </button>
                                )}
                            </div>
                        ))}
                         {!boletim.anexos_imagens?.length && <p style={{textAlign: 'center', color: '#999'}}>Nenhuma imagem anexada.</p>}
                    </div>

                    {podeEditarCampos && (
                        <div className="form-group" style={{marginTop: '20px'}}>
                            <label htmlFor="anexos">Adicionar Novas Imagens (Máx: 5)</label>
                            <input type="file" id="anexos" name="anexos" multiple accept="image/*" onChange={handleFileChange} />
                        </div>
                    )}
                </div>

                 {/* Cards Relato Policial e Observações */}
                <div className="details-card">
                    <div className="card-header"><i className="fas fa-file-alt"></i><h3>Relato Policial / Conclusão</h3></div>
                    <textarea name="relato_policial" rows="8" value={boletim.relato_policial || ''} onChange={handleInputChange} disabled={!podeEditarCampos} placeholder={podeEditarCampos ? "Descreva a investigação, ações tomadas e conclusão..." : "Sem relato."}></textarea>
                </div>
                <div className="details-card">
                    <div className="card-header"><i className="fas fa-archive"></i><h3>Observações Internas</h3></div>
                    <textarea name="observacoes_internas" rows="8" value={boletim.observacoes_internas || ''} onChange={handleInputChange} disabled={!podeEditarCampos} placeholder={podeEditarCampos ? "Anotações internas, evidências coletadas..." : "Sem observações."}></textarea>
                </div>

            </form>
        </div>
    );
};

export default BoletimDetailPage;