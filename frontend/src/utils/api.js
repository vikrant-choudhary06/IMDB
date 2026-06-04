import axios from 'axios';

const DEFAULT_BACKEND_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:8000/api' : '/api');
const DEMO_API_KEY = 'demo_key_99f2b8';

const api = axios.create({
  baseURL: DEFAULT_BACKEND_URL,
});

// Request interceptor to attach the x-api-key header
api.interceptors.request.use((config) => {
  const customKey = localStorage.getItem('cineapi_developer_key');
  config.headers['x-api-key'] = customKey || DEMO_API_KEY;
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const setDeveloperKey = (key) => {
  if (key) {
    localStorage.setItem('cineapi_developer_key', key);
  } else {
    localStorage.removeItem('cineapi_developer_key');
  }
};

export const getDeveloperKey = () => {
  return localStorage.getItem('cineapi_developer_key') || '';
};

export const getEffectiveKey = () => {
  return localStorage.getItem('cineapi_developer_key') || DEMO_API_KEY;
};

export default api;
