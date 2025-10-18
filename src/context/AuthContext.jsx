import React, { createContext, useState, useContext, useEffect, useCallback } from 'react'; // Import useCallback
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    // Iniciar como undefined para diferenciar de null (não logado) vs. ainda não carregado
    const [user, setUser] = useState(undefined);
    const navigate = useNavigate();

    // Carrega o usuário do localStorage uma vez ao montar
    useEffect(() => {
        console.log("AuthProvider Effect: Tentando carregar user_session...");
        const storedUser = localStorage.getItem('user_session');
        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);
                console.log("AuthProvider Effect: User carregado do localStorage:", parsedUser);
            } catch (e) {
                console.error("AuthProvider Effect: Erro ao parsear user_session, limpando.", e);
                localStorage.removeItem('user_session');
                localStorage.removeItem('authToken'); // Limpa token também por segurança
                setUser(null); // Define como não logado
            }
        } else {
             console.log("AuthProvider Effect: Nenhum user_session encontrado.");
            setUser(null); // Define como não logado se não houver sessão
        }
    }, []); // Array vazio, executa apenas uma vez

    // Função Login (memoizada com useCallback)
    const login = useCallback((userData, userType) => {
        // Assume que userData JÁ CONTÉM o token se for policial
        const sessionData = {
            ...userData, // Inclui id, nome, token (se passado), etc.
            type: userType,
            corporacao: userType === 'policial' ? userData.corporacao : null,
            divisao: userType === 'policial' ? userData.divisao : null,
        };

        // Salva o token separadamente se existir (chave consistente 'authToken')
        if (userData.token) {
            localStorage.setItem('authToken', userData.token);
            console.log("AuthContext Login: Token salvo/atualizado:", userData.token);
            // Remove o token do objeto principal antes de salvar na sessão,
            // para não duplicar e para clareza.
            delete sessionData.token;
        }

        localStorage.setItem('user_session', JSON.stringify(sessionData));
        setUser(sessionData);
        console.log("AuthContext Login: User definido:", sessionData);
    }, []); // Sem dependências, função estável

    // Função Logout (memoizada com useCallback)
    const logout = useCallback(() => {
        console.log("AuthContext Logout: Executando logout...");
        localStorage.removeItem('user_session');
        localStorage.removeItem('authToken'); // Remove ambos
        setUser(null); // Define user como não logado
        navigate('/'); // Redireciona para home
    }, [navigate]); // Depende apenas de navigate (que é estável)

    // Memoiza o valor do contexto para evitar re-renderizações desnecessárias dos consumidores
    const contextValue = React.useMemo(() => ({
        user,
        login,
        logout
    }), [user, login, logout]); // Recria o valor apenas se user, login ou logout mudarem

    // Exibe "Carregando..." enquanto o estado inicial `undefined` não foi resolvido
    if (user === undefined) {
        // Pode retornar um spinner global aqui se preferir
        return <div>Carregando sessão...</div>;
    }


    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

// Hook customizado (inalterado)
export const useAuth = () => {
    return useContext(AuthContext);
};