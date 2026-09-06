import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const TOKEN_STORAGE_KEY = 'tutorflow_token';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Authenticated fetch helper
  const authFetch = useCallback(
    async (url, options = {}) => {
      const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
      const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      };

      const currentToken = token || localStorage.getItem(TOKEN_STORAGE_KEY);
      if (currentToken) {
        headers['Authorization'] = `Bearer ${currentToken}`;
      }

      return fetch(fullUrl, {
        ...options,
        headers
      });
    },
    [token]
  );

  // Verify and hydrate current user on mount / token change
  const verifySession = useCallback(async (tokenToVerify) => {
    if (!tokenToVerify) {
      setUser(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${tokenToVerify}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setAuthError(null);
      } else {
        // Token invalid or expired
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        setToken(null);
        setUser(null);
      }
    } catch (err) {
      console.error('Session verification error:', err);
      // Retain token in case of offline, but set error
      setAuthError('Could not verify session with server');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    verifySession(token);
  }, [verifySession, token]);

  // Login handler
  const login = async (email, password) => {
    setLoading(true);
    setAuthError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.message || data.error || 'Invalid email or password';
        setAuthError(errorMsg);
        setLoading(false);
        return { success: false, error: errorMsg };
      }

      // Success
      localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
      setToken(data.token);
      setUser(data.user);
      setLoading(false);
      return { success: true, user: data.user };
    } catch (err) {
      const errorMsg = err.message || 'Unable to connect to authentication server';
      setAuthError(errorMsg);
      setLoading(false);
      return { success: false, error: errorMsg };
    }
  };

  // Logout handler
  const logout = () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
    setUser(null);
    setAuthError(null);
  };

  const value = {
    user,
    token,
    loading,
    authError,
    isAuthenticated: !!user,
    isTutor: user?.role === 'tutor',
    isStudent: user?.role === 'student',
    login,
    logout,
    authFetch,
    setAuthError
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
