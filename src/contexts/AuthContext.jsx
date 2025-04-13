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

  // Initialize auth state from localStorage on component mount
  useEffect(() => {
    console.log("Auth provider initialized");
    console.log("localStorage token:", localStorage.getItem('token'));
    console.log("localStorage user:", localStorage.getItem('user'));
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      let storedUserData = localStorage.getItem('user');
      
      // If no token, user is not authenticated
      if (!token) {
        console.log('No token found in localStorage');
        setIsAuthenticated(false);
        setCurrentUser(null);
        setUserPreferences(null);
        setLoading(false);
        return;
      }

      // If we have stored user data, use it immediately
      if (storedUserData) {
        try {
          const storedUser = JSON.parse(storedUserData);
          console.log('Retrieved user from localStorage:', storedUser);
          setCurrentUser(storedUser);
          setIsAuthenticated(true);
        } catch (e) {
          console.error('Error parsing stored user data:', e);
          storedUserData = null;
        }
      }

      // Validate token by decoding JWT
      try {
        const tokenParts = token.split('.');
        if (tokenParts.length !== 3) {
          throw new Error('Invalid token format');
        }
        
        const payload = JSON.parse(atob(tokenParts[1]));
        const currentTime = Math.floor(Date.now() / 1000);
        
        // Check if token has expired
        if (payload.exp && payload.exp < currentTime) {
          console.log('Token expired');
          logout();
          return;
        }
        
        // If we don't have stored user data, create a user object from the token
        if (!storedUserData) {
          const userId = payload.userId || payload.id || payload.sub;
          const tempUser = {
            _id: userId,
            id: userId,
            email: payload.email,
            fullName: payload.name || payload.fullName || 'User',
            role: payload.role || 'user',
            hasMembership: payload.hasMembership || false,
            phone: payload.phone || ''
          };
          
          console.log('Created user from token payload:', tempUser);
          localStorage.setItem('user', JSON.stringify(tempUser));
          setCurrentUser(tempUser);
          setIsAuthenticated(true);
        }

        // Instead of using '/users/profile', validate the token
        // This uses the token validation endpoint, which should be implemented in your backend
        await validateToken(token);
      } catch (error) {
        console.error('Token parsing error:', error);
        logout();
      }
    } catch (error) {
      console.error('Auth check error:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  // Validate token with backend
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
        logout();
        return false;
      }
    } catch (err) {
      // If the validate-token endpoint doesn't exist, try an alternative approach
      // This is a fallback in case your API doesn't have a dedicated validation endpoint
      if (err.response?.status === 404) {
        console.log('Validation endpoint not found, trying alternative check...');
        
        try {
          // Try a basic endpoint that requires authentication
          // This could be any protected endpoint that exists in your API
          const checkResponse = await api.get('/users/me');
          
          if (checkResponse.status === 200) {
            console.log('Token verified via alternative endpoint');
            
            // If response includes user data, update it
            if (checkResponse.data.user) {
              updateUserData(checkResponse.data.user);
            }
            
            return true;
          }
        } catch (altErr) {
          console.error('Alternative token check failed:', altErr);
          logout();
          return false;
        }
      } else {
        console.error('Token validation error:', err);
        
        // If it's an auth error (401), logout silently
        if (err.response?.status === 401) {
          logout();
        }
        
        return false;
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
      if (err.response?.status === 401) {
        logout();
      }
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

  // Google login handler
  const handleGoogleLogin = async (credential) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post('/auth/google-signin', {
        credential
      });

      if (response.data.token) {
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
        
        // If the user is new and needs to complete their profile
        if (response.data.redirectToPreferences) {
          return { success: true, redirectToPreferences: true };
        }
        
        return { success: true };
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Google login failed";
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

  // Refresh token function
  const refreshToken = async () => {
    try {
      const currentToken = localStorage.getItem('token');
      if (!currentToken) {
        console.log('No token to refresh');
        return false;
      }
  
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
      return false;
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

  const value = {
    currentUser,
    userPreferences,
    loading,
    error,
    isAuthenticated,
    login,
    adminLogin,
    handleGoogleLogin,
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