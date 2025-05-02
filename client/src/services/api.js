import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

// Server API
export const serverAPI = {
  getServers: () => api.get('/servers'),
  createServer: (data) => api.post('/servers', data),
  getChannels: (serverId) => api.get(`/servers/${serverId}/channels`),
  createChannel: (serverId, data) => api.post(`/servers/${serverId}/channels`, data),
};

// Message API
export const messageAPI = {
  getChannelMessages: (channelId) => api.get(`/messages/channels/${channelId}/messages`),
  createMessage: (data) => api.post('/messages', data),
  updateMessage: (messageId, data) => api.put(`/messages/${messageId}`, data),
  deleteMessage: (messageId) => api.delete(`/messages/${messageId}`),
};

// User API
export const userAPI = {
  searchUsers: (search) => api.get('/users', { params: { search } }),
};

// DM API
export const dmAPI = {
  getDMs: () => api.get('/dms'),
  createDM: (data) => api.post('/dms', data),
  getDMMessages: (dmId) => api.get(`/dms/${dmId}/messages`),
};

export default api;

