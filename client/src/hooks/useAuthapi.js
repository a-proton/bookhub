// hooks/useAuthApi.js
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/router"; // or your routing solution

export const useAuthApi = () => {
  const { api, currentUser, isAuthenticated, logout } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  // Enhanced API call wrapper with better error handling
  const apiCall = async (method, endpoint, data = null, options = {}) => {
    try {
      // Ensure user is authenticated
      if (!isAuthenticated || !currentUser) {
        throw new Error("Not authenticated");
      }

      // Prepare the request config
      const config = {
        method: method.toUpperCase(),
        url: endpoint,
        ...options,
      };

      // Add data for POST/PUT requests
      if (data && ["POST", "PUT", "PATCH"].includes(config.method)) {
        config.data = data;
      }

      // Make the API call
      const response = await api(config);
      return {
        success: true,
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      console.error(`API Error (${method.toUpperCase()} ${endpoint}):`, error);

      // Handle different error types
      if (error.response) {
        const { status, data } = error.response;

        // Handle authentication errors
        if (status === 401) {
          toast({
            title: "Session Expired",
            description: "Please log in again.",
            variant: "destructive",
          });

          // Auto logout and redirect
          setTimeout(() => {
            logout();
          }, 1000);

          return {
            success: false,
            error: "Authentication expired",
            status: 401,
            needsAuth: true,
          };
        }

        // Handle authorization errors
        if (status === 403) {
          toast({
            title: "Access Denied",
            description: "You don't have permission to perform this action.",
            variant: "destructive",
          });

          return {
            success: false,
            error: "Access denied",
            status: 403,
          };
        }

        // Handle other HTTP errors
        const errorMessage =
          data?.message || `Request failed with status ${status}`;

        return {
          success: false,
          error: errorMessage,
          status,
          data: data,
        };
      }

      // Handle network errors
      if (error.request) {
        const errorMessage = "Network error. Please check your connection.";
        toast({
          title: "Network Error",
          description: errorMessage,
          variant: "destructive",
        });

        return {
          success: false,
          error: errorMessage,
          isNetworkError: true,
        };
      }

      // Handle other errors
      const errorMessage = error.message || "An unexpected error occurred";
      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  // Convenience methods for different HTTP verbs
  const get = (endpoint, options = {}) =>
    apiCall("GET", endpoint, null, options);
  const post = (endpoint, data, options = {}) =>
    apiCall("POST", endpoint, data, options);
  const put = (endpoint, data, options = {}) =>
    apiCall("PUT", endpoint, data, options);
  const patch = (endpoint, data, options = {}) =>
    apiCall("PATCH", endpoint, data, options);
  const del = (endpoint, options = {}) =>
    apiCall("DELETE", endpoint, null, options);

  return {
    // API methods
    get,
    post,
    put,
    patch,
    delete: del,
    apiCall,

    // Auth info
    currentUser,
    isAuthenticated,
    isAdmin: currentUser?.role === "admin",

    // Raw API instance (for advanced usage)
    api,
  };
};
