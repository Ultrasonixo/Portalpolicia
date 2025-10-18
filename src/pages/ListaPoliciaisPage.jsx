import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import '../components/ListaPoliciaisPage.css'; // Ajuste o caminho se necessário

const ListaPoliciaisPage = () => {
    const { user, logout } = useAuth(); // Pegar usuário logado e logout
    const [policiais, setPoliciais] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filtroNome, setFiltroNome] = useState('');

    useEffect(() => {
        const fetchPoliciais = async () => {
            setLoading(true);
            setError(null);

            // <<< --- PEGAR TOKEN --- >>>
            const token = localStorage.getItem('authToken'); // Use a chave correta
            if (!token) {
                console.error("Lista Policiais Error: Token não encontrado.");
                setError('Erro de autenticação: Token não encontrado. Faça login novamente.');
                setLoading(false);
                // if(logout) logout(); // Opcional: Deslogar
                return;
            }
            const headers = { 'Authorization': `Bearer ${token}` }; // Cria os headers
            // <<< --- FIM PEGAR TOKEN --- >>>

            try {
                // <<< --- ADICIONAR HEADERS --- >>>
                const response = await fetch('http://localhost:3000/api/policia/policiais', { headers }); // Envia os headers
                // <<< --- FIM ADICIONAR HEADERS --- >>>

                // Verifica token inválido/expirado
                if (response.status === 401 || response.status === 403) {
                     console.error("Lista Policiais Error: Token inválido ou expirado (401/403).");
                     localStorage.removeItem('authToken');
                     if (logout) logout();
                     setError('Sua sessão expirou ou é inválida. Faça login novamente.');
                     setLoading(false);
                     return;
                 }


                if (!response.ok) {
                     const errData = await response.json().catch(() => ({ message: `Erro ${response.status}` }));
                    throw new Error(errData.message || 'Falha ao carregar a lista de policiais.');
                }
                const data = await response.json();
                setPoliciais(data);
            } catch (err) {
                 console.error("Erro ao buscar policiais:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        // Roda apenas se user estiver definido
         if (user) {
             fetchPoliciais();
        } else if (user === null) {
             setError("Usuário não autenticado.");
             setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]); // Depende do usuário logado

    const policiaisFiltrados = policiais.filter(p =>
        p.nome_completo.toLowerCase().includes(filtroNome.toLowerCase())
    );

    return (
        <div className="page-container">
            <h1 className="page-title">Corpo Policial ({user?.corporacao || 'N/A'})</h1>
            <p className="page-subtitle">
                Lista de oficiais ativos na sua corporação.
            </p>

             <div className="search-container" style={{maxWidth: '400px', marginBottom: '25px'}}>
                 <i className="fas fa-search search-icon"></i>
                 <input
                     type="text"
                     placeholder="Filtrar por nome..."
                     className="search-input"
                     value={filtroNome}
                     onChange={(e) => setFiltroNome(e.target.value)}
                     style={{ borderRadius: '8px' }}
                 />
             </div>

            {loading && <p style={{textAlign: 'center'}}>Carregando lista de policiais...</p>}
            {error && <p className="error-message" style={{textAlign: 'center'}}>{error}</p>}

            {!loading && !error && (
                <div className="policiais-grid">
                    {policiaisFiltrados.length > 0 ? (
                         policiaisFiltrados.map(policial => (
                            <Link to={`/policia/perfil/${policial.id}`} key={policial.id} className="policial-card-link">
                                <div className="policial-card">
                                    <div className="policial-avatar">
                                        <i className="fas fa-user-shield"></i>
                                    </div>
                                    <div className="policial-info">
                                        <h3 className="policial-nome">{policial.nome_completo}</h3>
                                        <p className="policial-patente">{policial.patente || 'Não definida'} ({policial.corporacao || 'N/A'})</p>
                                        <p className="policial-guarnicao">{policial.divisao || 'Sem divisão'}</p>
                                    </div>
                                </div>
                            </Link>
                        ))
                    ) : (
                        <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#64748b'}}>Nenhum policial encontrado.</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default ListaPoliciaisPage;