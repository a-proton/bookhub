import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../database/schema/userSchema.js";
import { isAdmin } from "../middleware/authMiddleware.js";

// Import admin-specific routes
import adminBookRoutes from "./admin/bookRoute.js";
import adminUserRoutes from "./admin/userRoute.js";

const router = express.Router();

// Admin login route
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("Admin login attempt:", { email });

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    // Find admin user
    const user = await User.findOne({
      email: email.toLowerCase(),
      role: "admin",
    });

    if (!user) {
      console.log("Admin user not found:", email);
      return res.status(401).json({
        message: "Invalid admin credentials",
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      console.log("Invalid password for admin:", email);
      return res.status(401).json({
        message: "Invalid admin credentials",
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    const adminUser = {
      id: user._id,
      email: user.email,
      fullName: user.fullName || user.name || "Administrator",
      role: user.role,
    };

    console.log("Admin login successful:", adminUser.email);

    res.json({
      token,
      user: adminUser,
      message: "Admin login successful",
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

router.get("/dashboard-stats", isAdmin, async (req, res) => {
  try {
    // Import Book model here to avoid circular dependency issues
    const Book = (await import("../database/schema/bookSchema.js")).default;

    const totalBooks = await Book.countDocuments();
    const activeMembers = await User.countDocuments({ role: { $ne: "admin" } });
    const pendingApplications = 0; // Implement based on your application schema

    const stats = {
      totalBooks,
      activeMembers,
      pendingApplications,
      membershipPlans: 2, // Static for now, implement based on your needs
    };

    console.log("Dashboard stats requested:", stats);
    res.json(stats);
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({
      message: "Error fetching dashboard statistics",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Mount admin sub-routes
router.use("/books", adminBookRoutes); // /api/admin/books/*
router.use("/users", adminUserRoutes); // /api/admin/users/*

// Admin-only user management routes
router.get("/users", isAdmin, async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: "admin" } })
      .select("-password")
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      message: "Error fetching users",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

export default router;
