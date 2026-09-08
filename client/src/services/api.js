/**
 * Reusable API Service for TutorFlow
 * Centralizes endpoint URLs and HTTP request helpers while preserving token handling.
 */

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const TOKEN_STORAGE_KEY = 'tutorflow_token';

export function getStoredToken() {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setStoredToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

export function removeStoredToken() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

/**
 * Core HTTP fetch wrapper with JWT attachment
 */
export async function apiRequest(endpoint, options = {}) {
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const token = options.token || getStoredToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const fetchOptions = {
    ...options,
    headers
  };

  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    fetchOptions.body = JSON.stringify(options.body);
  }

  return fetch(url, fetchOptions);
}

/**
 * Authentication API Service
 */
export const authApi = {
  login: async (email, password) => {
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email, password }
    });
    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
  },

  getMe: async (token) => {
    const res = await apiRequest('/auth/me', {
      method: 'GET',
      token
    });
    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
  },

  testAuth: async () => {
    return apiRequest('/auth/test');
  },

  testTutorAuth: async () => {
    return apiRequest('/auth/tutor-test');
  },

  testStudentAuth: async () => {
    return apiRequest('/auth/student-test');
  }
};

/**
 * Student Management API Service
 */
export const studentApi = {
  getAll: async () => {
    const res = await apiRequest('/students');
    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
  },

  getById: async (id) => {
    const res = await apiRequest(`/students/${id}`);
    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
  },

  create: async (studentData) => {
    const res = await apiRequest('/students', {
      method: 'POST',
      body: studentData
    });
    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
  },

  update: async (id, studentData) => {
    const res = await apiRequest(`/students/${id}`, {
      method: 'PUT',
      body: studentData
    });
    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
  },

  getMyProfile: async () => {
    const res = await apiRequest('/students/profile/me');
    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
  }
};

export default {
  apiRequest,
  authApi,
  studentApi,
  getStoredToken,
  setStoredToken,
  removeStoredToken
};
