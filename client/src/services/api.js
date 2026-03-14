import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL
const TOKEN_KEY = 'fixbot_token'

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      console.error('Unauthorized access')
    }
    return Promise.reject(error)
  }
)

// API methods
const apiService = {
  TOKEN_KEY,

  // Analyze incident
  analyzeIncident: (data) => api.post('/api/incidents/analyze', data),

  // Get all incidents
  getIncidents: () => api.get('/api/incidents'),

  // Get single incident
  getIncident: (id) => api.get(`/api/incidents/${id}`),

  // Delete incident
  deleteIncident: (id) => api.delete(`/api/incidents/${id}`),

  // Clear all incidents for current user
  clearIncidents: () => api.delete('/api/incidents'),

  // Auth
  signup: (data) => api.post('/api/auth/signup', data),
  login: (data) => api.post('/api/auth/login', data),
  getProfile: () => api.get('/api/auth/me'),
}

export default apiService
