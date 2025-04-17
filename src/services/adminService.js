// src/services/adminService.js

// Base API URL - update this to match your backend URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Fetch dashboard statistics from the backend
 * @returns {Promise<Object>} Dashboard statistics
 */
export const fetchDashboardStats = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/dashboard-stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      totalBooks: data.totalBooks || 0,
      activeMembers: data.activeMembers || 0,
      pendingApplications: data.pendingApplications || 0,
      membershipPlans: data.membershipPlans || 0
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    // Return default values in case of error
    return {
      totalBooks: 0,
      activeMembers: 0,
      pendingApplications: 0,
      membershipPlans: 0
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
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching books:', error);
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
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(bookData)
    });
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error adding book:', error);
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
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(bookData)
    });
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating book:', error);
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
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error deleting book:', error);
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
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching membership plans:', error);
    return [];
  }
};

/**
 * Fetch all pending membership applications
 * @returns {Promise<Array>} Pending applications
 */
export const fetchPendingApplications = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/applications/pending`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching pending applications:', error);
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
    const response = await fetch(`${API_BASE_URL}/admin/applications/${applicationId}/approve`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error approving application:', error);
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
    const response = await fetch(`${API_BASE_URL}/admin/applications/${applicationId}/reject`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ reason })
    });
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error rejecting application:', error);
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
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching messages:', error);
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
    const response = await fetch(`${API_BASE_URL}/admin/messages/${messageId}/read`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error marking message as read:', error);
    throw error;
  }
};