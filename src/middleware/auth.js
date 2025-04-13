// src/middleware/auth.js
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

// Debugging output
console.log("Auth middleware loaded");

// Auth middleware: verifies token and adds user info to request
const isAuthenticated = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    console.log("Auth headers received:", req.headers);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log("No authorization header or invalid format");
      return res.status(401).json({ message: "Authentication required" });
    }
    
    // Extract token (assuming it's in format "Bearer TOKEN")
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      console.log("No token found after Bearer prefix");
      return res.status(401).json({ message: "Authentication required" });
    }
    
    console.log("Token extracted (first 10 chars):", token.substring(0, 10) + "...");
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret_key");
    console.log("Token decoded:", { userId: decoded.userId, email: decoded.email, role: decoded.role });
    
    // Handle the admin special case
    if (decoded.role === 'admin') {
      // For admin tokens (from admin login endpoint)
      req.user = {
        _id: decoded.userId || decoded._id || 'admin', // Add _id property for direct access
        userId: decoded.userId || 'admin',
        email: decoded.email,
        role: 'admin'
      };
      console.log("Admin user identified from token");
      return next();
    }
    
    // For regular user tokens
    // Update the decoded user object creation:
    req.user = {
      _id: decoded.userId || decoded._id || decoded.id || decoded.sub,  
      userId: decoded.userId || decoded._id || decoded.id || decoded.sub,  
      email: decoded.email,
      role: decoded.role || 'user'
    };
    
    console.log("User authenticated:", req.user);
    next();
  } catch (error) {
    console.error("Authentication error:", error.message);
    
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    } else if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token" });
    }
    
    return res.status(401).json({ message: "Authentication failed" });
  }
};

// Client-side authentication check function
export const checkAndRefreshAuth = (navigate) => {
  const token = localStorage.getItem('authToken');
  
  if (!token) {
    // No token found, redirect to login
    console.log('No auth token found, redirecting to login');
    navigate('/admin/login');
    return false;
  }
  
  // You could also add token validation here if needed
  return true;
};

// Example of how to use in a React component (keep this as reference)
/*
import { useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { checkAndRefreshAuth } from './path-to-this-file';

function YourComponent() {
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!checkAndRefreshAuth(navigate)) {
      return; // Stop if authentication failed
    }
    
    // Rest of your component code...
    fetchApplications();
  }, [navigate]);
  
  // Rest of component...
}
*/

// Admin middleware: checks if authenticated user is an admin
const isAdmin = async (req, res, next) => {
  console.log("isAdmin middleware called");
  
  try {
    // First run the authentication middleware
    isAuthenticated(req, res, (err) => {
      if (err) {
        // If authentication middleware had an error, it already sent response
        return;
      }
      
      // Now check if the user has admin role
      if (!req.user || req.user.role !== 'admin') {
        console.log("Not an admin role:", req.user?.role);
        return res.status(403).json({ message: "Admin access required" });
      }
      
      console.log("Admin authentication successful");
      next();
    });
  } catch (error) {
    console.error("Admin middleware caught error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Optional middleware to check if user is a premium member
const isPremiumMember = async (req, res, next) => {
  try {
    // First authenticate the user
    isAuthenticated(req, res, (err) => {
      if (err) return; // Authentication middleware handles the response
      
      // Now check if the user has premium membership
      if (!req.user || !req.user.hasMembership) {
        console.log("User does not have premium membership");
        return res.status(403).json({ 
          message: "Premium membership required",
          redirectTo: "/membership"
        });
      }
      
      console.log("Premium member access granted");
      next();
    });
  } catch (error) {
    console.error("Premium middleware error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Generate a refresh token
const generateRefreshToken = (userId, email, role = 'user') => {
  try {
    return jwt.sign(
      { userId, email, role },
      process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET || "fallback_refresh_secret",
      { expiresIn: '7d' } // Refresh tokens last longer
    );
  } catch (error) {
    console.error("Error generating refresh token:", error);
    throw error;
  }
};

// Generate an access token
const generateAccessToken = (userId, email, role = 'user', expiresIn = '1h') => {
  try {
    return jwt.sign(
      { userId, email, role },
      process.env.JWT_SECRET || "fallback_secret_key",
      { expiresIn }
    );
  } catch (error) {
    console.error("Error generating access token:", error);
    throw error;
  }
};

// Verify a refresh token
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(
      token,
      process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET || "fallback_refresh_secret"
    );
  } catch (error) {
    console.error("Error verifying refresh token:", error);
    throw error;
  }
};

export default { 
  isAuthenticated, 
  isAdmin, 
  isPremiumMember,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  checkAndRefreshAuth  // Include the client-side function in the exports
};