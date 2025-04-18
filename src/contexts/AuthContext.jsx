"use client"

import { createContext, useState, useEffect, useContext } from "react"
import axios from "axios"

// Create API URL based on environment - ensure consistent formatting
const API_URL =
  process.env.REACT_APP_API_URL || (process.env.NODE_ENV === "production" ? "/api" : "http://localhost:5000/api")

// Create an axios instance with base URL for consistency
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
})

// Add request interceptor to inject token with every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// Add response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // If error is 401 (Unauthorized) and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        // Try to refresh the token
        const refreshed = await refreshTokenFunction()

        if (refreshed) {
          // If token refresh was successful, retry the original request
          originalRequest.headers.Authorization = `Bearer ${localStorage.getItem("token")}`
          return api(originalRequest)
        }
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError)
      }
    }

    return Promise.reject(error)
  },
)

// This will be set by the AuthProvider
let refreshTokenFunction = async () => false

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null)
  const [userPreferences, setUserPreferences] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userMembership, setUserMembership] = useState(null)

  // Check if token is expired by decoding JWT
  const isTokenExpired = (token) => {
    try {
      const tokenParts = token.split(".")
      if (tokenParts.length !== 3) return true

      const payload = JSON.parse(atob(tokenParts[1]))
      const currentTime = Math.floor(Date.now() / 1000)

      // Check if token has expired
      if (payload.exp && payload.exp < currentTime) {
        console.log("Token expired")
        return true
      }
      return false
    } catch (e) {
      console.error("Error checking token expiration:", e)
      return true // If we can't check, better to assume expired
    }
  }

  // More reliable checkAuthStatus function
  const checkAuthStatus = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      const userData = localStorage.getItem("user")

      // No token means not authenticated
      if (!token) {
        console.log("No token found in localStorage, user is not authenticated")
        setIsAuthenticated(false)
        setCurrentUser(null)
        setUserPreferences(null)
        setLoading(false)
        return
      }

      // If we have both token and user data, consider user authenticated immediately
      if (userData) {
        try {
          const parsedUser = JSON.parse(userData)
          console.log("User data found in localStorage:", parsedUser)
          setCurrentUser(parsedUser)
          setIsAuthenticated(true)

          // Extract user preferences from the user data
          if (parsedUser) {
            const preferences = {
              age: parsedUser.age,
              gender: parsedUser.gender,
              location: parsedUser.location,
              preferredLanguages: parsedUser.preferredLanguages || [],
              favoriteGenres: parsedUser.favoriteGenres || [],
              preferredBookFormat: parsedUser.preferredBookFormat,
              rentalPreferences: parsedUser.rentalPreferences || {
                booksPerMonth: 1,
                prefersTrending: false,
                openToRecommendations: true,
              },
            }
            setUserPreferences(preferences)
          }
        } catch (e) {
          console.error("Error parsing stored user data:", e)
          // If parsing fails, continue and try to validate token
        }
      }

      // Now do a background token validation without blocking authentication
      validateTokenInBackground(token)
    } catch (error) {
      console.error("Auth check error:", error)
      // DO NOT LOGOUT here - let the user stay logged in even if there's an error
    } finally {
      setLoading(false)
    }
  }

  // Add this new function to validate token in background
  const validateTokenInBackground = async (token) => {
    try {
      // First try the validation endpoint
      const response = await api.get("/users/validate-token")
      if (response.data && response.data.valid) {
        console.log("Token validated successfully in background")
        if (response.data.user) {
          updateUserData(response.data.user)
        }
      }
    } catch (err) {
      // If validation endpoint doesn't exist, try another endpoint
      if (err.response?.status === 404) {
        try {
          const meResponse = await api.get("/users/me")
          if (meResponse.status === 200 && meResponse.data.user) {
            console.log("User data fetched successfully in background")
            updateUserData(meResponse.data.user)
          }
        } catch (innerErr) {
          // Only log the error, don't logout
          console.warn("Background validation failed:", innerErr.message)
        }
      } else {
        console.warn("Token validation failed in background:", err.message)
        // If it's a 401/403, quietly try to refresh the token
        if (err.response?.status === 401 || err.response?.status === 403) {
          refreshToken().catch((e) => console.warn("Token refresh failed:", e.message))
        }
      }
    }
  }

  // Improved validateToken function for explicit validation
  const validateToken = async (token) => {
    try {
      // Try the token validation endpoint
      const response = await api.get("/users/validate-token")

      if (response.data && response.data.valid) {
        console.log("Token validated successfully")

        // If response includes user data, update it
        if (response.data.user) {
          updateUserData(response.data.user)
        }

        return true
      } else {
        console.warn("Token validation failed")
        return false
      }
    } catch (err) {
      // If 404, endpoint doesn't exist, try alternative approach
      if (err.response?.status === 404) {
        console.log("Validation endpoint not found, trying alternative check...")

        try {
          // Try a basic endpoint that requires authentication
          const checkResponse = await api.get("/users/me")

          if (checkResponse.status === 200) {
            console.log("Token verified via alternative endpoint")

            if (checkResponse.data.user) {
              updateUserData(checkResponse.data.user)
            }

            return true
          }
          return false
        } catch (altErr) {
          if (altErr.response?.status === 401 || altErr.response?.status === 403) {
            console.error("Authentication failed:", altErr.response?.status)
            return false
          }

          console.warn("Network or server error during auth check, assuming still valid:", altErr)
          return true
        }
      } else if (err.response?.status === 401 || err.response?.status === 403) {
        console.error("Token invalid:", err.response?.status)
        return false
      } else {
        console.warn("Error during token validation, assuming still valid:", err)
        return true
      }
    }
  }
  // Add this function to your AuthProvider component
  const refreshUserData = async () => {
    try {
      setLoading(true)
      const response = await api.get("/users/me")

      if (response.data && response.data.user) {
        // Create a standardized user object with all required fields
        const userData = {
          id: response.data.user._id || response.data.user.id,
          _id: response.data.user._id || response.data.user.id,
          fullName: response.data.user.fullName || response.data.user.name || currentUser?.fullName || "User",
          email: response.data.user.email,
          role: response.data.user.role || "user",
          hasMembership: response.data.user.hasMembership || false,
          phone: response.data.user.phone || currentUser?.phone || "",
          // Include all user preference fields directly in user object
          age: response.data.user.age || currentUser?.age,
          gender: response.data.user.gender || currentUser?.gender,
          location: response.data.user.location || currentUser?.location,
          preferredLanguages: response.data.user.preferredLanguages || currentUser?.preferredLanguages || [],
          favoriteGenres: response.data.user.favoriteGenres || currentUser?.favoriteGenres || [],
          preferredBookFormat: response.data.user.preferredBookFormat || currentUser?.preferredBookFormat,
          rentalPreferences: response.data.user.rentalPreferences ||
            currentUser?.rentalPreferences || {
              booksPerMonth: 1,
              prefersTrending: false,
              openToRecommendations: true,
            },
        }

        // Update both states and localStorage
        localStorage.setItem("user", JSON.stringify(userData))
        setCurrentUser(userData)

        // Also create and update preferences object
        const preferences = {
          age: userData.age,
          gender: userData.gender,
          location: userData.location,
          preferredLanguages: userData.preferredLanguages,
          favoriteGenres: userData.favoriteGenres,
          preferredBookFormat: userData.preferredBookFormat,
          rentalPreferences: userData.rentalPreferences,
        }

        setUserPreferences(preferences)
        console.log("User data refreshed successfully:", userData)

        // Check membership if needed
        if (userData.hasMembership) {
          fetchUserMembership()
        }

        return { success: true, user: userData }
      }

      return { success: false, error: "No user data returned" }
    } catch (err) {
      console.error("Failed to refresh user data:", err)
      // Don't logout on errors - maintain existing state
      return {
        success: false,
        error: err.response?.data?.message || "Error refreshing user data",
      }
    } finally {
      setLoading(false)
    }
  }
  // Improved fetchUserData function
  const fetchUserData = async (token) => {
    console.log("fetchUserData called with token:", token ? "Token provided" : "Using stored token")
    try {
      const authToken = token || localStorage.getItem("token")
      if (!authToken) {
        console.log("No token available for fetchUserData")
        return
      }

      // Try the users/me endpoint first
      try {
        const response = await api.get("/users/me")

        if (response.data && response.data.user) {
          updateUserDataFromResponse(response.data.user)
          return
        }
      } catch (err) {
        if (err.response?.status === 404) {
          console.log("users/me endpoint not found, trying auth/profile")
          // If users/me returns 404, try the auth/profile endpoint
          try {
            const profileResponse = await api.get("/auth/profile")

            if (profileResponse.data && profileResponse.data.user) {
              updateUserDataFromResponse(profileResponse.data.user)
              return
            }
          } catch (profileErr) {
            console.error("Failed to fetch user profile from auth/profile:", profileErr)
          }
        } else {
          console.error("Failed to fetch user data from users/me:", err)
        }
      }

      // If we get here, both endpoints failed
      console.error("All user data fetch attempts failed")
    } catch (err) {
      console.error("Error in fetchUserData:", err)
    }
  }

  // Helper function to standardize user data processing
  const updateUserDataFromResponse = (userData) => {
    const standardizedUser = {
      id: userData._id || userData.id,
      _id: userData._id || userData.id,
      fullName: userData.fullName || userData.name || "User",
      email: userData.email,
      role: userData.role || "user",
      hasMembership: userData.hasMembership || false,
      phone: userData.phone || "",
      age: userData.age,
      gender: userData.gender,
      location: userData.location,
      preferredLanguages: userData.preferredLanguages || [],
      favoriteGenres: userData.favoriteGenres || [],
      preferredBookFormat: userData.preferredBookFormat,
      rentalPreferences: userData.rentalPreferences || {
        booksPerMonth: 1,
        prefersTrending: false,
        openToRecommendations: true,
      },
      ...userData,
    }

    localStorage.setItem("user", JSON.stringify(standardizedUser))
    setCurrentUser(standardizedUser)
    setIsAuthenticated(true)

    // Also update preferences
    const preferences = {
      age: userData.age,
      gender: userData.gender,
      location: userData.location,
      preferredLanguages: userData.preferredLanguages || [],
      favoriteGenres: userData.favoriteGenres || [],
      preferredBookFormat: userData.preferredBookFormat,
      rentalPreferences: userData.rentalPreferences || {
        booksPerMonth: 1,
        prefersTrending: false,
        openToRecommendations: true,
      },
    }

    setUserPreferences(preferences)

    console.log("User data and preferences updated:", standardizedUser, preferences)
  }
  const updateUserData = (userData) => {
    if (!userData) return

    const updatedUser = {
      ...currentUser,
      ...userData,
      fullName: userData.fullName || userData.name || currentUser?.fullName || "User",
    }

    localStorage.setItem("user", JSON.stringify(updatedUser))
    setCurrentUser(updatedUser)

    // Also update preferences if available in userData
    if (userData) {
      const updatedPreferences = {
        age: userData.age,
        gender: userData.gender,
        location: userData.location,
        preferredLanguages: userData.preferredLanguages || userPreferences?.preferredLanguages || [],
        favoriteGenres: userData.favoriteGenres || userPreferences?.favoriteGenres || [],
        preferredBookFormat: userData.preferredBookFormat || userPreferences?.preferredBookFormat,
        rentalPreferences: userData.rentalPreferences ||
          userPreferences?.rentalPreferences || {
            booksPerMonth: 1,
            prefersTrending: false,
            openToRecommendations: true,
          },
      }

      setUserPreferences(updatedPreferences)
    }

    // If user has membership, fetch membership details
    if (updatedUser.hasMembership) {
      fetchUserMembership()
    } else {
      setUserMembership(null)
    }
  }

  // Fetch user membership details
  const fetchUserMembership = async () => {
    if (!currentUser || !currentUser.hasMembership) {
      setUserMembership(null)
      return null
    }

    try {
      // Update this path to match your API endpoint
      const response = await api.get("/memberships/user-details")

      if (response.data) {
        setUserMembership(response.data)
        return response.data
      }

      return null
    } catch (err) {
      console.error("Error fetching membership details:", err)

      // If membership endpoint is not found, let's handle it gracefully
      if (err.response?.status === 404) {
        console.log("Membership endpoint not found - user might not have membership or endpoint is incorrect")

        // Don't update the user object automatically if endpoint is missing
        // We should confirm with backend team if this endpoint should exist
      }

      setUserMembership(null)
      return null
    }
  }

  // UPDATED: Enhanced updateUserProfile function with multiple endpoint attempts and fallback
  // Based on your actual backend structure from app.ts
  const updateUserProfile = async (profileData) => {
    try {
      setLoading(true)
      console.log("Updating profile with data:", profileData)

      // First try the most likely endpoint based on your backend structure
      try {
        const response = await api.put("/users/update", profileData)
        console.log("Profile update response:", response.data)

        if (response.data && (response.data.user || response.data.message)) {
          // Get the updated user data from the response
          const serverUpdatedUser = response.data.user || {}

          // Create a complete updated user object
          const updatedUser = {
            ...currentUser,
            ...profileData,
            ...serverUpdatedUser,
          }

          // Update localStorage and state
          localStorage.setItem("user", JSON.stringify(updatedUser))
          setCurrentUser(updatedUser)

          // Update preferences
          const updatedPreferences = {
            age: updatedUser.age,
            gender: updatedUser.gender,
            location: updatedUser.location,
            preferredLanguages: updatedUser.preferredLanguages || [],
            favoriteGenres: updatedUser.favoriteGenres || [],
          }
          setUserPreferences(updatedPreferences)

          return { success: true, user: updatedUser }
        }
      } catch (primaryErr) {
        console.error("Primary endpoint failed:", primaryErr)

        // If the primary endpoint fails, try the auth/profile endpoint
        try {
          const altResponse = await api.put("/auth/profile", profileData)

          if (altResponse.data && (altResponse.data.user || altResponse.data.message)) {
            const updatedUser = {
              ...currentUser,
              ...profileData,
              ...(altResponse.data.user || {}),
            }

            localStorage.setItem("user", JSON.stringify(updatedUser))
            setCurrentUser(updatedUser)

            return { success: true, user: updatedUser }
          }
        } catch (altErr) {
          console.error("Alternative endpoint failed:", altErr)

          // Try one more endpoint as a last resort
          try {
            const lastResponse = await api.put("/auth/update-profile", profileData)

            if (lastResponse.data) {
              const updatedUser = {
                ...currentUser,
                ...profileData,
                ...(lastResponse.data.user || {}),
              }

              localStorage.setItem("user", JSON.stringify(updatedUser))
              setCurrentUser(updatedUser)

              return { success: true, user: updatedUser }
            }
          } catch (lastErr) {
            console.error("Last resort endpoint failed:", lastErr)
            throw new Error("All update endpoints failed")
          }
        }
      }

      return { success: false, error: "Update failed" }
    } catch (err) {
      console.error("Failed to update profile:", err)
      return { success: false, error: err.response?.data?.message || "Failed to update profile" }
    } finally {
      setLoading(false)
    }
  }

  // Improved refreshToken function
  const refreshToken = async () => {
    try {
      const currentToken = localStorage.getItem("token")
      const refreshTokenValue = localStorage.getItem("refreshToken") // Get the refresh token

      if (!currentToken || !refreshTokenValue) {
        console.log("No token or refresh token to refresh")
        return false
      }

      // Try to refresh the token
      const response = await api.post("/auth/refresh-token", {
        refreshToken: refreshTokenValue, // Send the refresh token in the request body
      })

      if (response.data && response.data.accessToken) {
        // Update token in localStorage
        localStorage.setItem("token", response.data.accessToken)

        console.log("Token refreshed successfully")
        return true
      }
      return false
    } catch (error) {
      console.error("Error refreshing token:", error)

      // DON'T logout on errors - let the user stay logged in
      // We'll try again later or let the token expire naturally
      return false
    }
  }

  // Set the refreshTokenFunction for the interceptor to use
  refreshTokenFunction = refreshToken

  // Regular login
  // In AuthContext.js - Modify your login function
  // In AuthContext.js

  // Login function
  const login = async (email, password) => {
    try {
      setLoading(true)

      // This is the correct path - make sure it matches your backend route
      const response = await api.post("/auth/login", { email, password })

      if (response.data) {
        // Store both tokens
        if (response.data.accessToken) {
          localStorage.setItem("token", response.data.accessToken)
        } else if (response.data.token) {
          localStorage.setItem("token", response.data.token)
        }

        // Store refresh token if available
        if (response.data.refreshToken) {
          localStorage.setItem("refreshToken", response.data.refreshToken)
        }

        api.defaults.headers.common["Authorization"] = `Bearer ${localStorage.getItem("token")}`

        // Store the complete user data
        const userData = response.data.user
        localStorage.setItem("user", JSON.stringify(userData))

        // Update user state
        setCurrentUser(userData)
        setIsAuthenticated(true)

        // Also update user preferences state
        const preferences = {
          age: userData.age || null,
          gender: userData.gender || null,
          location: userData.location || null,
          preferredLanguages: userData.preferredLanguages || [],
          favoriteGenres: userData.favoriteGenres || [],
        }

        setUserPreferences(preferences)

        return { success: true }
      }

      return { success: false, error: "Login failed" }
    } catch (error) {
      console.error("Login error:", error)
      return {
        success: false,
        error: error.response?.data?.message || "Invalid credentials",
      }
    } finally {
      setLoading(false)
    }
  }

  // Check user status function
  const checkUserStatus = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        setCurrentUser(null)
        setUserPreferences(null)
        return { loggedIn: false }
      }

      api.defaults.headers.common["Authorization"] = `Bearer ${token}`

      // Validate token and get user data
      const response = await api.get("/users/validate-token")

      if (response.data && response.data.user) {
        const userData = response.data.user

        // Save user data to state and localStorage
        setCurrentUser(userData)
        localStorage.setItem("user", JSON.stringify(userData))

        // Also update user preferences
        const preferences = {
          age: userData.age || null,
          gender: userData.gender || null,
          location: userData.location || null,
          preferredLanguages: userData.preferredLanguages || [],
          favoriteGenres: userData.favoriteGenres || [],
        }

        setUserPreferences(preferences)

        return { loggedIn: true, userData }
      }

      // Token valid but no user data
      return { loggedIn: false }
    } catch (error) {
      console.error("Session validation error:", error)
      // Clear invalid session
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      setCurrentUser(null)
      setUserPreferences(null)
      return { loggedIn: false, error: error.message }
    }
  }
  // Admin login
  const adminLogin = async (email, password) => {
    try {
      setLoading(true)
      setError(null)
      console.log(`Sending admin login request to ${API_URL}/admin/login`)

      // First, check if the endpoint exists by sending a test request
      try {
        await axios.options(`${API_URL}/admin/login`)
      } catch (optionsErr) {
        console.log("Admin endpoint check failed, trying alternative endpoint")

        // If the admin endpoint check fails, try the regular login endpoint
        const regularLoginResponse = await api.post("/users/login", {
          email,
          password,
        })

        if (regularLoginResponse.data.token) {
          // Verify if the user is an admin
          const payload = JSON.parse(atob(regularLoginResponse.data.token.split(".")[1]))
          const isAdmin = payload.role === "admin" || regularLoginResponse.data.user?.role === "admin"

          if (!isAdmin) {
            throw new Error("User is not an admin")
          }

          // Create proper admin user object
          const userWithRole = {
            ...regularLoginResponse.data.user,
            role: "admin",
            fullName: regularLoginResponse.data.user.fullName || regularLoginResponse.data.user.name || "Admin",
          }

          // Store both token and user data
          localStorage.setItem("token", regularLoginResponse.data.token)
          localStorage.setItem("user", JSON.stringify(userWithRole))

          // Update state
          setCurrentUser(userWithRole)
          setIsAuthenticated(true)
          console.log("Admin login successful via regular endpoint:", userWithRole)

          return { success: true, user: userWithRole }
        }
      }

      // If the above didn't return, try the dedicated admin endpoint
      const response = await api.post("/admin/login", {
        email,
        password,
      })

      if (response.data.token) {
        // Create complete user object with role
        const userWithRole = {
          ...response.data.user,
          role: "admin",
          fullName: response.data.user.fullName || response.data.user.name || "Admin",
        }

        // Store both token and complete user data
        localStorage.setItem("token", response.data.token)
        localStorage.setItem("user", JSON.stringify(userWithRole))

        // Update state
        setCurrentUser(userWithRole)
        setIsAuthenticated(true)
        console.log("Admin login successful via admin endpoint:", userWithRole)

        return { success: true, user: userWithRole }
      }

      throw new Error("Admin login failed - no token received")
    } catch (err) {
      console.error("Admin login error details:", err)
      const errorMessage = err.response?.data?.message || err.message || "Admin login failed"
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  // Registration
  const register = async (userData) => {
    try {
      setLoading(true)
      setError(null)

      const response = await api.post("/auth/signup", userData)

      return { success: true, message: response.data.message }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Registration failed"
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  // Logout
  const logout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    setCurrentUser(null)
    setUserPreferences(null)
    setUserMembership(null)
    setIsAuthenticated(false)
    setError(null)
  }

  // Update user preferences
  const updatePreferences = async (preferencesData) => {
    try {
      setLoading(true)
      setError(null)

      const response = await api.put("/users/preferences", preferencesData)

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
            openToRecommendations: true,
          },
        }

        setUserPreferences(updatedPreferences)

        // Also update the user data in state and localStorage
        const updatedUser = {
          ...currentUser,
          age: response.data.user.age,
          gender: response.data.user.gender,
          location: response.data.user.location,
          preferredLanguages: response.data.user.preferredLanguages || [],
          favoriteGenres: response.data.user.favoriteGenres || [],
          preferredBookFormat: response.data.user.preferredBookFormat,
          rentalPreferences: response.data.user.rentalPreferences || {
            booksPerMonth: 1,
            prefersTrending: false,
            openToRecommendations: true,
          },
        }

        setCurrentUser(updatedUser)
        localStorage.setItem("user", JSON.stringify(updatedUser))

        return { success: true, message: response.data.message }
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to update preferences"
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  // Function to diagnose token issues
  const diagnoseTokenIssues = () => {
    try {
      // Check if token exists
      const token = localStorage.getItem("token")
      if (!token) {
        console.error("No token found in localStorage")
        return false
      }

      // Log token format
      console.log("Token format check:")
      console.log("- Length:", token.length)
      console.log("- Starts with:", token.substring(0, 10) + "...")

      // Check token structure (should be in JWT format with 3 parts)
      const parts = token.split(".")
      if (parts.length !== 3) {
        console.error("Invalid token format: not a valid JWT (should have 3 parts)")
        return false
      }

      // Decode payload
      try {
        const payload = JSON.parse(atob(parts[1]))
        console.log("Decoded payload:", payload)

        // Check if payload has crucial fields
        if (!payload.userId && !payload.sub && !payload._id) {
          console.error("Token missing userId/sub/_id field")
        }

        // Check expiration
        if (payload.exp) {
          const now = Math.floor(Date.now() / 1000)
          const timeLeft = payload.exp - now
          console.log(`Token expires in: ${timeLeft} seconds (${timeLeft / 60} minutes)`)

          if (timeLeft < 0) {
            console.error("Token is expired!")
            return false
          }
        } else {
          console.warn("Token has no expiration!")
        }

        return true
      } catch (e) {
        console.error("Failed to decode token payload:", e)
        return false
      }
    } catch (e) {
      console.error("Token diagnosis error:", e)
      return false
    }
  }

  // Function to get user email for autofilling forms
  const getUserEmail = () => {
    return currentUser?.email || ""
  }

  // Changed from property to function
  const isAdmin = () => {
    return currentUser?.role === "admin"
  }

  // Initialize auth state and setup refresh timer
  useEffect(() => {
    console.log("Auth provider initialized")

    // CRITICAL: Immediately set authentication state from localStorage
    const token = localStorage.getItem("token")
    const userData = localStorage.getItem("user")

    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData)
        setCurrentUser(parsedUser)
        setIsAuthenticated(true)

        // Also set user preferences from stored user data
        if (parsedUser) {
          const preferences = {
            age: parsedUser.age,
            gender: parsedUser.gender,
            location: parsedUser.location,
            preferredLanguages: parsedUser.preferredLanguages || [],
            favoriteGenres: parsedUser.favoriteGenres || [],
            preferredBookFormat: parsedUser.preferredBookFormat,
            rentalPreferences: parsedUser?.rentalPreferences || {
              booksPerMonth: 1,
              prefersTrending: false,
              openToRecommendations: true,
            },
          }
          setUserPreferences(preferences)
        }

        console.log("User authenticated from localStorage immediately")
      } catch (e) {
        console.error("Error parsing user data from localStorage")
      }
    }

    // Then check auth status which will validate in the background
    checkAuthStatus()

    // Set up automatic token refresh
    const refreshInterval = setInterval(
      () => {
        if (localStorage.getItem("token")) {
          refreshToken().catch((e) => console.warn("Scheduled token refresh failed:", e.message))
        }
      },
      15 * 60 * 1000,
    ) // Every 15 minutes

    return () => clearInterval(refreshInterval)
  }, [])

  // Add useEffect to fetch membership details when user changes
  useEffect(() => {
    // If user is authenticated and has membership, fetch membership details
    if (isAuthenticated && currentUser?.hasMembership) {
      fetchUserMembership()
    }
  }, [isAuthenticated, currentUser?.hasMembership])

  const value = {
    currentUser,
    userPreferences,
    userMembership,
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
    updateUserProfile,
    checkAuthStatus,
    getUserEmail,
    diagnoseTokenIssues,
    refreshToken,
    isAdmin,
    fetchUserMembership,
    refreshUserData,
    API_URL,
    api, // Export the API instance for use in components
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthContext
