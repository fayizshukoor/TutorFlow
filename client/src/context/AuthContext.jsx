import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  API_BASE_URL,
  TOKEN_STORAGE_KEY,
  getStoredToken,
  setStoredToken,
  removeStoredToken,
  authApi,
  apiRequest
} from '../services/api';

const AuthContext = createContext(null);

export { API_BASE_URL, TOKEN_STORAGE_KEY };

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => getStoredToken());
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Authenticated fetch helper
  const authFetch = useCallback(
    async (url, options = {}) => {
      const currentToken = token || getStoredToken();
      return apiRequest(url, {
        ...options,
        token: currentToken
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
      const { ok, data } = await authApi.getMe(tokenToVerify);

      if (ok) {
        setUser(data.user);
        setAuthError(null);
      } else {
        // Token invalid or expired
        removeStoredToken();
        setToken(null);
        setUser(null);
      }
    } catch (err) {
      console.error('Session verification error:', err);
      // Retain token in case of network offline, but set error
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
      const { ok, data } = await authApi.login(email, password);

      if (!ok) {
        const errorMsg = data.message || data.error || 'Invalid email or password';
        setAuthError(errorMsg);
        setLoading(false);
        return { success: false, error: errorMsg };
      }

      // Success
      setStoredToken(data.token);
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
    removeStoredToken();
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
