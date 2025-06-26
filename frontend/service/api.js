import axios from 'axios';
import { getToken, removeToken, isTokenExpired } from '../utils/auth.js';

// You can set the baseURL as needed
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
});

// Request interceptor to add JWT token to all requests
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token && !isTokenExpired(token)) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token is invalid or expired, remove it
      removeToken();
      // Redirect to login page if we're not already there
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;


