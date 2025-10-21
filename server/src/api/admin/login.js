import express from "express";
import jwt from "jsonwebtoken";

const router = express.Router();

// Define admin credentials from environment variables
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@bookhub.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin111";

// Admin login route - accessible at POST /api/admin/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Verify email
    if (email !== ADMIN_EMAIL) {
      console.log("Admin email mismatch");
      return res.status(401).json({ message: "Invalid admin credentials" });
    }

    // Verify password - direct comparison (no bcrypt for admin)
    if (password !== ADMIN_PASSWORD) {
      console.log("Admin password mismatch");
      return res.status(401).json({ message: "Invalid admin credentials" });
    }

    console.log("Admin credentials verified successfully");

    // Create admin JWT token
    const token = jwt.sign(
      { userId: "admin", email: ADMIN_EMAIL, role: "admin" },
      process.env.JWT_SECRET || "cdgeDCScdfsdf",
      { expiresIn: "24h" }
    );

    console.log("Admin token generated successfully");

    // Return token and admin data
    res.json({
      token,
      user: {
        id: "admin",
        email: ADMIN_EMAIL,
        role: "admin",
        fullName: "Administrator",
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
