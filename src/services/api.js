// src/services/api.js
import axios from 'axios';

// In Vite, use import.meta.env instead of process.env
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const userService = {
  signup: (userData) => axios.post(`${API_URL}/users/signup`, userData),
  login: (credentials) => axios.post(`${API_URL}/users/login`, credentials)
};

export const membershipService = {
  getPlans: () => axios.get(`${API_URL}/memberships/plans`),
  applyForMembership: (applicationData) => axios.post(`${API_URL}/memberships/apply`, applicationData)
};