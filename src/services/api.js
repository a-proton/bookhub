// src/services/api.js
import axios from 'axios';

// In Vite, use import.meta.env instead of process.env
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create an axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
});

// Add request interceptor to inject token with every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 (Unauthorized) and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh the token
        const refreshToken = localStorage.getItem("refreshToken");
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/auth/refresh-token`, {
            refreshToken,
          });
          
          if (response.data && response.data.accessToken) {
            localStorage.setItem("token", response.data.accessToken);
            api.defaults.headers.common['Authorization'] = `Bearer ${response.data.accessToken}`;
            originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;
            return api(originalRequest);
          }
        }
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export const authService = {
  signup: (userData) => api.post(`/auth/signup`, userData),
  login: (credentials) => api.post(`/auth/login`, credentials),
  refreshToken: (refreshToken) => api.post(`/auth/refresh-token`, { refreshToken }),
  getProfile: () => api.get(`/auth/me`),
  updateProfile: (profileData) => api.put(`/auth/profile`, profileData),
};

export const userService = {
  signup: (userData) => api.post(`/users/signup`, userData),
  login: (credentials) => api.post(`/users/login`, credentials),
  getProfile: () => api.get(`/users/me`),
  updateProfile: (profileData) => api.put(`/users/profile`, profileData),
};

export const membershipService = {
  getPlans: () => api.get(`/memberships/plans`),
  applyForMembership: (applicationData) => api.post(`/memberships/apply`, applicationData)
};

// Export the api instance for direct use
export default api;