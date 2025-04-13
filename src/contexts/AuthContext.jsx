import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

// Create API URL based on environment - ensure consistent formatting
const API_URL = process.env.REACT_APP_API_URL || 
                (process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5000/api');

// Create an axios instance with base URL for consistency
const api = axios.create({
  baseURL: API_URL
});

// Add request interceptor to inject token with every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 (Unauthorized) and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh the token
        const refreshed = await refreshTokenFunction();
        
        if (refreshed) {
          // If token refresh was successful, retry the original request
          originalRequest.headers.Authorization = `Bearer ${localStorage.getItem('token')}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// This will be set by the AuthProvider
let refreshTokenFunction = async () => false;

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userPreferences, setUserPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if token is expired by decoding JWT
  const isTokenExpired = (token) => {
    try {
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) return true;
      
      const payload = JSON.parse(atob(tokenParts[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      
      // Check if token has expired
      if (payload.exp && payload.exp < currentTime) {
        console.log('Token expired');
        return true;
      }
      return false;
    } catch (e) {
      console.error('Error checking token expiration:', e);
      return true; // If we can't check, better to assume expired
    }
  };

  // More reliable checkAuthStatus function
  const checkAuthStatus = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      // No token means not authenticated
      if (!token) {
        console.log('No token found in localStorage, user is not authenticated');
        setIsAuthenticated(false);
        setCurrentUser(null);
        setUserPreferences(null);
        setLoading(false);
        return;
      }
      
      // If we have both token and user data, consider user authenticated immediately
      if (userData) {
        try {
          const parsedUser = JSON.parse(userData);
          console.log('User data found in localStorage:', parsedUser);
          setCurrentUser(parsedUser);
          setIsAuthenticated(true);
          
          // IMPORTANT: Don't verify token here - consider user authenticated based on localStorage
          // This prevents logout on page refresh when server might be unreachable
        } catch (e) {
          console.error('Error parsing stored user data:', e);
          // If parsing fails, continue and try to validate token
        }
      }

      // Now do a background token validation without blocking authentication
      validateTokenInBackground(token);
    } catch (error) {
      console.error('Auth check error:', error);
      // DO NOT LOGOUT here - let the user stay logged in even if there's an error
    } finally {
      setLoading(false);
    }
  };

  // Add this new function to validate token in background
  const validateTokenInBackground = async (token) => {
    try {
      // First try the validation endpoint
      const response = await api.get('/users/validate-token');
      if (response.data && response.data.valid) {
        console.log('Token validated successfully in background');
        if (response.data.user) {
          updateUserData(response.data.user);
        }
      } 
    } catch (err) {
      // If validation endpoint doesn't exist, try another endpoint
      if (err.response?.status === 404) {
        try {
          const meResponse = await api.get('/users/me');
          if (meResponse.status === 200 && meResponse.data.user) {
            console.log('User data fetched successfully in background');
            updateUserData(meResponse.data.user);
          }
        } catch (innerErr) {
          // Only log the error, don't logout
          console.warn('Background validation failed:', innerErr.message);
        }
      } else {
        console.warn('Token validation failed in background:', err.message);
        // If it's a 401/403, quietly try to refresh the token
        if (err.response?.status === 401 || err.response?.status === 403) {
          refreshToken().catch(e => console.warn('Token refresh failed:', e.message));
        }
      }
    }
  };

  // Improved validateToken function for explicit validation
  const validateToken = async (token) => {
    try {
      // Try the token validation endpoint
      const response = await api.get('/users/validate-token');
      
      if (response.data && response.data.valid) {
        console.log('Token validated successfully');
        
        // If response includes user data, update it
        if (response.data.user) {
          updateUserData(response.data.user);
        }
        
        return true;
      } else {
        console.warn('Token validation failed');
        return false;
      }
    } catch (err) {
      // If 404, endpoint doesn't exist, try alternative approach
      if (err.response?.status === 404) {
        console.log('Validation endpoint not found, trying alternative check...');
        
        try {
          // Try a basic endpoint that requires authentication
          const checkResponse = await api.get('/users/me');
          
          if (checkResponse.status === 200) {
            console.log('Token verified via alternative endpoint');
            
            // If response includes user data, update it
            if (checkResponse.data.user) {
              updateUserData(checkResponse.data.user);
            }
            
            return true;
          }
          return false;
        } catch (altErr) {
          // Only treat 401/403 as authentication failures
          if (altErr.response?.status === 401 || altErr.response?.status === 403) {
            console.error('Authentication failed:', altErr.response?.status);
            return false;
          }
          
          // For other errors (like network issues), assume token is still valid
          // This prevents logout on temporary network problems
          console.warn('Network or server error during auth check, assuming still valid:', altErr);
          return true;
        }
      } else if (err.response?.status === 401 || err.response?.status === 403) {
        // Clear token invalid response
        console.error('Token invalid:', err.response?.status);
        return false;
      } else {
        // For network errors, assume token still valid to prevent logout
        console.warn('Error during token validation, assuming still valid:', err);
        return true;
      }
    }
  };

  // Fetch user data and preferences from the server
  const fetchUserData = async (token) => {
    try {
      const authToken = token || localStorage.getItem('token');
      if (!authToken) return;
      
      const response = await api.get('/users/me');
      
      if (response.data && response.data.user) {
        // Create a complete user data object that includes all fields
        const userData = {
          id: response.data.user._id,
          _id: response.data.user._id,
          fullName: response.data.user.fullName || response.data.user.name || 'User',
          email: response.data.user.email,
          role: response.data.user.role || 'user',
          hasMembership: response.data.user.hasMembership || false,
          phone: response.data.user.phone || '',  // Add phone field here
          // Keep all additional fields from the API response
          ...response.data.user
        };

        // Extract user preferences
        const preferences = {
          age: response.data.user.age,
          gender: response.data.user.gender,
          location: response.data.user.location,
          preferredLanguages: response.data.user.preferredLanguages || [],
          favoriteGenres: response.data.user.favoriteGenres || [],
          preferredBookFormat: response.data.user.preferredBookFormat,
          rentalPreferences: response.data.user.rentalPreferences || {
            booksPerMonth: 1,
            prefersTrending: false,
            openToRecommendations: true
          }
        };
        
        // Update localStorage with the latest user data
        localStorage.setItem('user', JSON.stringify(userData));
        
        setCurrentUser(userData);
        setUserPreferences(preferences);
        setIsAuthenticated(true);
      }
    } catch (err) {
      console.error("Failed to fetch user data:", err);
      // DON'T logout on authentication errors anymore
      // We want to preserve the authentication state from localStorage
      // regardless of server response
    }
  };

  // Update user data directly (useful after profile updates)
  const updateUserData = (userData) => {
    if (!userData) return;
    
    // Make sure we preserve all existing user properties
    const updatedUser = {
      ...currentUser,
      ...userData,
      fullName: userData.fullName || userData.name || currentUser?.fullName || 'User',
    };
    
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setCurrentUser(updatedUser);
  };

  // Improved refreshToken function
  const refreshToken = async () => {
    try {
      const currentToken = localStorage.getItem('token');
      if (!currentToken) {
        console.log('No token to refresh');
        return false;
      }
  
      // Try to refresh the token
      const response = await api.post('/users/refresh-token');
  
      if (response.data.token) {
        // Update token in localStorage
        localStorage.setItem('token', response.data.token);
        
        // Also update user data if provided
        if (response.data.user) {
          const updatedUser = {
            ...response.data.user,
            fullName: response.data.user.fullName || response.data.user.name || 'User'
          };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          setCurrentUser(updatedUser);
        }
        
        console.log('Token refreshed successfully');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error refreshing token:', error);
      
      // DON'T logout on errors - let the user stay logged in
      // We'll try again later or let the token expire naturally
      return false;
    }
  };

  // Set the refreshTokenFunction for the interceptor to use
  refreshTokenFunction = refreshToken;

  // Regular login
  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      console.log(`Sending login request to ${API_URL}/users/login`);
      
      const response = await api.post('/users/login', {
        email,
        password
      });

      if (response.data.token) {
        // Store token
        localStorage.setItem('token', response.data.token);
        
        // Store user data
        const userData = {
          ...response.data.user,
          fullName: response.data.user.fullName || response.data.user.name || 'User'
        };
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Set current user
        setCurrentUser(userData);
        setIsAuthenticated(true);
        
        // Fetch user preferences after login
        await fetchUserData(response.data.token);
        
        return { success: true, user: userData };
      }
    } catch (err) {
      console.error("Login error details:", err);
      const errorMessage = err.response?.data?.message || "Login failed";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Admin login
  const adminLogin = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      console.log(`Sending admin login request to ${API_URL}/admin/login`);
      
      // First, check if the endpoint exists by sending a test request
      try {
        await axios.options(`${API_URL}/admin/login`);
      } catch (optionsErr) {
        console.log("Admin endpoint check failed, trying alternative endpoint");
        
        // If the admin endpoint check fails, try the regular login endpoint
        const regularLoginResponse = await api.post('/users/login', {
          email,
          password
        });
        
        if (regularLoginResponse.data.token) {
          // Verify if the user is an admin
          const payload = JSON.parse(atob(regularLoginResponse.data.token.split('.')[1]));
          const isAdmin = payload.role === 'admin' || regularLoginResponse.data.user?.role === 'admin';
          
          if (!isAdmin) {
            throw new Error('User is not an admin');
          }
          
          // Create proper admin user object
          const userWithRole = {
            ...regularLoginResponse.data.user,
            role: 'admin',
            fullName: regularLoginResponse.data.user.fullName || regularLoginResponse.data.user.name || 'Admin'
          };
          
          // Store both token and user data
          localStorage.setItem('token', regularLoginResponse.data.token);
          localStorage.setItem('user', JSON.stringify(userWithRole));
          
          // Update state
          setCurrentUser(userWithRole);
          setIsAuthenticated(true);
          console.log("Admin login successful via regular endpoint:", userWithRole);
          
          return { success: true, user: userWithRole };
        }
      }
      
      // If the above didn't return, try the dedicated admin endpoint 
      const response = await api.post('/admin/login', {
        email,
        password
      });
      
      if (response.data.token) {
        // Create complete user object with role
        const userWithRole = {
          ...response.data.user,
          role: 'admin',
          fullName: response.data.user.fullName || response.data.user.name || 'Admin'
        };
        
        // Store both token and complete user data
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(userWithRole));
        
        // Update state
        setCurrentUser(userWithRole);
        setIsAuthenticated(true);
        console.log("Admin login successful via admin endpoint:", userWithRole);
        
        return { success: true, user: userWithRole };
      }
      
      throw new Error('Admin login failed - no token received');
    } catch (err) {
      console.error("Admin login error details:", err);
      const errorMessage = err.response?.data?.message || err.message || "Admin login failed";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Registration
  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post('/auth/signup', userData);
      
      return { success: true, message: response.data.message };
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Registration failed";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
    setUserPreferences(null);
    setIsAuthenticated(false);
    setError(null);
  };

  // Update user preferences
  const updatePreferences = async (preferencesData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.put('/users/preferences', preferencesData);
      
      if (response.data.user) {
        // Update local preferences state
        const updatedPreferences = {
          age: response.data.user.age,
          gender: response.data.user.gender,
          location: response.data.user.location,
          preferredLanguages: response.data.user.preferredLanguages || [],
          favoriteGenres: response.data.user.favoriteGenres || [],
          preferredBookFormat: response.data.user.preferredBookFormat,
          rentalPreferences: response.data.user.rentalPreferences || {
            booksPerMonth: 1,
            prefersTrending: false,
            openToRecommendations: true
          }
        };
        
        setUserPreferences(updatedPreferences);
        return { success: true, message: response.data.message };
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to update preferences";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Function to diagnose token issues
  const diagnoseTokenIssues = () => {
    try {
      // Check if token exists
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found in localStorage');
        return false;
      }
      
      // Log token format
      console.log('Token format check:');
      console.log('- Length:', token.length);
      console.log('- Starts with:', token.substring(0, 10) + '...');
      
      // Check token structure (should be in JWT format with 3 parts)
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.error('Invalid token format: not a valid JWT (should have 3 parts)');
        return false;
      }
      
      // Decode payload
      try {
        const payload = JSON.parse(atob(parts[1]));
        console.log('Decoded payload:', payload);
        
        // Check if payload has crucial fields
        if (!payload.userId && !payload.sub && !payload._id) {
          console.error('Token missing userId/sub/_id field');
        }
        
        // Check expiration
        if (payload.exp) {
          const now = Math.floor(Date.now() / 1000);
          const timeLeft = payload.exp - now;
          console.log(`Token expires in: ${timeLeft} seconds (${timeLeft / 60} minutes)`);
          
          if (timeLeft < 0) {
            console.error('Token is expired!');
            return false;
          }
        } else {
          console.warn('Token has no expiration!');
        }
        
        return true;
      } catch (e) {
        console.error('Failed to decode token payload:', e);
        return false;
      }
    } catch (e) {
      console.error('Token diagnosis error:', e);
      return false;
    }
  };

  // Function to get user email for autofilling forms
  const getUserEmail = () => {
    return currentUser?.email || '';
  };

  // Changed from property to function
  const isAdmin = () => {
    return currentUser?.role === 'admin';
  };

  // Initialize auth state and setup refresh timer
  useEffect(() => {
    console.log("Auth provider initialized");
    
    // CRITICAL: Immediately set authentication state from localStorage
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        setCurrentUser(JSON.parse(userData));
        setIsAuthenticated(true);
        console.log("User authenticated from localStorage immediately");
      } catch (e) {
        console.error("Error parsing user data from localStorage");
      }
    }
    
    // Then check auth status which will validate in the background
    checkAuthStatus();
    
    // Set up automatic token refresh
    const refreshInterval = setInterval(() => {
      if (localStorage.getItem('token')) {
        refreshToken().catch(e => console.warn('Scheduled token refresh failed:', e.message));
      }
    }, 15 * 60 * 1000); // Every 15 minutes
    
    return () => clearInterval(refreshInterval);
  }, []);

  const value = {
    currentUser,
    userPreferences,
    loading,
    error,
    isAuthenticated,
    login,
    adminLogin,
    register,
    logout,
    updatePreferences,
    fetchUserData,
    updateUserData,
    checkAuthStatus,
    getUserEmail,
    diagnoseTokenIssues,
    refreshToken,
    isAdmin,
    api // Export the API instance for use in components
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;