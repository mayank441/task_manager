import axios from 'axios';

const API = axios.create({
  baseURL: 'https://task-manager-api-vdem.onrender.com/api',
});

export const getTasks = () => API.get('/tasks');
export const createTask = (data) => API.post('/tasks', data);
export const updateTask = (id, data) => API.put(`/tasks/${id}`, data);
export const toggleTask = (id) => API.put(`/tasks/${id}/toggle`);
export const deleteTask = (id) => API.delete(`/tasks/${id}`);