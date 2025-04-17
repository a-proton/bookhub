 
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

 
console.log("Auth middleware loaded");

 
const isAuthenticated = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    console.log("Auth headers received:", req.headers);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log("No authorization header or invalid format");
      return res.status(401).json({ message: "Authentication required" });
    }
     
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      console.log("No token found after Bearer prefix");
      return res.status(401).json({ message: "Authentication required" });
    }
    
    console.log("Token extracted (first 10 chars):", token.substring(0, 10) + "...");
    
 
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret_key");
    console.log("Token decoded:", { userId: decoded.userId, email: decoded.email, role: decoded.role });
    
  
    if (decoded.role === 'admin') {
      
      req.user = {
        _id: decoded.userId || decoded._id || 'admin',  
        userId: decoded.userId || 'admin',
        email: decoded.email,
        role: 'admin'
      };
      console.log("Admin user identified from token");
      return next();
    }
    
 
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

 
export const checkAndRefreshAuth = (navigate) => {
  const token = localStorage.getItem('authToken');
  
  if (!token) {
     
    console.log('No auth token found, redirecting to login');
    navigate('/admin/login');
    return false;
  }
 
  return true;
};
 
const isAdmin = async (req, res, next) => {
  console.log("isAdmin middleware called");
  
  try {
    
    isAuthenticated(req, res, (err) => {
      if (err) {
        
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

// Export named functions for direct import
export { isAuthenticated, isAdmin, isPremiumMember };

// Also export as default for backward compatibility
export default { 
  isAuthenticated, 
  isAdmin, 
  isPremiumMember,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  checkAndRefreshAuth
};