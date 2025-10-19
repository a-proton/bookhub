// Create this new utility file for authentication helpers
import jwt from "jsonwebtoken"
import { OAuth2Client } from "google-auth-library"

// Function to generate a token for a user
export const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role || "user",
    },
    process.env.JWT_SECRET || "fallback_secret_key",
    { expiresIn: "1d" },
  )
}

// Function to verify a token
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || "fallback_secret_key")
  } catch (error) {
    console.error("Token verification error:", error)
    return null
  }
}

// Function to decode a token without verification
export const decodeToken = (token) => {
  try {
    return jwt.decode(token)
  } catch (error) {
    console.error("Token decode error:", error)
    return null
  }
}

// Function to generate a Google OAuth URL
export const generateGoogleOAuthUrl = () => {
  const client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || "http://localhost:5000/api/auth/google/callback",
  )

  return client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/userinfo.profile", "https://www.googleapis.com/auth/userinfo.email"],
    prompt: "consent",
  })
}
