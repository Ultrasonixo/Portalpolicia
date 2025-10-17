// src/context/AuthContext.jsx

import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const storedUser = localStorage.getItem('user_session');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const login = (userData, userType) => {
        // AQUI ESTÁ A MUDANÇA: Adicionamos a propriedade 'type' ao objeto do usuário
        const sessionData = { ...userData, type: userType };
        localStorage.setItem('user_session', JSON.stringify(sessionData));
        setUser(sessionData);
    };

    const logout = () => {
        localStorage.removeItem('user_session');
        setUser(null);
        navigate('/');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};