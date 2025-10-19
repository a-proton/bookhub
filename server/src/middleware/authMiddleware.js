// // src/middleware/authMiddleware.js

// import jwt from "jsonwebtoken";

// // Middleware to check if the user is an ADMIN
// export const isAdmin = (req, res, next) => {
//   try {
//     const token = req.headers.authorization?.split(" ")[1];
//     if (!token) {
//       return res.status(401).json({ message: "Authorization token required" });
//     }

//     const decoded = jwt.verify(
//       token,
//       process.env.JWT_SECRET || "fallback_secret_key"
//     );

//     // The critical check for admin role
//     if (decoded.role !== "admin") {
//       return res
//         .status(403)
//         .json({ message: "Forbidden: Admin access required" });
//     }

//     req.user = decoded; // Attach decoded info (like userId, role) to the request
//     next(); // If admin, proceed to the next handler
//   } catch (error) {
//     return res.status(401).json({ message: "Invalid or expired token" });
//   }
// };

// //
// // --- NEWLY ADDED MIDDLEWARE ---
// // Middleware to check if a user is simply LOGGED IN (authenticated)
// //

// authMiddleware.js - Updated version
import jwt from "jsonwebtoken";
import { models } from "../database/index.js";

// Generic authentication middleware
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Authentication token not found. Please log in again.",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "Authentication token not found. Please log in again.",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "fallback_secret_key"
    );

    console.log("Authentication - decoded token:", decoded);

    // Handle admin user
    if (decoded.userId === "admin" || decoded.role === "admin") {
      req.user = {
        userId: "admin",
        id: "admin",
        email: decoded.email,
        role: "admin",
      };
      console.log("Admin user authenticated");
      return next();
    }

    // Handle regular user - validate ObjectId and check database
    const userId = decoded.id || decoded.userId;

    if (!userId || !userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(401).json({
        message: "Invalid token format. Please log in again.",
      });
    }

    // Optionally verify user still exists in database
    const user = await models.User.findById(userId);
    if (!user) {
      return res.status(401).json({
        message: "User not found. Please log in again.",
      });
    }

    req.user = {
      userId: user._id,
      id: user._id,
      email: user.email,
      role: user.role || "user",
    };
    req.dbUser = user;

    console.log("Regular user authenticated:", user.email);
    next();
  } catch (error) {
    console.error("Authentication error:", error.message);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Token has expired. Please log in again.",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        message: "Invalid token. Please log in again.",
      });
    }

    if (error.name === "CastError") {
      return res.status(401).json({
        message: "Invalid token format. Please log in again.",
      });
    }

    return res.status(401).json({
      message: "Authentication failed. Please log in again.",
    });
  }
};
export const isAuthenticated = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Authorization token required" });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "fallback_secret_key"
    );

    // For isAuthenticated, we just need a valid token. No role check is needed.
    req.user = decoded; // Attach decoded info to the request
    next(); // Proceed to the protected route
  } catch (error) {
    return res
      .status(401)
      .json({ message: "Invalid or expired token. Please log in again." });
  }
};

export const isAdmin = async (req, res, next) => {
  try {
    // First authenticate the user
    await new Promise((resolve, reject) => {
      authenticate(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Check if user has admin role
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Access denied. Admin privileges required.",
      });
    }

    console.log("Admin authorization successful");
    next();
  } catch (error) {
    // Error already handled by authenticate middleware
    return;
  }
};

// Lightweight admin check (for routes that handle their own auth)
export const isAdminSimple = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Authentication token not found. Please log in again.",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "fallback_secret_key"
    );

    if (decoded.userId !== "admin" && decoded.role !== "admin") {
      return res.status(403).json({
        message: "Access denied. Admin privileges required.",
      });
    }

    req.user = {
      userId: "admin",
      email: decoded.email,
      role: "admin",
    };

    next();
  } catch (error) {
    console.error("Admin authentication error:", error.message);
    return res.status(401).json({
      message: "Authentication failed. Please log in again.",
    });
  }
};
