import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

function ProtectedRoute({ children, requiredType }) {
    const { user } = useAuth();
    const location = useLocation();

    if (!user) {
        const redirectTo = requiredType === 'policial' ? '/loginPolicial' : '/login';
        return <Navigate to={redirectTo} state={{ from: location }} replace />;
    }

    if (requiredType && user.type !== requiredType) {
        return <Navigate to="/" replace />;
    }

    return children;
}

export default ProtectedRoute;