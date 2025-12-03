import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
    const { token, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading && !token) {
            navigate('/');
        }
    }, [token, loading, navigate]);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!token) {
        return null; // Don't render anything while redirecting
    }

    return children;
}
