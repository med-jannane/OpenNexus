import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const API_URL = 'http://localhost:8000/api';

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            fetchUser();
        } else {
            setLoading(false);
        }
    }, [token]);

    const fetchUser = async () => {
        try {
            const response = await axios.get(`${API_URL}/me`);
            setUser(response.data);
        } catch (error) {
            logout();
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        const response = await axios.post(`${API_URL}/login`, { email, password });
        const { access_token, user } = response.data;
        setToken(access_token);
        setUser(user);
        localStorage.setItem('token', access_token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
    };

    const signup = async (name, email, password, password_confirmation) => {
        const response = await axios.post(`${API_URL}/register`, {
            name,
            email,
            password,
            password_confirmation
        });
        const { access_token, user } = response.data;
        setToken(access_token);
        setUser(user);
        localStorage.setItem('token', access_token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
    };

    const logout = async () => {
        try {
            await axios.post(`${API_URL}/logout`);
        } catch (error) {
            // Ignore error
        } finally {
            setToken(null);
            setUser(null);
            localStorage.removeItem('token');
            delete axios.defaults.headers.common['Authorization'];
        }
    };

    return (
        <AuthContext.Provider value={{ user, token, login, signup, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
