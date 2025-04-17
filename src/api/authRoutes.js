// src/routes/authRoutes.js
import express from "express";
import bcrypt from "bcrypt";
import { models } from "../database/index.js"; // Adjust the path as needed
import auth from "../middleware/auth.js";

const router = express.Router();

// Login route
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log("Login attempt for:", email);
    
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Find the user by email
    const user = await models.User.findOne({ email });
    
    if (!user) {
      console.log("User not found:", email);
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.password) {
      console.log("User has no password (likely OAuth user):", email);
      return res.status(403).json({ message: "This account uses Google Sign-In. Please log in with Google." });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      console.log("Password mismatch for:", email);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate tokens
    const accessToken = auth.generateAccessToken(
      user._id, 
      user.email, 
      user.role || "user"
    );
    
    const refreshToken = auth.generateRefreshToken(
      user._id,
      user.email,
      user.role || "user"
    );

    console.log("Login successful for:", email);
    
    // Return the tokens and user data
    res.status(200).json({
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        fullName: user.fullName || user.name,
        email: user.email,
        role: user.role || "user",
        hasMembership: user.hasMembership || false,
        // Add other user fields as needed
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "An unexpected error occurred during login" });
  }
});
 
 

// User profile routes
router.get("/me", auth.isAuthenticated, async (req, res) => {
  try {
    const user = await models.User.findById(req.user.userId).select("-password");
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.status(200).json({
      user: {
        id: user._id,
        fullName: user.fullName || user.name,
        email: user.email,
        phone: user.phone,
        age: user.age,
        gender: user.gender,
        location: user.location,
        preferredLanguages: user.preferredLanguages || [],
        favoriteGenres: user.favoriteGenres || [],
        role: user.role || "user",
        hasMembership: user.hasMembership || false,
        preferredBookFormat: user.preferredBookFormat,
        rentalPreferences: user.rentalPreferences
      }
    });
  } catch (error) {
    console.error("Get user profile error:", error);
    res.status(500).json({ message: "Failed to retrieve user profile" });
  }
});

// Update profile route
router.put("/update-profile", auth.isAuthenticated, async (req, res) => {
  try {
    const user = await models.User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const { fullName, phone, age, gender, location, preferredLanguages, favoriteGenres } = req.body;
    
    // Update user fields
    if (fullName) user.fullName = fullName;
    if (phone !== undefined) user.phone = phone;
    if (age !== undefined) user.age = age;
    if (gender) user.gender = gender;
    if (location) user.location = location;
    if (preferredLanguages) user.preferredLanguages = preferredLanguages;
    if (favoriteGenres) user.favoriteGenres = favoriteGenres;
    
    await user.save();
    
    res.status(200).json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        age: user.age,
        gender: user.gender,
        location: user.location,
        preferredLanguages: user.preferredLanguages,
        favoriteGenres: user.favoriteGenres,
        hasMembership: user.hasMembership,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Failed to update user profile" });
  }
});

// For compatibility with different frontend URLs
router.put("/profile", auth.isAuthenticated, async (req, res) => {
  try {
    // Same implementation as update-profile
    const user = await models.User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const { fullName, phone, age, gender, location, preferredLanguages, favoriteGenres } = req.body;
    
    if (fullName) user.fullName = fullName;
    if (phone !== undefined) user.phone = phone;
    if (age !== undefined) user.age = age;
    if (gender) user.gender = gender;
    if (location) user.location = location;
    if (preferredLanguages) user.preferredLanguages = preferredLanguages;
    if (favoriteGenres) user.favoriteGenres = favoriteGenres;
    
    await user.save();
    
    res.status(200).json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        age: user.age,
        gender: user.gender,
        location: user.location,
        preferredLanguages: user.preferredLanguages,
        favoriteGenres: user.favoriteGenres,
        hasMembership: user.hasMembership,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Failed to update user profile" });
  }
});
// Add a token refresh endpoint
router.post("/refresh-token", async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token is required" });
    }
    
    // Verify the refresh token
    const decoded = auth.verifyRefreshToken(refreshToken);
    
    // Generate a new access token
    const accessToken = auth.generateAccessToken(
      decoded.userId,
      decoded.email,
      decoded.role
    );
    
    res.status(200).json({ accessToken });
  } catch (error) {
    console.error("Token refresh error:", error);
    
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Refresh token expired. Please log in again." });
    }
    
    res.status(401).json({ message: "Invalid refresh token" });
  }
});

export default router;