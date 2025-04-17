// Utility functions for the application

/**
 * Debounce function to prevent rapid consecutive calls
 * @param {Function} func - The function to debounce
 * @param {number} wait - The time to wait in milliseconds
 * @returns {Function} - The debounced function
 */
export function debounce(func, wait) {
    let timeout
  
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout)
        func(...args)
      }
  
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
    }
  }
  
  /**
   * Deep compare two objects for equality
   * @param {Object} obj1 - First object to compare
   * @param {Object} obj2 - Second object to compare
   * @returns {boolean} - True if objects are equal
   */
  export function deepEqual(obj1, obj2) {
    if (obj1 === obj2) return true
  
    if (typeof obj1 !== "object" || obj1 === null || typeof obj2 !== "object" || obj2 === null) {
      return false
    }
  
    const keys1 = Object.keys(obj1)
    const keys2 = Object.keys(obj2)
  
    if (keys1.length !== keys2.length) return false
  
    for (const key of keys1) {
      if (!keys2.includes(key)) return false
  
      if (!deepEqual(obj1[key], obj2[key])) return false
    }
  
    return true
  }
  
  /**
   * Format a date to a readable string
   * @param {Date} date - The date to format
   * @returns {string} - Formatted date string
   */
  export function formatDate(date) {
    if (!date) return "N/A"
  
    const options = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  
    return new Date(date).toLocaleDateString(undefined, options)
  }
  
  /**
   * Generate a unique ID
   * @returns {string} - A unique ID
   */
  export function generateId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  }
  