import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import serverless from "serverless-http";
import { connectDB, models } from "./database/index.js";

// Import routes
import userRoutes from "./api/userRoute.js";
import membershipRoutes from "./api/membershipRoute.js";
import adminBookRoutes from "./api/admin/bookRoute.js";
import booksPublicRouter from "./api/bookRoute.js";
import membershipPlanRoutes from "./api/membershipPlanRoute.js";
import rentalRoutes from "./api/rentalRoutes.js";
import messageRoutes from "./api/messageRoute.js";
import authRoutes from "./api/authRoutes.js";
import adminRoutes from "./api/admin/login.js";
const app = express();

// ==================== MIDDLEWARE ====================

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
        "https://bookhubrentalplatform.vercel.app",
      ];
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log(`CORS blocked request from origin: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==================== ROUTES ====================

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "BookHub Server is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin/books", adminBookRoutes);
app.use("/api/users", userRoutes);
app.use("/api/memberships", membershipRoutes);
app.use("/api/membership", membershipPlanRoutes);
app.use("/api/books", booksPublicRouter);
app.use("/api/rentals", rentalRoutes);
app.use("/api/messages", messageRoutes);

// ==================== ERROR HANDLING ====================

app.use((req, res) => {
  res.status(404).json({ message: "Route not found", path: req.originalUrl });
});

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(err.status || 500).json({
    message: err.message || "An unexpected error occurred",
    error: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

// ==================== DATABASE CONNECTION ====================

let isConnected = false;
async function ensureDBConnection() {
  if (!isConnected) {
    await connectDB();
    isConnected = true;
  }
}

// Connect DB once when the Lambda starts
await ensureDBConnection();

// ==================== SERVERLESS HANDLER ====================

const handler = serverless(app);
export { handler };
export default app;

// ==================== LOCAL DEVELOPMENT MODE ====================

if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;
  ensureDBConnection().then(() => {
    app.listen(PORT, () => {
      console.log(
        `🚀 BookHub server running locally on http://localhost:${PORT}`
      );
    });
  });
}
