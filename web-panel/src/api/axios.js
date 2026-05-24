import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Her istekte otomatik olarak token'ı ekle
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token'); // Girişte kaydettiğin token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;