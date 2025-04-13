// authRoutes.js
import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../database/schema/userSchema.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Define admin credentials - for simplicity, hard-coded here
// In production, these should be stored securely
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@bookhub.com";
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || "$2b$10$yourHashedAdminPasswordHere"; // Pre-hashed password

// User login route
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find the user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    
    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    
    // Create JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role || 'user' },
      process.env.JWT_SECRET || "fallback_secret_key",
      { expiresIn: "24h" }
    );
    
    // Return token and user data (excluding password)
    const userData = {
      id: user._id,
      email: user.email,
      role: user.role || 'user',
      // Add other user fields as needed
    };
    
    res.json({ token, user: userData });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Admin login route - VERY IMPORTANT: this needs to exist!
router.post("/admin/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log(`Admin login attempt for: ${email}`);
    
    // Verify against admin credentials
    if (email !== ADMIN_EMAIL) {
      console.log("Admin email mismatch");
      return res.status(401).json({ message: "Invalid admin credentials" });
    }
    
    // For demo purposes, you can check a plain password
    // In production, use the hashed password comparison like this:
    const isMatch = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
    
    // For quick testing, you can also use a simple password check:
    // const isMatch = (password === 'your-admin-password');
    
    if (!isMatch) {
      console.log("Admin password mismatch");
      return res.status(401).json({ message: "Invalid admin credentials" });
    }
    
    // Create admin JWT token
    const token = jwt.sign(
      { userId: 'admin', email: ADMIN_EMAIL, role: 'admin' },
      process.env.JWT_SECRET || "fallback_secret_key",
      { expiresIn: "24h" }
    );
    
    // Return token and admin data
    res.json({ 
      token, 
      user: {
        id: 'admin',
        email: ADMIN_EMAIL,
        role: 'admin'
      }
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Token validation endpoint
router.get("/validate", auth.isAuthenticated, (req, res) => {
  // If middleware passes, user is authenticated
  res.json({ user: req.user });
});

// User registration route
router.post("/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }
    
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create new user
    const user = new User({
      email,
      password: hashedPassword,
      name,
      role: 'user'
    });
    
    await user.save();
    
    // Create JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: 'user' },
      process.env.JWT_SECRET || "fallback_secret_key",
      { expiresIn: "24h" }
    );
    
    // Return token and user data (excluding password)
    const userData = {
      id: user._id,
      email: user.email,
      name: user.name,
      role: 'user'
    };
    
    res.status(201).json({ token, user: userData });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;