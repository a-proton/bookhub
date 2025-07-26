import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

// --- CRITICAL: Check for secrets at startup ---
// This will make the server crash immediately with a clear error if the .env file is wrong,
// which is much better than crashing during a user request.
if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
  console.error(
    "FATAL ERROR: JWT_SECRET and JWT_REFRESH_SECRET must be defined in your .env file."
  );
  process.exit(1); // Exit the process with an error code
}

// Function to generate a short-lived access token
const generateAccessToken = (userId, email, role) => {
  const payload = { userId, email, role };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" }); // Expires in 1 hour
};

// Function to generate a long-lived refresh token
const generateRefreshToken = (userId, email, role) => {
  const payload = { userId, email, role };
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: "7d" }); // Expires in 7 days
};

// Function to verify a refresh token
const verifyRefreshToken = (token) => {
  return jwt.verify(token, JWT_REFRESH_SECRET);
};

// Middleware to protect routes by requiring authentication
const isAuthenticated = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "Authentication token is required" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Attach user info to the request
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

// Export all functions as a single default object
export default {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  isAuthenticated,
};
