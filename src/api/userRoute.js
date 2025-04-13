import express from "express"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { models } from "../database/index.js"
import { OAuth2Client } from "google-auth-library"

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
const router = express.Router()

// Utility functions
const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
const validatePassword = (password) => password.length >= 8

const verifyToken = (req) => {
  const token = req.headers.authorization?.split(" ")[1]
  if (!token) throw new Error("No authentication token provided")
  return jwt.verify(token, process.env.JWT_SECRET || "your-fallback-secret")
}

// Signup
router.post("/signup", async (req, res) => {
  try {
    console.log("Signup request:", req.body)
    const {
      fullName, email, phone, password, age, gender,
      location, preferredLanguages, favoriteGenres,
      preferredBookFormat, rentalPreferences
    } = req.body

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "Missing required fields" })
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" })
    }

    if (!validatePassword(password)) {
      return res.status(400).json({ message: "Password must be at least 8 characters" })
    }

    const existingUser = await models.User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: "User with this email already exists" })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

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
      }
    })

    await user.save()
    res.status(201).json({ message: "User created successfully" })
  } catch (error) {
    console.error("Signup error:", error)
    res.status(500).json({ message: error.message })
  }
})

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body

    const user = await models.User.findOne({ email })
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    if (!user.password) {
      return res.status(403).json({ message: "This account is registered via Google Sign-In" })
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role || "user" },
      process.env.JWT_SECRET || "your-fallback-secret",
      { expiresIn: "24h" }
    )

    res.status(200).json({
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role || "user",
        hasMembership: user.hasMembership,
      }
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({ message: error.message })
  }
})

// Google Sign-In (Client-Side)
router.post("/google-signin", async (req, res) => {
  try {
    const { credential } = req.body
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    })

    const { sub: googleId, email, name, picture } = ticket.getPayload()
    let user = await models.User.findOne({ email })
    let isNewUser = false

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
          openToRecommendations: true
        },
        password: await bcrypt.hash(Math.random().toString(36).slice(-10), 10),
      })
      await user.save()
      isNewUser = true
    } else if (!user.googleId) {
      user.googleId = googleId
      user.isEmailVerified = true
      if (picture) user.picture = picture
      await user.save()
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role || "user" },
      process.env.JWT_SECRET || "your-fallback-secret",
      { expiresIn: "24h" }
    )

    res.status(200).json({
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role || "user",
        hasMembership: user.hasMembership,
      },
      message: isNewUser ? "Account created successfully!" : "Logged in successfully!",
      redirectToPreferences: isNewUser,
    })
  } catch (error) {
    console.error("Google sign-in error:", error)
    res.status(500).json({ message: "Google authentication failed" })
  }
})

// Google OAuth Callback
router.get("/auth/google/callback", async (req, res) => {
  try {
    const { code } = req.query
    if (!code) return res.status(400).json({ message: "Authorization code not provided" })

    const { tokens } = await client.getToken({
      code,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI || "http://localhost:5000/api/auth/google/callback",
    })

    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    })

    const { sub: googleId, email, name, picture } = ticket.getPayload()
    let user = await models.User.findOne({ email })
    let isNewUser = false

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
          openToRecommendations: true
        },
        password: await bcrypt.hash(Math.random().toString(36).slice(-10), 10),
      })
      await user.save()
      isNewUser = true
    } else if (!user.googleId) {
      user.googleId = googleId
      user.isEmailVerified = true
      if (picture) user.picture = picture
      await user.save()
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role || "user" },
      process.env.JWT_SECRET || "your-fallback-secret",
      { expiresIn: "24h" }
    )

    const redirectUrl = isNewUser
      ? `${process.env.FRONTEND_URL || "http://localhost:3000"}/complete-profile?token=${token}`
      : `${process.env.FRONTEND_URL || "http://localhost:3000"}/login?token=${token}`

    res.redirect(redirectUrl)
  } catch (error) {
    console.error("Google OAuth callback error:", error)
    res.redirect(`${process.env.FRONTEND_URL || "http://localhost:3000"}/login?error=Authentication failed`)
  }
})

// Get profile
router.get("/profile", async (req, res) => {
  try {
    const decoded = verifyToken(req)
    const user = await models.User.findById(decoded.id).select("-password")
    if (!user) return res.status(404).json({ message: "User not found" })

    res.status(200).json({ user })
  } catch (error) {
    console.error("Get profile error:", error)
    res.status(500).json({ message: error.message })
  }
})

// Update profile
router.put("/profile", async (req, res) => {
  try {
    const decoded = verifyToken(req)
    const user = await models.User.findById(decoded.id)
    if (!user) return res.status(404).json({ message: "User not found" })

    const { fullName, phone, age, gender, location, preferredLanguages, favoriteGenres } = req.body

    if (fullName) user.fullName = fullName
    if (phone !== undefined) user.phone = phone
    if (age !== undefined) user.age = age
    if (gender) user.gender = gender
    if (location) user.location = location
    if (preferredLanguages) user.preferredLanguages = preferredLanguages
    if (favoriteGenres) user.favoriteGenres = favoriteGenres

    await user.save()

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
    })
  } catch (error) {
    console.error("Update profile error:", error)
    res.status(500).json({ message: error.message })
  }
})

 

export default router;