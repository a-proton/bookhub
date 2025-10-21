import express from "express";
import jwt from "jsonwebtoken";

const router = express.Router();

// POST /api/admin/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("Admin login attempt:", { email });

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    // Get admin credentials from environment variables
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
      console.error(
        "Admin credentials not configured in environment variables"
      );
      return res.status(500).json({
        message: "Admin authentication not configured",
      });
    }

    // Check if credentials match environment variables
    if (
      email.toLowerCase() !== ADMIN_EMAIL.toLowerCase() ||
      password !== ADMIN_PASSWORD
    ) {
      console.log("Invalid admin credentials provided");
      return res.status(401).json({
        message: "Invalid admin credentials",
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: "admin",
        email: ADMIN_EMAIL,
        role: "admin",
      },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" }
    );

    // Prepare admin user object
    const adminUser = {
      id: "admin",
      email: ADMIN_EMAIL,
      fullName: "Administrator",
      role: "admin",
    };

    console.log("Admin login successful:", adminUser.email);

    return res.status(200).json({
      success: true,
      message: "Admin login successful",
      token,
      user: adminUser,
    });
  } catch (error) {
    console.error("Admin login error:", error);
    return res.status(500).json({
      message: "An error occurred during admin login",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Optional: GET endpoint to check if route is working
router.get("/test", (req, res) => {
  res.json({ message: "Admin routes are working" });
});

export default router;
