// src/pages/BoletimDetailPage.jsx - VERSÃO COM LÓGICA DE VISUALIZAÇÃO/EDIÇÃO REFINADA

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../components/BoletimDetailPage.css'; // Certifique-se que o nome do seu CSS está correto

const BoletimDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

    const [boletim, setBoletim] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [novoSuspeito, setNovoSuspeito] = useState({ nome: '', passaporte: '', status: 'Investigado' });
    const [arquivosParaUpload, setArquivosParaUpload] = useState([]); // Estado para os novos arquivos

    const fetchData = async () => {
        try {
            const response = await fetch(`http://localhost:3000/api/policia/boletins/${id}`);
            if (!response.ok) throw new Error('Boletim não encontrado');
            const data = await response.json();
            setBoletim(data);
            
            // Define o modo inicial (edição ou visualização) com base no clique do usuário
            setIsEditing(location.state?.startInEditMode === true);

        } catch (error) {
            console.error("Erro ao carregar dados:", error);
            setBoletim(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setLoading(true);
        fetchData();
    }, [id, location.state]); // Roda o efeito se o ID ou o state da navegação mudar

    const handleUpdate = async (e) => {
        e.preventDefault();
        
        // Usa FormData para poder enviar texto e arquivos juntos
        const formData = new FormData();
        
        // Adiciona todos os campos de texto ao FormData
        formData.append('status', boletim.status);
        formData.append('policial_responsavel_id', boletim.policial_responsavel_id);
        formData.append('unidade_policial', boletim.unidade_policial || '');
        formData.append('envolvidos_identificados', JSON.stringify(boletim.envolvidos_identificados || []));
        formData.append('evidencias_coletadas', boletim.evidencias_coletadas || '');
        formData.append('relato_policial', boletim.relato_policial || '');
        formData.append('encaminhamento', boletim.encaminhamento || '');
        formData.append('observacoes_internas', boletim.observacoes_internas || '');
        
        // Envia a lista de imagens que já existem para o backend não as apagar
        formData.append('imagens_existentes', JSON.stringify(boletim.anexos_imagens || []));
        
        // Adiciona os novos arquivos de imagem ao FormData
        for (let i = 0; i < arquivosParaUpload.length; i++) {
            formData.append('anexos', arquivosParaUpload[i]);
        }
        
        try {
            const response = await fetch(`http://localhost:3000/api/policia/boletins/${id}`, {
                method: 'PUT',
                body: formData, // Envia o FormData em vez de JSON
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            alert(result.message);
            setIsEditing(false);
            setArquivosParaUpload([]); // Limpa a seleção de arquivos após o upload
            fetchData();
        } catch (error) {
            alert('Falha ao atualizar o boletim: ' + error.message);
        }
    };

    const handleFileChange = (e) => {
        setArquivosParaUpload(e.target.files);
    };

    const removerImagemExistente = (nomeImagem) => {
        if (window.confirm("Tem certeza que deseja remover esta imagem? Esta ação é permanente.")) {
            const novasImagens = boletim.anexos_imagens.filter(img => img !== nomeImagem);
            setBoletim({ ...boletim, anexos_imagens: novasImagens });
        }
    };
    
    const handleAssumirCaso = async () => {
        if (!user || !user.id) { alert('Erro: Não foi possível identificar o policial logado.'); return; }
        try {
            const response = await fetch(`http://localhost:3000/api/policia/boletins/${id}/assumir`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ policial_id: user.id }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            alert(result.message);
            fetchData();
        } catch (error) {
            alert('Falha ao assumir o caso: ' + error.message);
        }
    };
    
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setBoletim({ ...boletim, [name]: value });
    };

    const adicionarSuspeito = () => {
        if (!novoSuspeito.nome || !novoSuspeito.passaporte) { alert('Nome e passaporte do suspeito são obrigatórios.'); return; }
        const novaLista = [...(boletim.envolvidos_identificados || []), novoSuspeito];
        setBoletim({ ...boletim, envolvidos_identificados: novaLista });
        setNovoSuspeito({ nome: '', passaporte: '', status: 'Investigado' });
    };

    const removerSuspeito = (index) => {
        const novaLista = boletim.envolvidos_identificados.filter((_, i) => i !== index);
        setBoletim({ ...boletim, envolvidos_identificados: novaLista });
    };

    if (loading) return <div className="page-container"><h1>Carregando...</h1></div>;
    if (!boletim) return <div className="page-container"><h1>Boletim não encontrado.</h1></div>;

    const isResponsavelPeloCaso = boletim.policial_responsavel_id === user?.id;
    const podeEditarCampos = isEditing && isResponsavelPeloCaso;

    const BotaoAcaoPrincipal = () => {
        if (!boletim.policial_responsavel_id) {
            if (isEditing) {
                return (
                    <button type="button" onClick={handleAssumirCaso} className="btn-assumir">
                        <i className="fas fa-gavel"></i> Assumir Caso
                    </button>
                );
            }
            return null;
        }
        
        if (isResponsavelPeloCaso) {
            if (isEditing) {
                return (
                    <div className="form-actions">
                        <button type="submit" className="btn-save">Salvar Alterações</button>
                        <button type="button" onClick={() => { setIsEditing(false); fetchData(); }} className="btn-cancel">Cancelar</button>
                    </div>
                );
            }
            return (
                <button type="button" onClick={() => setIsEditing(true)} className="btn-edit">
                    Editar Caso
                </button>
            );
        }
        return null;
    };

    return (
        <div className="page-container">
            <button type="button" onClick={() => navigate(-1)} className="back-button">&larr; Voltar para a lista</button>
            <h1 className="page-title">Boletim de Ocorrência: {boletim.protocolo}</h1>
            <form onSubmit={handleUpdate} className="boletim-details-grid">
                
                <div className="details-card">
                    <div className="card-header"><i className="fas fa-user-tie"></i><h3>Informações do Denunciante</h3></div>
                    <div className="info-grid">
                        <strong>Nome:</strong> <span>{boletim.denunciante_nome}</span>
                        <strong>Passaporte:</strong> <span>{boletim.denunciante_passaporte}</span>
                        <strong>Telefone:</strong> <span>{boletim.denunciante_telefone || 'Não informado'}</span>
                        <strong>Gmail:</strong> <span>{boletim.denunciante_gmail || 'Não informado'}</span>
                    </div>
                    <hr/>
                    <strong>Relato do Cidadão:</strong>
                    <div className="descricao-box">{boletim.descricao}</div>
                </div>

                <div className="details-card">
                    <div className="card-header"><i className="fas fa-shield-alt"></i><h3>Gerenciamento Policial</h3></div>
                    {boletim.policial_responsavel_id ? (
                        <div className="info-grid">
                            <strong>Responsável:</strong> <span>{boletim.policial_responsavel_nome} (ID: {boletim.policial_responsavel_passaporte})</span>
                            <strong>Data Assumida:</strong> <span>{new Date(boletim.data_assumido).toLocaleString('pt-BR')}</span>
                        </div>
                    ) : (
                        <p style={{color: '#999', textAlign: 'center'}}>Aguardando policial assumir o caso.</p>
                    )}
                    <div className="form-group">
                        <label>Status</label>
                        <select name="status" value={boletim.status} onChange={handleInputChange} disabled={!podeEditarCampos}>
                            <option>Aguardando Análise</option><option>Em Investigação</option><option>Resolvido</option><option>Arquivado</option><option>Falso</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Unidade Policial</label>
                        <input type="text" name="unidade_policial" value={boletim.unidade_policial || ''} onChange={handleInputChange} disabled={!podeEditarCampos} />
                    </div>
                    <div className="form-group">
                        <label>Encaminhamento</label>
                        <input type="text" name="encaminhamento" value={boletim.encaminhamento || ''} onChange={handleInputChange} disabled={!podeEditarCampos} />
                    </div>
                </div>

                <div className="details-card full-width">
                     <div className="card-header"><i className="fas fa-users"></i><h3>Envolvidos Identificados (Suspeitos)</h3></div>
                     {podeEditarCampos && (
                        <div className="add-suspeito-form">
                            <input type="text" placeholder="Nome do Suspeito" value={novoSuspeito.nome} onChange={e => setNovoSuspeito({...novoSuspeito, nome: e.target.value})} />
                            <input type="text" placeholder="Passaporte" value={novoSuspeito.passaporte} onChange={e => setNovoSuspeito({...novoSuspeito, passaporte: e.target.value})} />
                            <select value={novoSuspeito.status} onChange={e => setNovoSuspeito({...novoSuspeito, status: e.target.value})}>
                                <option>Investigado</option><option>Preso</option><option>Foragido</option><option>Liberado</option>
                            </select>
                            <button type="button" onClick={adicionarSuspeito}>Adicionar</button>
                        </div>
                     )}
                     <table className="suspeitos-table">
                        <thead><tr><th>Nome</th><th>Passaporte</th><th>Status</th>{podeEditarCampos && <th>Ação</th>}</tr></thead>
                        <tbody>
                            {boletim.envolvidos_identificados?.map((s, index) => (
                                <tr key={index}>
                                    <td>{s.nome}</td><td>{s.passaporte}</td><td>{s.status}</td>
                                    {podeEditarCampos && <td><button type="button" onClick={() => removerSuspeito(index)} className="btn-remover">Remover</button></td>}
                                </tr>
                            ))}
                        </tbody>
                     </table>
                     {!boletim.envolvidos_identificados?.length && <p style={{textAlign: 'center', color: '#999'}}>Nenhum suspeito adicionado.</p>}
                </div>

                <div className="details-card full-width">
                    <div className="card-header"><i className="fas fa-paperclip"></i><h3>Evidências Anexadas</h3></div>
                    <div className="galeria-imagens">
                        {boletim.anexos_imagens && boletim.anexos_imagens.map(imagem => (
                            <div key={imagem} className="imagem-container">
                                <a href={`http://localhost:3000/uploads/${imagem}`} target="_blank" rel="noopener noreferrer">
                                    <img src={`http://localhost:3000/uploads/${imagem}`} alt="Anexo" />
                                </a>
                                {podeEditarCampos && (
                                    <button type="button" className="btn-remover-img" onClick={() => removerImagemExistente(imagem)}>
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
                            <input 
                                type="file" 
                                id="anexos"
                                name="anexos"
                                multiple 
                                accept="image/png, image/jpeg"
                                onChange={handleFileChange}
                            />
                        </div>
                    )}
                </div>

                <div className="details-card">
                    <div className="card-header"><i className="fas fa-file-alt"></i><h3>Relato Policial / Conclusão</h3></div>
                    <textarea name="relato_policial" rows="8" value={boletim.relato_policial || ''} onChange={handleInputChange} disabled={!podeEditarCampos}></textarea>
                </div>
                <div className="details-card">
                    <div className="card-header"><i className="fas fa-archive"></i><h3>Evidências e Observações Internas</h3></div>
                    <textarea name="observacoes_internas" rows="8" value={boletim.observacoes_internas || ''} onChange={handleInputChange} disabled={!podeEditarCampos}></textarea>
                </div>

                <div className="full-width">
                    <BotaoAcaoPrincipal />
                </div>
            </form>
        </div>
    );
};

export default BoletimDetailPage;