import { createContext, useState, useEffect, useContext } from "react";
import axios from "axios";

// AXIOS INSTANCE with proper token handling
export const api = axios.create({
  baseURL: "/api",
});
const VITE_API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";
// Create the context
const AuthContext = createContext(null);

// Custom hook to easily access the context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// The main provider component that will wrap the application
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Helper function to get the active token
  const getActiveToken = () => {
    return (
      localStorage.getItem("adminToken") ||
      localStorage.getItem("authToken") ||
      localStorage.getItem("token")
    );
  };

  // Helper function to get active user data
  const getActiveUser = () => {
    const adminUser = localStorage.getItem("adminUser");
    const regularUser = localStorage.getItem("user");

    if (adminUser) {
      try {
        return JSON.parse(adminUser);
      } catch (e) {
        console.error("Failed to parse admin user data:", e);
      }
    }

    if (regularUser) {
      try {
        return JSON.parse(regularUser);
      } catch (e) {
        console.error("Failed to parse user data:", e);
      }
    }

    return null;
  };

  // Initialize auth on app start
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const token = getActiveToken();
      const userData = getActiveUser();

      console.log("Initializing auth with:", {
        hasToken: !!token,
        hasUserData: !!userData,
        userRole: userData?.role,
      });

      if (token && userData) {
        // Set the initial state FIRST
        setIsAuthenticated(true);
        setCurrentUser(userData);

        // For admin users, skip token validation initially
        // since the admin endpoint might be different
        if (userData.role === "admin") {
          console.log("Admin user detected, using stored data");
          setLoading(false);
          return;
        }

        // Then try to validate the token with the server for regular users
        try {
          const response = await api.get(
            `${VITE_API_BASE_URL}/users/validate-token`
          );

          if (response.data && response.data.user) {
            const validatedUser = response.data.user;
            console.log("Token validated successfully:", validatedUser);

            // Update with server-validated data
            setCurrentUser(validatedUser);
            localStorage.setItem("user", JSON.stringify(validatedUser));
          }
        } catch (validationError) {
          console.warn(
            "Token validation failed:",
            validationError.response?.status,
            validationError.message
          );

          // If token is invalid (401), clear auth data for regular users
          if (
            validationError.response?.status === 401 &&
            userData.role !== "admin"
          ) {
            clearAuthData();
          }
          // For admin users or other errors, keep using stored data
        }
      } else {
        console.log("No stored authentication data found");
        setIsAuthenticated(false);
        setCurrentUser(null);
      }
    } catch (error) {
      console.error("Error during auth initialization:", error);
      clearAuthData();
    } finally {
      setLoading(false);
    }
  };

  // Helper function to clear all auth data
  const clearAuthData = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("authToken");
    localStorage.removeItem("adminToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    localStorage.removeItem("adminUser");
    setIsAuthenticated(false);
    setCurrentUser(null);

    // Remove authorization header
    delete api.defaults.headers.common["Authorization"];
  };

  // REGULAR LOGIN FUNCTION
  const login = async (email, password) => {
    try {
      console.log("Attempting regular user login:", email);

      const response = await api.post("/auth/login", { email, password });
      const { token, refreshToken, user } = response.data;

      // Clear any existing admin data
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminUser");

      // Store tokens and user data
      localStorage.setItem("token", token);
      localStorage.setItem("authToken", token);
      if (refreshToken) {
        localStorage.setItem("refreshToken", refreshToken);
      }
      localStorage.setItem("user", JSON.stringify(user));

      // Set authorization header
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      // Update state
      setIsAuthenticated(true);
      setCurrentUser(user);

      console.log("Regular login successful:", user);
      return { success: true, user };
    } catch (error) {
      console.error("Login failed:", error);
      return {
        success: false,
        error:
          error.response?.data?.message || "Login failed. Please try again.",
      };
    }
  };

  // ADMIN LOGIN FUNCTION - IMPROVED
  const adminLogin = async (email, password) => {
    try {
      console.log("Attempting admin login with:", { email });

      clearAuthData();

      const response = await api.post("/admin/login", {
        email,
        password,
      });

      console.log("Admin login response:", response.data);

      if (response.data && response.data.token) {
        const { token, user, message } = response.data;

        // Store admin-specific token
        localStorage.setItem("adminToken", token);
        localStorage.setItem("authToken", token); // For compatibility

        // Set authorization header immediately
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

        // Create comprehensive admin user object
        const adminUser = {
          id: user.id || user._id || "admin",
          email: user.email || email,
          role: "admin",
          fullName: user.fullName || user.name || "Administrator",
          ...user,
        };

        localStorage.setItem("adminUser", JSON.stringify(adminUser));
        localStorage.setItem("user", JSON.stringify(adminUser));

        // Update state immediately
        setCurrentUser(adminUser);
        setIsAuthenticated(true);

        console.log("Admin login successful, state updated:", adminUser);
        return { success: true, user: adminUser, message };
      } else {
        throw new Error(response.data.message || "Admin login failed");
      }
    } catch (error) {
      console.error("Admin login error:", error);

      let errorMessage = "Admin login failed";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        message: errorMessage,
      };
    }
  };

  // CHECK AUTH STATUS - IMPROVED
  const checkAuthStatus = async () => {
    try {
      const token = getActiveToken();
      const userData = getActiveUser();

      if (!token || !userData) {
        setIsAuthenticated(false);
        setCurrentUser(null);
        return false;
      }

      // For admin users, use a different validation approach
      if (userData.role === "admin") {
        // Try to make a simple admin API call to verify token
        try {
          const response = await api.get("/admin/dashboard-stats");
          // If successful, admin token is valid
          setIsAuthenticated(true);
          setCurrentUser(userData);
          return true;
        } catch (error) {
          if (error.response?.status === 401) {
            console.log("Admin token expired");
            clearAuthData();
            return false;
          }
          // For other errors, assume token is still valid
          setIsAuthenticated(true);
          setCurrentUser(userData);
          return true;
        }
      }

      // For regular users, use the standard validation endpoint
      const response = await api.get("/users/validate-token");

      if (response.data && response.data.user) {
        const user = response.data.user;
        setIsAuthenticated(true);
        setCurrentUser(user);
        localStorage.setItem("user", JSON.stringify(user));
        return true;
      } else {
        clearAuthData();
        return false;
      }
    } catch (error) {
      console.error("Auth status check failed:", error);
      if (error.response?.status === 401) {
        clearAuthData();
      }
      return false;
    }
  };

  // UPDATE USER
  const updateUser = (userData) => {
    const updatedUser = { ...currentUser, ...userData };
    setCurrentUser(updatedUser);
    setIsAuthenticated(true);
    localStorage.setItem("user", JSON.stringify(updatedUser));

    if (updatedUser.role === "admin") {
      localStorage.setItem("adminUser", JSON.stringify(updatedUser));
    }
  };

  // LOGOUT FUNCTION - IMPROVED
  const logout = () => {
    console.log("Logging out user...", currentUser?.role);

    const wasAdmin = currentUser?.role === "admin";

    // Clear all auth-related data
    clearAuthData();

    // Redirect based on user type
    if (wasAdmin) {
      window.location.href = "/admin/login";
    } else {
      window.location.href = "/login";
    }
  };

  // REGISTER FUNCTION
  const register = async (userData) => {
    try {
      console.log("Attempting user registration:", userData.email);
      const response = await api.post("/auth/signup", userData);
      console.log("Registration successful");
      return { success: true, message: "Registration successful" };
    } catch (error) {
      console.error("Registration failed:", error);
      return {
        success: false,
        error:
          error.response?.data?.message ||
          "Registration failed. Please try again.",
      };
    }
  };

  // REFRESH USER DATA - IMPROVED
  const refreshUserData = async () => {
    if (!isAuthenticated) return;

    try {
      const token = getActiveToken();
      const userData = getActiveUser();

      if (!token) {
        console.error("No token available for refresh");
        return;
      }

      // For admin users, skip refresh or use admin-specific endpoint
      if (userData?.role === "admin") {
        console.log("Admin user - skipping refresh");
        return;
      }

      const response = await api.get("/users/validate-token");

      if (response.data && response.data.user) {
        const user = response.data.user;
        localStorage.setItem("user", JSON.stringify(user));
        setCurrentUser(user);
        console.log("User data refreshed:", user);
      }
    } catch (error) {
      console.error("Could not refresh user data:", error);

      if (error.response?.status === 401) {
        logout();
      }
    }
  };

  // HELPER FUNCTIONS - FIXED: Return functions, not boolean values
  const isAdmin = () => {
    return currentUser?.role === "admin";
  };

  const isRegularUser = () => {
    return currentUser?.role === "user" || (currentUser && !currentUser.role);
  };

  const getToken = () => {
    return getActiveToken();
  };

  // CONTEXT VALUE
  const value = {
    // User data
    currentUser,
    user: currentUser,

    // Auth state
    isAuthenticated,
    loading,

    // Auth functions
    login,
    adminLogin,
    logout,
    register,

    // Utility functions
    refreshUserData,
    updateUser,
    checkAuthStatus,

    // Helper functions - FIXED: Pass functions, not function calls
    isAdmin, // Function reference, not isAdmin()
    isRegularUser, // Function reference, not isRegularUser()
    getToken,

    // API instance
    api,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// AXIOS INTERCEPTORS - IMPROVED
api.interceptors.request.use(
  (config) => {
    const token = getActiveToken();

    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
      console.log(
        `Setting Authorization header for ${config.url}:`,
        `Bearer ${token.substring(0, 20)}...`
      );
    } else {
      console.warn(`No token found for request to ${config.url}`);
    }

    // Helper function to get token (defined here for interceptor access)
    function getActiveToken() {
      return (
        localStorage.getItem("adminToken") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("token")
      );
    }

    if (process.env.NODE_ENV === "development") {
      console.log(
        `API Request: ${config.method?.toUpperCase()} ${config.url}`,
        {
          hasToken: !!token,
          fullURL: config.baseURL + config.url,
        }
      );
    }

    return config;
  },
  (error) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === "development") {
      console.log(
        `API Response Success: ${response.config.method?.toUpperCase()} ${
          response.config.url
        }`,
        {
          status: response.status,
          success: true,
        }
      );
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    console.error(
      `API Error: ${originalRequest?.method?.toUpperCase()} ${
        originalRequest?.url
      }`,
      {
        status: error.response?.status,
        message: error.response?.data?.message,
        fullURL: originalRequest?.baseURL + originalRequest?.url,
      }
    );

    // Handle 401 errors more carefully
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      console.log("401 Unauthorized - handling token refresh/redirect");

      // Get current user data to determine type
      const userData = JSON.parse(
        localStorage.getItem("adminUser") ||
          localStorage.getItem("user") ||
          "null"
      );

      // For admin routes or admin users, clear everything and redirect to admin login
      if (
        originalRequest.url?.includes("/admin/") ||
        userData?.role === "admin"
      ) {
        console.log(
          "Admin authentication failed, clearing auth and redirecting..."
        );
        localStorage.clear();
        delete api.defaults.headers.common["Authorization"];

        // Avoid infinite redirects
        if (!window.location.pathname.includes("/admin/login")) {
          window.location.href = "/admin/login";
        }
        return Promise.reject(error);
      }

      // For regular users, try refresh token
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        console.log("No refresh token available, redirecting to login...");
        localStorage.clear();
        delete api.defaults.headers.common["Authorization"];
        window.location.href = "/login";
        return Promise.reject(error);
      }

      try {
        console.log("Attempting to refresh token...");
        const response = await axios.post("/api/auth/refresh-token", {
          refreshToken,
        });

        const { accessToken } = response.data;

        if (accessToken) {
          localStorage.setItem("token", accessToken);
          localStorage.setItem("authToken", accessToken);
          originalRequest.headers["Authorization"] = `Bearer ${accessToken}`;
          api.defaults.headers.common[
            "Authorization"
          ] = `Bearer ${accessToken}`;

          console.log("Token refreshed successfully, retrying request...");
          return api(originalRequest);
        } else {
          throw new Error("No access token in refresh response");
        }
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        localStorage.clear();
        delete api.defaults.headers.common["Authorization"];
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default AuthContext;
