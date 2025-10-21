import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { models } from "../database/index.js";
import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const router = express.Router();

// Utility functions
const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validatePassword = (password) => password.length >= 8;

const verifyToken = (req) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) throw new Error("No authentication token provided");
  return jwt.verify(token, process.env.JWT_SECRET || "your-fallback-secret");
};

// Signup
router.post("/signup", async (req, res) => {
  try {
    console.log("📝 Signup request received");
    const {
      fullName,
      email,
      phone,
      password,
      age,
      gender,
      location,
      preferredLanguages,
      favoriteGenres,
      preferredBookFormat,
      rentalPreferences,
    } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    if (!validatePassword(password)) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters" });
    }

    const existingUser = await models.User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new models.User({
      fullName,
      email,
      phone,
      password: hashedPassword,
      role: "user",
      age,
      gender,
      location,
      preferredLanguages,
      favoriteGenres,
      preferredBookFormat,
      rentalPreferences: {
        booksPerMonth: rentalPreferences?.booksPerMonth || 1,
        prefersTrending: rentalPreferences?.prefersTrending || false,
        openToRecommendations: rentalPreferences?.openToRecommendations ?? true,
      },
    });

    await user.save();
    console.log("✅ User created successfully");
    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    console.error("❌ Signup error:", error);
    res.status(500).json({ message: error.message });
  }
});

// Login - WITH DETAILED LOGGING
router.post("/login", async (req, res) => {
  try {
    console.log("🔐 Login attempt started");
    console.log("📧 Email:", req.body.email);

    const { email, password } = req.body;

    if (!email || !password) {
      console.log("❌ Missing email or password");
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    console.log("🔍 Searching for user in database...");
    const user = await models.User.findOne({ email });

    if (!user) {
      console.log("❌ User not found");
      return res.status(404).json({ message: "User not found" });
    }

    console.log("✅ User found:", user.email);

    if (!user.password) {
      console.log("❌ User has no password (Google account)");
      return res.status(403).json({
        message: "This account is registered via Google Sign-In",
      });
    }

    console.log("🔑 Comparing passwords...");
    const isMatch = await bcrypt.compare(password, user.password);
    console.log("🔑 Password match:", isMatch);

    if (!isMatch) {
      console.log("❌ Invalid password");
      return res.status(401).json({ message: "Invalid credentials" });
    }

    console.log("🎫 Generating tokens...");
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role || "user" },
      process.env.JWT_SECRET || "your-fallback-secret",
      { expiresIn: "24h" }
    );

    const refreshToken = jwt.sign(
      { id: user._id, email: user.email, role: user.role || "user" },
      process.env.JWT_REFRESH_SECRET || "refresh-fallback-secret",
      { expiresIn: "7d" }
    );

    console.log("✅ Tokens generated successfully");

    const userData = {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      age: user.age,
      gender: user.gender,
      location: user.location,
      preferredLanguages: user.preferredLanguages || [],
      favoriteGenres: user.favoriteGenres || [],
      role: user.role || "user",
      hasMembership: user.hasMembership,
      preferredBookFormat: user.preferredBookFormat,
      rentalPreferences: user.rentalPreferences,
    };

    console.log("📦 Sending response with user data");

    res.status(200).json({
      token,
      refreshToken,
      user: userData,
    });

    console.log("✅ Login successful for:", user.email);
  } catch (error) {
    console.error("❌ Login error:", error);
    console.error("Error stack:", error.stack);
    return res.status(500).json({
      message: "Internal server error during login",
      error: error.message,
    });
  }
});

// Token validation endpoint
router.get("/validate-token", async (req, res) => {
  try {
    console.log("🔍 Token validation request received");

    const decoded = verifyToken(req);
    console.log("✅ Token verified, user ID:", decoded.id);

    const user = await models.User.findById(
      decoded.id || decoded.userId
    ).select("-password");

    if (!user) {
      console.log("❌ User not found with ID:", decoded.id || decoded.userId);
      return res.status(404).json({ message: "User not found" });
    }

    console.log("✅ User found, returning data for:", user.email);

    return res.status(200).json({
      user: {
        _id: user._id,
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
        rentalPreferences: user.rentalPreferences || {
          booksPerMonth: 1,
          prefersTrending: false,
          openToRecommendations: true,
        },
      },
    });
  } catch (error) {
    console.error("❌ Token validation error:", error);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
});

// Get current user - /me endpoint
router.get("/me", async (req, res) => {
  try {
    console.log("👤 /me endpoint called");

    const decoded = verifyToken(req);
    const user = await models.User.findById(
      decoded.id || decoded.userId
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log("✅ Returning user data for:", user.email);

    return res.status(200).json({
      user: {
        _id: user._id,
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
        rentalPreferences: user.rentalPreferences || {
          booksPerMonth: 1,
          prefersTrending: false,
          openToRecommendations: true,
        },
      },
    });
  } catch (error) {
    console.error("❌ /me endpoint error:", error);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
});

// Refresh token
router.post("/refresh-token", async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token is required" });
    }

    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || "refresh-fallback-secret"
    );

    const user = await models.User.findById(decoded.id || decoded.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const accessToken = jwt.sign(
      { id: user._id, email: user.email, role: user.role || "user" },
      process.env.JWT_SECRET || "your-fallback-secret",
      { expiresIn: "24h" }
    );

    return res.status(200).json({
      accessToken,
      message: "Token refreshed successfully",
    });
  } catch (error) {
    console.error("Token refresh error:", error);

    if (error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ message: "Refresh token expired. Please log in again." });
    }

    return res.status(401).json({ message: "Invalid refresh token" });
  }
});

// Google Sign-In
router.post("/google-signin", async (req, res) => {
  try {
    console.log("🔐 Google sign-in attempt");
    const { credential } = req.body;
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const { sub: googleId, email, name, picture } = ticket.getPayload();
    let user = await models.User.findOne({ email });
    let isNewUser = false;

    if (!user) {
      user = new models.User({
        fullName: name,
        email,
        googleId,
        picture,
        isEmailVerified: true,
        role: "user",
        rentalPreferences: {
          booksPerMonth: 1,
          prefersTrending: false,
          openToRecommendations: true,
        },
        password: await bcrypt.hash(Math.random().toString(36).slice(-10), 10),
      });
      await user.save();
      isNewUser = true;
      console.log("✅ New Google user created");
    } else if (!user.googleId) {
      user.googleId = googleId;
      user.isEmailVerified = true;
      if (picture) user.picture = picture;
      await user.save();
      console.log("✅ Existing user linked with Google");
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role || "user" },
      process.env.JWT_SECRET || "your-fallback-secret",
      { expiresIn: "24h" }
    );

    res.status(200).json({
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role || "user",
        hasMembership: user.hasMembership,
      },
      message: isNewUser
        ? "Account created successfully!"
        : "Logged in successfully!",
      redirectToPreferences: isNewUser,
    });
  } catch (error) {
    console.error("❌ Google sign-in error:", error);
    res.status(500).json({ message: "Google authentication failed" });
  }
});

// Update profile
router.put("/update-profile", async (req, res) => {
  try {
    console.log("📝 Update profile request received");

    const decoded = verifyToken(req);
    const user = await models.User.findById(decoded.id || decoded.userId);

    if (!user) {
      console.log("❌ User not found");
      return res.status(404).json({ message: "User not found" });
    }

    console.log("👤 Updating user:", user.email);

    const {
      fullName,
      phone,
      age,
      gender,
      location,
      preferredLanguages,
      favoriteGenres,
    } = req.body;

    if (fullName !== undefined) user.fullName = fullName;
    if (phone !== undefined) user.phone = phone;
    if (age !== undefined) user.age = age;
    if (gender !== undefined) user.gender = gender;
    if (location !== undefined) user.location = location;
    if (preferredLanguages !== undefined) {
      user.preferredLanguages = Array.isArray(preferredLanguages)
        ? preferredLanguages
        : [];
    }
    if (favoriteGenres !== undefined) {
      user.favoriteGenres = Array.isArray(favoriteGenres) ? favoriteGenres : [];
    }

    await user.save();

    console.log("✅ Profile updated successfully");

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
        role: user.role,
      },
    });
  } catch (error) {
    console.error("❌ Update profile error:", error);
    res.status(500).json({ message: error.message });
  }
});

// Alternative profile update endpoint
router.put("/profile", async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const user = await models.User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const {
      fullName,
      phone,
      age,
      gender,
      location,
      preferredLanguages,
      favoriteGenres,
    } = req.body;

    if (fullName !== undefined) user.fullName = fullName;
    if (phone !== undefined) user.phone = phone;
    if (age !== undefined) user.age = age;
    if (gender !== undefined) user.gender = gender;
    if (location !== undefined) user.location = location;
    if (preferredLanguages !== undefined) {
      user.preferredLanguages = Array.isArray(preferredLanguages)
        ? preferredLanguages
        : [];
    }
    if (favoriteGenres !== undefined) {
      user.favoriteGenres = Array.isArray(favoriteGenres) ? favoriteGenres : [];
    }

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
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: error.message });
  }
});

// Get profile
router.get("/profile", async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const user = await models.User.findById(decoded.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ user });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: error.message });
  }
});

console.log("📋 Auth routes loaded successfully");

export default router;
