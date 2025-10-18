// src/components/ApprovalModal.jsx - Versão com Token (sem select de corporação)
import React, { useState, useEffect } from 'react';
import './Modal.css'; // Confirme o caminho

// Lista de divisões (EXEMPLO - BUSCAR DO BACKEND SERIA MELHOR)
// Adapte esta lista com as divisões REAIS de cada corporação
const divisoesPorCorporacao = {
    PM: [
        "Corregedoria da Policia Militar - \"DPM\"",
        "37º Batalhão de Polícia Militar Metropolitano (37º BPM/M)",
        "37º Batalhão de Polícia Militar Metropolitano (37º BPM/M/ 1CIA)",
        "37º Batalhão de Polícia Militar Metropolitano (37º BPM/M/Força Tatica)",
        "15º Batalhão de Ações Especiais (15ºBaep)",
        "1º Companhia de Ações Especiais (1ºCaep)",
        "Comando de Aviação da Polícia Militar - “João Negrão”",
        "5º Batalhão de Polícia Rodoviária (5º BPRv)",
        "15° Grupamento de Bombeiro Militar (15° GBM)",
        "1º Batalhão de Polícia de Choque “Rondas Ostensivas Tobias de Aguiar”", // ROTA
        "2º Batalhão de Polícia de Choque “Anchieta”",
        "3º Batalhão de Polícia de Choque “Humaitá”",
        "4º Batalhão de Polícia de Choque “Operações Especiais”", // GATE? COE?
        "5º Batalhão de Polícia de Choque “Canil”",
        // Adicione outras divisões da PM aqui
        "Não definida", // Opção padrão
    ],
    PC: ["80ª Distrito de Policia Civil (80ªDP)", "Não definida"],
    GCM: ["Guarda Civil Municipal (GCM)", "Não definida"]
};


const ApprovalModal = ({ recruta, onClose, onConfirm }) => {
    const [divisao, setDivisao] = useState('');
    const [divisoesDisponiveis, setDivisoesDisponiveis] = useState([]);
    const [processing, setProcessing] = useState(false); // Estado de processamento

    // Define as divisões disponíveis com base na corporação do recruta
    useEffect(() => {
        if (recruta?.corporacao && divisoesPorCorporacao[recruta.corporacao]) {
            setDivisoesDisponiveis(divisoesPorCorporacao[recruta.corporacao]);
        } else {
            setDivisoesDisponiveis([]); // Limpa se não houver corporação ou lista
        }
        // Reseta a divisão selecionada quando o recruta muda
        setDivisao('');
        setProcessing(false); // Reseta processing
    }, [recruta]); // Depende apenas do recruta

    if (!recruta) return null;

    const handleConfirmClick = () => {
        if (!divisao) {
            alert('Por favor, selecione a divisão.');
            return;
        }
        setProcessing(true); // Ativa processamento
        // Chama onConfirm passando id e divisao. Corporação é definida no backend.
        onConfirm(recruta.id, divisao);
        // Não desativa processing aqui, AdminPage vai fechar o modal ou lidar com erro
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    {/* Mostra a corporação do recruta (que veio do token) */}
                    <h3>Aprovar Recruta ({recruta.corporacao || 'N/A'})</h3>
                    <button onClick={onClose} className="close-btn" disabled={processing}>&times;</button>
                </div>
                <div className="modal-body">
                    <p>
                        Aprovando <strong>{recruta.nome_completo}</strong> (Passaporte: {recruta.passaporte}).
                    </p>
                    <p>
                        Será definido como <strong>Soldado 2ª Classe</strong> na corporação <strong>{recruta.corporacao || 'N/A'}</strong>.
                    </p>
                    {/* Campo Corporação removido */}

                     {/* Campo Divisão (Agora usa as opções filtradas) */}
                     <div className="modal-form-group">
                        <label htmlFor="divisaoAprovar">Selecione a Divisão</label>
                        <select
                            id="divisaoAprovar"
                            value={divisao}
                            onChange={(e) => setDivisao(e.target.value)}
                            required
                            disabled={processing || divisoesDisponiveis.length === 0} // Desabilita se processando ou sem opções
                        >
                             <option value="" disabled>
                                 {divisoesDisponiveis.length > 0 ? 'Selecione...' : 'Nenhuma divisão encontrada para esta corporação'}
                             </option>
                             {/* Mapeia as divisões disponíveis */}
                             {divisoesDisponiveis.map(d => (<option key={d} value={d}>{d}</option>))}
                         </select>
                    </div>
                </div>
                <div className="modal-footer">
                    <button onClick={onClose} className="btn-secondary" disabled={processing}>Cancelar</button>
                    <button
                        onClick={handleConfirmClick}
                        className="btn-primary"
                        disabled={processing || !divisao} // Desabilita se processando ou sem divisão selecionada
                    >
                        {processing ? 'Aprovando...' : 'Confirmar Aprovação'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ApprovalModal;