import express from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { sendRentalConfirmation, validatePhoneNumber } from "../lib/smsService.js";
import User from "../database/schema/userSchema.js";
import Book from "../database/schema/bookSchema.js";
import Rental from "../database/schema/rentalSchema.js";

const router = express.Router();

// Middleware to verify token
const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    if (!authHeader) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    const token = authHeader.replace("Bearer ", "");
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-fallback-secret");
        
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Token verification error:", error);
    res.status(401).json({ message: "Invalid token" });
  }
};

// Create new rental
router.post("/", verifyToken, async (req, res) => {
  try {
    const { book, dueDate, quantity = 1, phone } = req.body;
    const userId = req.user.id;
        
    // Validate request
    if (!book) {
      return res.status(400).json({ message: "Book ID is required" });
    }
        
    if (!dueDate) {
      return res.status(400).json({ message: "Due date is required" });
    }

    // Ensure book ID is valid ObjectId
    if (!mongoose.isValidObjectId(book)) {
      return res.status(400).json({ message: "Invalid book ID format" });
    }
        
    // Validate phone number if provided
    if (phone && !validatePhoneNumber(phone)) {
      return res.status(400).json({ message: "Invalid phone number format" });
    }
        
    // Get user info
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
        
    // Use provided phone or user's phone from profile
    const contactPhone = phone || user.phone;
        
    // Get book details and verify availability
    const bookDetails = await Book.findById(book);
        
    if (!bookDetails) {
      return res.status(404).json({ message: "Book not found" });
    }
        
    // Check if book is available for rental
    if (!bookDetails.isAvailable) {
      return res.status(400).json({ message: "Book is not available for rental" });
    }
    
    // Check if enough copies are available
    if (bookDetails.availableCopies !== undefined && bookDetails.availableCopies < quantity) {
      return res.status(400).json({ 
        message: `Insufficient copies available. Requested: ${quantity}, Available: ${bookDetails.availableCopies}` 
      });
    }

    // Create rental records - one for each quantity
    const rentals = [];
    
    for (let i = 0; i < quantity; i++) {
      const rental = new Rental({
        user: userId,
        book: book,
        issueDate: new Date(),
        dueDate: new Date(dueDate),
        status: "active"
      });
            
      // Save rental
      await rental.save();
      rentals.push(rental);
    }
        
    // Update book availability status if needed
    if (bookDetails.availableCopies !== undefined) {
      await Book.findByIdAndUpdate(book, {
        $inc: { availableCopies: -quantity },
        isAvailable: (bookDetails.availableCopies - quantity) > 0
      });
    }
        
    // Send SMS notification (non-blocking)
    if (contactPhone) {
      sendRentalConfirmation(contactPhone, bookDetails.title, dueDate)
        .then(success => {
          if (!success) {
            console.warn(`SMS notification failed for rental ${rentals[0]._id}`);
          }
        })
        .catch(err => {
          console.error("SMS sending error:", err);
        });
    }
        
    // Return success response
    res.status(201).json({
      message: "Rental created successfully",
      rentals: rentals.map(rental => ({
        id: rental._id,
        book: bookDetails.title,
        dueDate: rental.dueDate.toISOString(),
        status: rental.status
      }))
    });
      
  } catch (error) {
    console.error("Create rental error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get user's rental history
router.get("/history", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
        
    const rentals = await Rental.find({ user: userId })
      .populate('book')
      .sort({ issueDate: -1 });
          
    res.status(200).json(rentals);
  } catch (error) {
    console.error("Get rental history error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Add a route to get active rentals
router.get("/active", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
        
    const rentals = await Rental.find({ 
      user: userId,
      status: "active" 
    })
      .populate('book')
      .sort({ dueDate: 1 });
          
    res.status(200).json(rentals);
  } catch (error) {
    console.error("Get active rentals error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;