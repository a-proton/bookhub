import { api } from "../contexts/AuthContext";

// Admin Service Functions
export const adminService = {
  // Dashboard Stats
  async fetchDashboardStats() {
    try {
      console.log("Fetching dashboard stats...");

      // Check if we have admin token
      const adminToken = localStorage.getItem("adminToken");
      if (!adminToken) {
        throw new Error("Admin authentication required");
      }

      const response = await api.get("/admin/dashboard-stats");

      if (response.data) {
        console.log("Dashboard stats received:", response.data);
        return {
          totalBooks: response.data.totalBooks || 0,
          activeMembers: response.data.activeMembers || 0,
          pendingApplications: response.data.pendingApplications || 0,
          membershipPlans: response.data.membershipPlans || 0,
          ...response.data,
        };
      }

      // Return default stats if no data
      return {
        totalBooks: 0,
        activeMembers: 0,
        pendingApplications: 0,
        membershipPlans: 0,
      };
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);

      // Handle different error types
      if (error.response?.status === 401) {
        throw new Error("Admin session expired. Please log in again.");
      } else if (error.response?.status === 403) {
        throw new Error("Access denied. Admin privileges required.");
      } else if (error.response?.status === 404) {
        // If endpoint doesn't exist, return mock data
        console.warn("Dashboard stats endpoint not found, returning mock data");
        return {
          totalBooks: 0,
          activeMembers: 0,
          pendingApplications: 0,
          membershipPlans: 0,
        };
      } else if (!navigator.onLine) {
        throw new Error("No internet connection. Please check your network.");
      } else {
        throw new Error(
          error.response?.data?.message || "Failed to load dashboard data"
        );
      }
    }
  },

  // Validate Admin Token
  async validateAdminToken() {
    try {
      const adminToken = localStorage.getItem("adminToken");
      if (!adminToken) {
        return { valid: false, error: "No admin token found" };
      }

      // Try a simple admin endpoint to validate token
      const response = await api.get("/admin/validate");

      return {
        valid: true,
        user: response.data.user,
      };
    } catch (error) {
      console.error("Admin token validation failed:", error);

      if (error.response?.status === 401) {
        return { valid: false, error: "Token expired" };
      }

      // If validation endpoint doesn't exist, assume token is valid
      // if we have admin user data
      const adminUser = localStorage.getItem("adminUser");
      if (adminUser) {
        try {
          const user = JSON.parse(adminUser);
          return { valid: true, user };
        } catch (e) {
          return { valid: false, error: "Invalid user data" };
        }
      }

      return { valid: false, error: "Validation failed" };
    }
  },

  // Get Admin Profile
  async getAdminProfile() {
    try {
      const response = await api.get("/admin/profile");
      return response.data;
    } catch (error) {
      console.error("Error fetching admin profile:", error);

      // Fallback to localStorage data
      const adminUser = localStorage.getItem("adminUser");
      if (adminUser) {
        return JSON.parse(adminUser);
      }

      throw new Error("Failed to load admin profile");
    }
  },

  // Books Management
  async getBooks(params = {}) {
    try {
      const response = await api.get("/admin/books", { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching books:", error);
      throw new Error(error.response?.data?.message || "Failed to load books");
    }
  },

  async createBook(bookData) {
    try {
      const response = await api.post("/admin/books", bookData);
      return response.data;
    } catch (error) {
      console.error("Error creating book:", error);
      throw new Error(error.response?.data?.message || "Failed to create book");
    }
  },

  async updateBook(bookId, bookData) {
    try {
      const response = await api.put(`/admin/books/${bookId}`, bookData);
      return response.data;
    } catch (error) {
      console.error("Error updating book:", error);
      throw new Error(error.response?.data?.message || "Failed to update book");
    }
  },

  async deleteBook(bookId) {
    try {
      const response = await api.delete(`/admin/books/${bookId}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting book:", error);
      throw new Error(error.response?.data?.message || "Failed to delete book");
    }
  },

  // Membership Plans
  async getMembershipPlans() {
    try {
      const response = await api.get("/admin/membership-plans");
      return response.data;
    } catch (error) {
      console.error("Error fetching membership plans:", error);
      throw new Error(
        error.response?.data?.message || "Failed to load membership plans"
      );
    }
  },

  // Applications
  async getApplications(params = {}) {
    try {
      const response = await api.get("/admin/applications", { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching applications:", error);
      throw new Error(
        error.response?.data?.message || "Failed to load applications"
      );
    }
  },

  async updateApplicationStatus(applicationId, status) {
    try {
      const response = await api.patch(`/admin/applications/${applicationId}`, {
        status,
      });
      return response.data;
    } catch (error) {
      console.error("Error updating application:", error);
      throw new Error(
        error.response?.data?.message || "Failed to update application"
      );
    }
  },

  // Messages
  async getMessages(params = {}) {
    try {
      const response = await api.get("/admin/messages", { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching messages:", error);
      throw new Error(
        error.response?.data?.message || "Failed to load messages"
      );
    }
  },

  async markMessageAsRead(messageId) {
    try {
      const response = await api.patch(`/admin/messages/${messageId}`, {
        read: true,
      });
      return response.data;
    } catch (error) {
      console.error("Error marking message as read:", error);
      throw new Error(
        error.response?.data?.message || "Failed to update message"
      );
    }
  },
};

// Export individual functions for backward compatibility
export const fetchDashboardStats = adminService.fetchDashboardStats;
export const validateAdminToken = adminService.validateAdminToken;
export const getAdminProfile = adminService.getAdminProfile;

export default adminService;
