// lib/api.js
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// ✅ Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ✅ Add token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('bms-token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // ✅ Remove Content-Type for FormData requests (browser will set it automatically with boundary)
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('bms-token');
      localStorage.removeItem('bms-user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ✅ Auth APIs
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

// ✅ Building APIs
export const buildingAPI = {
  getAll: () => api.get('/buildings'),
  getById: (id) => api.get(`/buildings/${id}`),
  create: (data) => api.post('/buildings', data),
  update: (id, data) => api.put(`/buildings/${id}`, data),
  delete: (id) => api.delete(`/buildings/${id}`),

  // ✅ Room APIs with FormData support
  addRoom: (buildingId, formData) => {
    return api.post(`/buildings/${buildingId}/rooms`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  updateRoom: (buildingId, roomId, formData) => {
    return api.put(`/buildings/${buildingId}/rooms/${roomId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  deleteRoom: (buildingId, roomId) =>
    api.delete(`/buildings/${buildingId}/rooms/${roomId}`),
};

// ✅ Employee APIs
export const employeeAPI = {
  getAll: () => api.get('/employees'),
  getById: (id) => api.get(`/employees/${id}`),
  create: (data) => api.post('/employees', data),
  update: (id, data) => api.put(`/employees/${id}`, data),
  delete: (id) => api.delete(`/employees/${id}`),
  markAttendance: (id, data) => api.post(`/employees/${id}/attendance`, data),
  addTask: (id, data) => api.post(`/employees/${id}/tasks`, data),
  updateTask: (id, taskId, data) => api.put(`/employees/${id}/tasks/${taskId}`, data),
  paySalary: (id, data) => api.post(`/employees/${id}/salary`, data),
};

// ✅ Lead APIs
export const leadAPI = {
  getAll: () => api.get('/leads'),
  getById: (id) => api.get(`/leads/${id}`),
  getByEmployee: (employeeId) => api.get(`/leads/employee/${employeeId}`),
  create: (data) => api.post('/leads', data),
  update: (id, data) => api.put(`/leads/${id}`, data),
  addNote: (id, data) => api.post(`/leads/${id}/notes`, data),
  delete: (id) => api.delete(`/leads/${id}`),
};

// ✅ Revenue APIs
export const revenueAPI = {
  get: () => api.get('/revenue'),
  getTransactions: () => api.get('/revenue/transactions'),
  toggleSecurities: () => api.put('/revenue/toggle-securities'),
  addIncome: (data) => api.post('/revenue/income', data),
  addExpense: (data) => api.post('/revenue/expense', data),
  addSecurity: (data) => api.post('/revenue/security', data),
  settleSecurity: (data) => api.post('/revenue/security/settle', data),
};

// ✅ Customer APIs
export const customerAPI = {
  getAll: (params) => api.get('/customers', { params }),
  getById: (id) => api.get(`/customers/${id}`),
  getByUnit: (unitId) => api.get(`/customers/unit/${unitId}`),
  getByStatus: (status) => api.get(`/customers/status/${status}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
  addRentPayment: (id, data) => api.post(`/customers/${id}/rent-payment`, data),
  addSecurityTransaction: (id, data) => api.post(`/customers/${id}/security-transaction`, data),
  addDocument: (id, data) => api.post(`/customers/${id}/documents`, data),
  updateDocument: (id, docId, data) => api.put(`/customers/${id}/documents/${docId}`, data),
  deleteDocument: (id, docId) => api.delete(`/customers/${id}/documents/${docId}`),
  addNote: (id, data) => api.post(`/customers/${id}/notes`, data),
};

// ✅ User APIs
export const userAPI = {
  getAll: () => api.get('/auth/users'),
  getById: (id) => api.get(`/auth/users/${id}`),
  create: (data) => api.post('/auth/register', data),
  update: (id, data) => api.put(`/auth/users/${id}`, data),
  delete: (id) => api.delete(`/auth/users/${id}`),
};

// ✅ Dashboard APIs
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getRevenueChart: () => api.get('/dashboard/revenue-chart'),
  getRecentLeads: () => api.get('/dashboard/recent-leads'),
};

// ✅ Reports APIs
export const reportsAPI = {
  getProfitLoss: (params) => api.get('/reports/profit-loss', { params }),
  getGeneral: (params) => api.get('/reports/general', { params }),
  getEmployeePerformance: (params) => api.get('/reports/employee-performance', { params }),
  exportAll: (data) => api.post('/reports/export-all', data),
};

// ✅ Settings APIs
export const settingsAPI = {
  get: () => api.get('/settings'),
  update: (data) => api.put('/settings', data),
  reset: () => api.post('/settings/reset'),
};

export default api;