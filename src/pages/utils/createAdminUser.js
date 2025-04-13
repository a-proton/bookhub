// This is a utility script to create an admin user
// You can run this script once to create your first admin user

import mongoose from "mongoose"
import bcrypt from "bcrypt"
import dotenv from "dotenv"
import User from "../database/schema/userSchema.js"

dotenv.config()

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/bookhub")
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => {
    console.error("MongoDB connection error:", err)
    process.exit(1)
  })

// Admin user details - change these to your preferred values
const adminUser = {
  fullName: "Admin User",
  email: "admin@example.com",
  password: "Admin@123", // You should use a strong password
  role: "admin",
}

async function createAdminUser() {
  try {
    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: adminUser.email })

    if (existingAdmin) {
      console.log("Admin user already exists")

      // Update role to admin if not already
      if (existingAdmin.role !== "admin") {
        existingAdmin.role = "admin"
        await existingAdmin.save()
        console.log("Updated user to admin role")
      }
    } else {
      // Hash password
      const salt = await bcrypt.genSalt(10)
      const hashedPassword = await bcrypt.hash(adminUser.password, salt)

      // Create new admin user
      const newAdmin = new User({
        fullName: adminUser.fullName,
        email: adminUser.email,
        password: hashedPassword,
        role: "admin",
        isEmailVerified: true,
      })

      await newAdmin.save()
      console.log("Admin user created successfully")
    }

    // Display all admin users
    const admins = await User.find({ role: "admin" }).select("fullName email")
    console.log("Current admin users:", admins)
  } catch (error) {
    console.error("Error creating admin user:", error)
  } finally {
    // Close the database connection
    mongoose.connection.close()
  }
}

// Run the function
createAdminUser()
