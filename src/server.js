import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import axios from "axios";
import { connectDB, models } from "../src/database/index.js";
import userRoutes from "../src/api/userRoute.js";
import membershipRoutes from "../src/api/membershipRoute.js";
import bookRoutes from "../src/api/admin/bookRoute.js";
import booksPublicRouter from "../src/api/bookRoute.js";
import membershipPlanRoutes from "./api/membershipPlanRoute.js";
import rentalRoutes from "./api/rentalRoutes.js";
import messageRoutes from "./api/messageRoute.js";
import authRoutes from "./api/authRoutes.js";
import { isAdmin } from "../src/middleware/authMiddleware.js";
const app = express();
const PORT = process.env.PORT || 5000;

app.use((req, res, next) => {
  console.log(
    `${req.method} ${req.originalUrl} from origin: ${req.headers.origin}`
  );
  next();
});

app.use(
  cors({
    origin: function (origin, callback) {
      const allowedOrigins = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
      ];

      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log(`CORS blocked request from origin: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/users/validate-token", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "fallback_secret_key"
    );

    const user = await models.User.findById(
      decoded.id || decoded.userId
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      user: {
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
      },
    });
  } catch (error) {
    console.error("Token validation error:", error.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
});

const adminRoutes = express.Router();

app.post("/api/admin/login", (req, res) => {
  const { email, password } = req.body;
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  console.log("Admin login attempt:", { email, adminEmail: !!adminEmail });

  if (email === adminEmail && password === adminPassword) {
    const token = jwt.sign(
      { userId: "admin", email, role: "admin" },
      process.env.JWT_SECRET || "fallback_secret_key",
      { expiresIn: "24h" }
    );

    console.log("Admin login successful");

    return res.status(200).json({
      user: { id: "admin", email, role: "admin" },
      token,
      message: "Admin login successful",
    });
  }

  console.log("Admin login failed - invalid credentials");
  return res.status(401).json({ message: "Invalid admin credentials" });
});

// Dashboard stats route
adminRoutes.get("/dashboard-stats", isAdmin, async (req, res) => {
  try {
    console.log("Fetching dashboard stats for user:", req.user);

    const totalBooks = await models.Book.countDocuments();
    const activeMembers = await models.User.countDocuments({
      hasMembership: true,
    });
    const pendingApplications = await models.Membership.countDocuments({
      status: "pending",
    });
    const membershipPlans = await models.MembershipPlan.countDocuments();

    const stats = {
      totalBooks,
      activeMembers,
      pendingApplications,
      membershipPlans,
    };

    console.log("Dashboard stats:", stats);

    res.status(200).json(stats);
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({
      message: "Failed to fetch dashboard stats",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Books routes for admin
adminRoutes.get("/books", isAdmin, async (req, res) => {
  try {
    const books = await models.Book.find().sort({ createdAt: -1 });
    res.status(200).json(books);
  } catch (error) {
    console.error("Error fetching books:", error);
    res.status(500).json({ message: "Failed to fetch books" });
  }
});

adminRoutes.post("/books", isAdmin, async (req, res) => {
  try {
    const book = new models.Book(req.body);
    await book.save();
    res.status(201).json({ message: "Book added successfully", book });
  } catch (error) {
    console.error("Error adding book:", error);
    res.status(500).json({ message: "Failed to add book" });
  }
});

// Apply the admin routes
app.use("/api/admin", adminRoutes);

// Updated token validation endpoint with better error handling
// Fixed token validation endpoint in your server.js

app.get("/api/users/validate-token", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "fallback_secret_key"
    );

    console.log("Token decoded:", decoded);

    // Handle admin user - don't query database for admin
    if (decoded.userId === "admin" || decoded.role === "admin") {
      console.log("Validating admin token");
      return res.status(200).json({
        user: {
          id: "admin",
          fullName: "Administrator",
          email: decoded.email || process.env.ADMIN_EMAIL,
          role: "admin",
          hasMembership: false,
          phone: null,
          age: null,
          gender: null,
          location: null,
          preferredLanguages: [],
          favoriteGenres: [],
        },
      });
    }

    // Handle regular user - query database
    console.log(
      "Validating regular user token for ID:",
      decoded.id || decoded.userId
    );

    // Check if the userId is a valid ObjectId before querying
    const userId = decoded.id || decoded.userId;
    if (!userId || !userId.match(/^[0-9a-fA-F]{24}$/)) {
      console.log("Invalid ObjectId format:", userId);
      return res.status(401).json({ message: "Invalid token format" });
    }

    const user = await models.User.findById(userId).select("-password");

    if (!user) {
      console.log("User not found for ID:", userId);
      return res.status(404).json({ message: "User not found" });
    }

    console.log("Regular user validated:", user.email);

    return res.status(200).json({
      user: {
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
      },
    });
  } catch (error) {
    console.error("Token validation error:", error.message);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token has expired" });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token" });
    }

    if (error.name === "CastError") {
      console.log("MongoDB Cast error - likely invalid ObjectId:", error.value);
      return res.status(401).json({ message: "Invalid token format" });
    }

    return res.status(401).json({ message: "Invalid or expired token" });
  }
});

app.use("/api", messageRoutes);
app.use("/api/users", userRoutes);
app.use("/api/memberships", membershipRoutes);
app.use("/api/membership", membershipPlanRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/rentals", rentalRoutes);

app.use("/api/admin/books", bookRoutes);
app.use("/api/books", booksPublicRouter);

adminRoutes.post("/login", (req, res) => {
  const { email, password } = req.body;
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (email === adminEmail && password === adminPassword) {
    const token = jwt.sign(
      { userId: "admin", email, role: "admin" },
      process.env.JWT_SECRET || "fallback_secret_key",
      { expiresIn: "24h" }
    );
    return res.status(200).json({
      user: { id: "admin", email, role: "admin" },
      token,
      message: "Admin login successful",
    });
  }
  return res.status(401).json({ message: "Invalid admin credentials" });
});
// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    message: "An unexpected error occurred",
    error: process.env.NODE_ENV === "production" ? null : err.message,
  });
});

// Handle 404 - Route not found
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Start Server
const startServer = async () => {
  try {
    console.log("Connecting to DB...");
    await connectDB();
    console.log("DB connected successfully.");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Server ready at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Error starting server:", error.message);
    process.exit(1);
  }
};

startServer();
