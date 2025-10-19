import axios from "axios";

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
  timeout: 10000, // 10 seconds
});

// Request interceptor - Add auth token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log request in development
    if (import.meta.env.DEV) {
      console.log(
        `🔵 API Request: ${config.method.toUpperCase()} ${config.url}`,
        {
          data: config.data,
          params: config.params,
        }
      );
    }

    return config;
  },
  (error) => {
    console.error("❌ Request Error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor - Handle responses and errors
apiClient.interceptors.response.use(
  (response) => {
    // Log response in development
    if (import.meta.env.DEV) {
      console.log(
        `🟢 API Response: ${response.config.method.toUpperCase()} ${
          response.config.url
        }`,
        {
          status: response.status,
          data: response.data,
        }
      );
    }

    return response;
  },
  (error) => {
    // Log error in development
    if (import.meta.env.DEV) {
      console.error("🔴 API Error:", {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
        data: error.response?.data,
      });
    }

    // Handle specific error cases
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;

      switch (status) {
        case 401:
          // Unauthorized - token expired or invalid
          console.warn("⚠️ Unauthorized access - redirecting to login");
          localStorage.removeItem("token");
          localStorage.removeItem("user");

          // Only redirect if not already on auth pages
          if (
            !window.location.pathname.includes("/login") &&
            !window.location.pathname.includes("/register")
          ) {
            window.location.href = "/login";
          }
          break;

        case 403:
          // Forbidden - insufficient permissions
          console.warn("⚠️ Access forbidden");
          break;

        case 404:
          // Not found
          console.warn("⚠️ Resource not found");
          break;

        case 500:
          // Server error
          console.error("❌ Server error occurred");
          break;

        default:
          console.error(`❌ Error ${status}:`, data?.message);
      }

      // Return error with readable message
      return Promise.reject({
        status,
        message: data?.message || "An error occurred",
        data: data,
      });
    } else if (error.request) {
      // Request made but no response received
      console.error("❌ No response from server");
      return Promise.reject({
        message: "Unable to connect to server. Please check your connection.",
        error: error,
      });
    } else {
      // Something else happened
      console.error("❌ Request setup error:", error.message);
      return Promise.reject({
        message: error.message || "An unexpected error occurred",
        error: error,
      });
    }
  }
);

// Helper function to validate token
export const validateToken = async () => {
  try {
    const response = await apiClient.get("/api/users/validate-token");
    return response.data;
  } catch (error) {
    console.error("Token validation failed:", error);
    throw error;
  }
};

// Helper function to set auth token
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem("token", token);
    apiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    localStorage.removeItem("token");
    delete apiClient.defaults.headers.common["Authorization"];
  }
};

// Helper function to get auth token
export const getAuthToken = () => {
  return localStorage.getItem("token");
};

// Helper function to clear auth
export const clearAuth = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  delete apiClient.defaults.headers.common["Authorization"];
};

export default apiClient;
