// ISSUE 1: Token inconsistency in adminService.js
// Your adminService.js is using localStorage.getItem("token") but AuthContext stores admin tokens as "adminToken"

// FIXED adminService.js
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Helper function to get the correct token
const getAuthToken = () => {
  // Priority order: adminToken (for admin users), authToken, token
  return (
    localStorage.getItem("adminToken") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("token")
  );
};

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = getAuthToken();
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

/**
 * Fetch dashboard statistics from the backend
 * @returns {Promise<Object>} Dashboard statistics
 */
export const fetchDashboardStats = async () => {
  try {
    console.log(
      "Fetching dashboard stats with token:",
      getAuthToken() ? "Token present" : "No token"
    );

    const response = await fetch(`${API_BASE_URL}/admin/dashboard-stats`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    console.log("Dashboard stats response status:", response.status);

    if (!response.ok) {
      if (response.status === 401) {
        // Token is invalid or expired
        localStorage.clear(); // Clear all auth data
        window.location.href = "/admin/login";
        throw new Error("Authentication failed. Please login again.");
      }
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Dashboard stats received:", data);

    return {
      totalBooks: data.totalBooks || 0,
      activeMembers: data.activeMembers || 0,
      pendingApplications: data.pendingApplications || 0,
      membershipPlans: data.membershipPlans || 0,
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);

    // If it's an auth error, don't return default values
    if (error.message.includes("Authentication failed")) {
      throw error;
    }

    // Return default values for other errors
    return {
      totalBooks: 0,
      activeMembers: 0,
      pendingApplications: 0,
      membershipPlans: 0,
    };
  }
};

/**
 * Fetch all books from the library
 * @returns {Promise<Array>} Books list
 */
export const fetchBooks = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/books`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.clear();
        window.location.href = "/admin/login";
        throw new Error("Authentication failed. Please login again.");
      }
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.books || data || []; // Handle different response formats
  } catch (error) {
    console.error("Error fetching books:", error);
    if (error.message.includes("Authentication failed")) {
      throw error;
    }
    return [];
  }
};

/**
 * Add a new book to the library
 * @param {Object} bookData - Book data
 * @returns {Promise<Object>} Added book
 */
export const addBook = async (bookData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/books`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(bookData),
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.clear();
        window.location.href = "/admin/login";
        throw new Error("Authentication failed. Please login again.");
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Error ${response.status}: ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error adding book:", error);
    throw error;
  }
};

/**
 * Update an existing book
 * @param {string} bookId - Book ID
 * @param {Object} bookData - Updated book data
 * @returns {Promise<Object>} Updated book
 */
export const updateBook = async (bookId, bookData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/books/${bookId}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(bookData),
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.clear();
        window.location.href = "/admin/login";
        throw new Error("Authentication failed. Please login again.");
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Error ${response.status}: ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating book:", error);
    throw error;
  }
};

/**
 * Delete a book from the library
 * @param {string} bookId - Book ID
 * @returns {Promise<Object>} Response
 */
export const deleteBook = async (bookId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/books/${bookId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.clear();
        window.location.href = "/admin/login";
        throw new Error("Authentication failed. Please login again.");
      }
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error deleting book:", error);
    throw error;
  }
};

/**
 * Fetch all membership plans
 * @returns {Promise<Array>} Membership plans
 */
export const fetchMembershipPlans = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/membership-plans`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.clear();
        window.location.href = "/admin/login";
        throw new Error("Authentication failed. Please login again.");
      }
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.plans || data || [];
  } catch (error) {
    console.error("Error fetching membership plans:", error);
    if (error.message.includes("Authentication failed")) {
      throw error;
    }
    return [];
  }
};

/**
 * Add a new membership plan
 * @param {Object} planData - Plan data
 * @returns {Promise<Object>} Added plan
 */
export const addMembershipPlan = async (planData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/membership-plans`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(planData),
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.clear();
        window.location.href = "/admin/login";
        throw new Error("Authentication failed. Please login again.");
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Error ${response.status}: ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error adding membership plan:", error);
    throw error;
  }
};

/**
 * Update an existing membership plan
 * @param {string} planId - Plan ID
 * @param {Object} planData - Updated plan data
 * @returns {Promise<Object>} Updated plan
 */
export const updateMembershipPlan = async (planId, planData) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/admin/membership-plans/${planId}`,
      {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(planData),
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.clear();
        window.location.href = "/admin/login";
        throw new Error("Authentication failed. Please login again.");
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Error ${response.status}: ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating membership plan:", error);
    throw error;
  }
};

/**
 * Delete a membership plan
 * @param {string} planId - Plan ID
 * @returns {Promise<Object>} Response
 */
export const deleteMembershipPlan = async (planId) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/admin/membership-plans/${planId}`,
      {
        method: "DELETE",
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.clear();
        window.location.href = "/admin/login";
        throw new Error("Authentication failed. Please login again.");
      }
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error deleting membership plan:", error);
    throw error;
  }
};

/**
 * Fetch all pending membership applications
 * @returns {Promise<Array>} Pending applications
 */
export const fetchPendingApplications = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/applications/pending`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.clear();
        window.location.href = "/admin/login";
        throw new Error("Authentication failed. Please login again.");
      }
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.applications || data || [];
  } catch (error) {
    console.error("Error fetching pending applications:", error);
    if (error.message.includes("Authentication failed")) {
      throw error;
    }
    return [];
  }
};

/**
 * Fetch all membership applications (not just pending)
 * @returns {Promise<Array>} All applications
 */
export const fetchMembershipApplications = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/applications`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.clear();
        window.location.href = "/admin/login";
        throw new Error("Authentication failed. Please login again.");
      }
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.applications || data || [];
  } catch (error) {
    console.error("Error fetching membership applications:", error);
    if (error.message.includes("Authentication failed")) {
      throw error;
    }
    return [];
  }
};

/**
 * Approve a membership application
 * @param {string} applicationId - Application ID
 * @returns {Promise<Object>} Updated application
 */
export const approveApplication = async (applicationId) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/admin/applications/${applicationId}/approve`,
      {
        method: "PUT",
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.clear();
        window.location.href = "/admin/login";
        throw new Error("Authentication failed. Please login again.");
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Error ${response.status}: ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error approving application:", error);
    throw error;
  }
};

/**
 * Reject a membership application
 * @param {string} applicationId - Application ID
 * @param {string} reason - Rejection reason
 * @returns {Promise<Object>} Updated application
 */
export const rejectApplication = async (applicationId, reason) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/admin/applications/${applicationId}/reject`,
      {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ reason }),
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.clear();
        window.location.href = "/admin/login";
        throw new Error("Authentication failed. Please login again.");
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Error ${response.status}: ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error rejecting application:", error);
    throw error;
  }
};

/**
 * Fetch all contact messages
 * @returns {Promise<Array>} Contact messages
 */
export const fetchMessages = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/messages`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.clear();
        window.location.href = "/admin/login";
        throw new Error("Authentication failed. Please login again.");
      }
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.messages || data || [];
  } catch (error) {
    console.error("Error fetching messages:", error);
    if (error.message.includes("Authentication failed")) {
      throw error;
    }
    return [];
  }
};

/**
 * Mark a message as read
 * @param {string} messageId - Message ID
 * @returns {Promise<Object>} Updated message
 */
export const markMessageAsRead = async (messageId) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/admin/messages/${messageId}/read`,
      {
        method: "PUT",
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.clear();
        window.location.href = "/admin/login";
        throw new Error("Authentication failed. Please login again.");
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Error ${response.status}: ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error marking message as read:", error);
    throw error;
  }
};

// Export the token getter for use in other parts of the app
export { getAuthToken, getAuthHeaders };
