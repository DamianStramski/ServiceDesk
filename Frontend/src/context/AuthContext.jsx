import { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    const parseJwt = (token) => {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
        } catch {
            return null;
        }
    };

    useEffect(() => {
        const storedToken = sessionStorage.getItem('token');
        if (storedToken) {
            setToken(storedToken);
            const decoded = parseJwt(storedToken);
            if (decoded) {
                const role = decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || 'User';
                const username = decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || decoded.unique_name || 'User';
                setUser({ username, role });
            }
        }
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        try {
            const response = await axios.post('http://localhost:5054/api/Users/login', { username, password });
            const newToken = typeof response.data === 'string' ? response.data : response.data.token;

            if (!newToken) throw new Error("No token received");

            sessionStorage.setItem('token', newToken);
            setToken(newToken);

            const decoded = parseJwt(newToken);
            const role = decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || 'User';

            setUser({ username, role });
            return true;
        } catch (error) {
            console.error("Login failed", error);
            return false;
        }
    };

    const register = async (username, password) => {
        try {
            await axios.post('http://localhost:5054/api/Users/register', { username, password });
            return { success: true };
        } catch (error) {
            console.error("Registration failed", error);
            let errorMessage = "Rejestracja nie powiodła się";
            if (error.response) {
                if (typeof error.response.data === 'string') {
                    errorMessage = error.response.data;
                } else if (error.response.data?.title) {
                    errorMessage = error.response.data.title;
                    if (error.response.data.errors) {
                        const validationErrors = Object.values(error.response.data.errors).flat().join(', ');
                        if (validationErrors) errorMessage += `: ${validationErrors}`;
                    }
                }
            } else if (error.message) {
                errorMessage = error.message;
            }
            return { success: false, message: errorMessage };
        }
    };

    const logout = () => {
        sessionStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
