// // src/routes/authRoutes.js
// import express from "express";
// import bcrypt from "bcrypt";
// import { models } from "../database/index.js"; // Adjust the path as needed
// import auth from "../middleware/auth.js";

// const router = express.Router();

// // Login route
// router.post("/login", async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     console.log("Login attempt for:", email);

//     if (!email || !password) {
//       return res
//         .status(400)
//         .json({ message: "Email and password are required" });
//     }

//     // Find the user by email
//     const user = await models.User.findOne({ email });

//     if (!user) {
//       console.log("User not found:", email);
//       return res.status(404).json({ message: "User not found" });
//     }

//     if (!user.password) {
//       console.log("User has no password (likely OAuth user):", email);
//       return res.status(403).json({
//         message: "This account uses Google Sign-In. Please log in with Google.",
//       });
//     }

//     // Verify password
//     const isMatch = await bcrypt.compare(password, user.password);

//     if (!isMatch) {
//       console.log("Password mismatch for:", email);
//       return res.status(401).json({ message: "Invalid credentials" });
//     }

//     // Generate tokens
//     const accessToken = auth.generateAccessToken(
//       user._id,
//       user.email,
//       user.role || "user"
//     );

//     const refreshToken = auth.generateRefreshToken(
//       user._id,
//       user.email,
//       user.role || "user"
//     );

//     console.log("Login successful for:", email);

//     // Return the tokens and user data
//     res.status(200).json({
//       accessToken,
//       refreshToken,
//       user: {
//         id: user._id,
//         fullName: user.fullName || user.name,
//         email: user.email,
//         role: user.role || "user",
//         hasMembership: user.hasMembership || false,
//         // Add other user fields as needed
//       },
//     });
//   } catch (error) {
//     console.error("Login error:", error);
//     res
//       .status(500)
//       .json({ message: "An unexpected error occurred during login" });
//   }
// });

// // User profile routes
// router.get("/me", auth.isAuthenticated, async (req, res) => {
//   try {
//     const user = await models.User.findById(req.user.userId).select(
//       "-password"
//     );

//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     res.status(200).json({
//       user: {
//         id: user._id,
//         fullName: user.fullName || user.name,
//         email: user.email,
//         phone: user.phone,
//         age: user.age,
//         gender: user.gender,
//         location: user.location,
//         preferredLanguages: user.preferredLanguages || [],
//         favoriteGenres: user.favoriteGenres || [],
//         role: user.role || "user",
//         hasMembership: user.hasMembership || false,
//         preferredBookFormat: user.preferredBookFormat,
//         rentalPreferences: user.rentalPreferences,
//       },
//     });
//   } catch (error) {
//     console.error("Get user profile error:", error);
//     res.status(500).json({ message: "Failed to retrieve user profile" });
//   }
// });

// // Update profile route
// router.put("/update-profile", auth.isAuthenticated, async (req, res) => {
//   try {
//     const user = await models.User.findById(req.user.userId);

//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     const {
//       fullName,
//       phone,
//       age,
//       gender,
//       location,
//       preferredLanguages,
//       favoriteGenres,
//     } = req.body;

//     // Update user fields
//     if (fullName) user.fullName = fullName;
//     if (phone !== undefined) user.phone = phone;
//     if (age !== undefined) user.age = age;
//     if (gender) user.gender = gender;
//     if (location) user.location = location;
//     if (preferredLanguages) user.preferredLanguages = preferredLanguages;
//     if (favoriteGenres) user.favoriteGenres = favoriteGenres;

//     await user.save();

//     res.status(200).json({
//       message: "Profile updated successfully",
//       user: {
//         id: user._id,
//         fullName: user.fullName,
//         email: user.email,
//         phone: user.phone,
//         age: user.age,
//         gender: user.gender,
//         location: user.location,
//         preferredLanguages: user.preferredLanguages,
//         favoriteGenres: user.favoriteGenres,
//         hasMembership: user.hasMembership,
//         role: user.role,
//       },
//     });
//   } catch (error) {
//     console.error("Update profile error:", error);
//     res.status(500).json({ message: "Failed to update user profile" });
//   }
// });

// // For compatibility with different frontend URLs
// router.put("/profile", auth.isAuthenticated, async (req, res) => {
//   try {
//     // Same implementation as update-profile
//     const user = await models.User.findById(req.user.userId);

//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     const {
//       fullName,
//       phone,
//       age,
//       gender,
//       location,
//       preferredLanguages,
//       favoriteGenres,
//     } = req.body;

//     if (fullName) user.fullName = fullName;
//     if (phone !== undefined) user.phone = phone;
//     if (age !== undefined) user.age = age;
//     if (gender) user.gender = gender;
//     if (location) user.location = location;
//     if (preferredLanguages) user.preferredLanguages = preferredLanguages;
//     if (favoriteGenres) user.favoriteGenres = favoriteGenres;

//     await user.save();

//     res.status(200).json({
//       message: "Profile updated successfully",
//       user: {
//         id: user._id,
//         fullName: user.fullName,
//         email: user.email,
//         phone: user.phone,
//         age: user.age,
//         gender: user.gender,
//         location: user.location,
//         preferredLanguages: user.preferredLanguages,
//         favoriteGenres: user.favoriteGenres,
//         hasMembership: user.hasMembership,
//         role: user.role,
//       },
//     });
//   } catch (error) {
//     console.error("Update profile error:", error);
//     res.status(500).json({ message: "Failed to update user profile" });
//   }
// });
// // Add a token refresh endpoint
// router.post("/refresh-token", async (req, res) => {
//   try {
//     const { refreshToken } = req.body;

//     if (!refreshToken) {
//       return res.status(400).json({ message: "Refresh token is required" });
//     }

//     // Verify the refresh token
//     const decoded = auth.verifyRefreshToken(refreshToken);

//     // Generate a new access token
//     const accessToken = auth.generateAccessToken(
//       decoded.userId,
//       decoded.email,
//       decoded.role
//     );

//     res.status(200).json({ accessToken });
//   } catch (error) {
//     console.error("Token refresh error:", error);

//     if (error.name === "TokenExpiredError") {
//       return res
//         .status(401)
//         .json({ message: "Refresh token expired. Please log in again." });
//     }

//     res.status(401).json({ message: "Invalid refresh token" });
//   }
// });

// export default router;

// src/api/authRoutes.js

import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { models } from "../database/index.js";
import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const router = express.Router();

// --- AUTHENTICATION ROUTES ---

// Signup
router.post("/signup", async (req, res) => {
  try {
    const { fullName, email, password } = req.body;
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    const existingUser = await models.User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User with this email already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new models.User({
      ...req.body,
      password: hashedPassword,
      role: "user",
    });
    await user.save();
    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }
    const user = await models.User.findOne({ email });
    if (!user || !user.password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );
    const refreshToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );
    res.status(200).json({
      token,
      refreshToken,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        hasMembership: user.hasMembership,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error during login" });
  }
});

// Google Sign-In
router.post("/google-signin", async (req, res) => {
  try {
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
      });
      await user.save();
      isNewUser = true;
    }
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || "ahsbduysabkajs",
      { expiresIn: "24h" }
    );
    res.status(200).json({
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
      redirectToPreferences: isNewUser,
    });
  } catch (error) {
    res.status(500).json({ message: "Google authentication failed" });
  }
});
// Update user profile endpoint
router.put("/update-profile", async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const {
      fullName,
      phone,
      age,
      gender,
      location,
      preferredLanguages,
      favoriteGenres,
    } = req.body;

    console.log("Updating profile for user:", userId);
    console.log("Update data:", req.body);

    // Find and update the user
    const updatedUser = await models.User.findByIdAndUpdate(
      userId,
      {
        $set: {
          fullName,
          phone,
          age,
          gender,
          location,
          preferredLanguages: Array.isArray(preferredLanguages)
            ? preferredLanguages
            : [],
          favoriteGenres: Array.isArray(favoriteGenres) ? favoriteGenres : [],
        },
      },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log("Profile updated successfully:", updatedUser);

    res.status(200).json({
      message: "Profile updated successfully",
      user: {
        id: updatedUser._id,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        phone: updatedUser.phone,
        age: updatedUser.age,
        gender: updatedUser.gender,
        location: updatedUser.location,
        preferredLanguages: updatedUser.preferredLanguages || [],
        favoriteGenres: updatedUser.favoriteGenres || [],
        role: updatedUser.role || "user",
        hasMembership: updatedUser.hasMembership,
      },
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({
      message: "Failed to update profile",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
});

// Get user preferences endpoint (if you want a separate endpoint)
router.get("/preferences", async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;

    const user = await models.User.findById(userId).select(
      "age gender location preferredLanguages favoriteGenres"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      age: user.age,
      gender: user.gender,
      location: user.location,
      preferredLanguages: user.preferredLanguages || [],
      favoriteGenres: user.favoriteGenres || [],
    });
  } catch (error) {
    console.error("Error fetching preferences:", error);
    res.status(500).json({ message: "Failed to fetch preferences" });
  }
});
// Refresh Token
router.post("/refresh-token", async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.sendStatus(401);

  jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    const accessToken = jwt.sign(
      { userId: user.userId, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );
    res.json({ accessToken: accessToken });
  });
});

export default router;
