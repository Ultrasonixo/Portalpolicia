import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

function ProtectedRoute({ children }) {
    const { user } = useAuth();
    const location = useLocation();

    if (!user) {
        // Se o usuário não estiver logado, redireciona para a página de login
        // O 'state' guarda a página que ele tentou acessar para redirecioná-lo de volta após o login
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children; // Se estiver logado, renderiza a página solicitada
}

export default ProtectedRoute;