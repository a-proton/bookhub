import express from "express";
import Book from '../../src/database/schema/bookSchema.js';
import Rental from '../../src/database/schema/rentalSchema.js';
import User from '../../src/database/schema/userSchema.js';
import auth from "../middleware/auth.js";
import mongoose from "mongoose";
import { sendRentalConfirmationEmail } from "../lib/emailService.js";

const router = express.Router();

// Enhanced debugging middleware
router.use((req, res, next) => {
  console.log("Rental API Request:", {
    method: req.method,
    path: req.path,
    params: req.params,
    body: req.body
  });
  next();
});

// Check book availability for rental
router.get("/check-availability/:bookId", async (req, res) => {
  try {
    const bookId = req.params.bookId;
    
    // Validate if bookId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      console.log(`Invalid bookId format: ${bookId}`);
      return res.status(400).json({ 
        available: false, 
        message: "Invalid book ID format" 
      });
    }
    
    console.log(`Checking availability for book ID: ${bookId}`);
    
    // Check if book exists and has stock
    const book = await Book.findById(bookId);
    console.log("Book found:", book ? "Yes" : "No");
    
    if (!book) {
      return res.status(404).json({ available: false, message: "Book not found" });
    }
    
    if (book.stockQuantity <= 0) {
      return res.json({ available: false, message: "Book is out of stock" });
    }
    
    // Check if book is already marked as not available for rental
    if (book.isRentalDisabled) {
      return res.json({ available: false, message: "This book is not available for rental" });
    }
    
    // Check if there are any active rentals for this book that exceed the available stock
    const activeRentals = await Rental.countDocuments({
      bookId: bookId,
      isReturned: false
    });
    
    console.log(`Active rentals for book ${bookId}: ${activeRentals}, Stock quantity: ${book.stockQuantity}`);
    
    // If all copies are out for rental
    if (activeRentals >= book.stockQuantity) {
      return res.json({ available: false, message: "All copies are currently rented out" });
    }
    
    return res.json({ available: true, message: "Book is available for rental" });
    
  } catch (error) {
    console.error("Error checking book availability:", error);
    res.status(500).json({ available: false, message: "Server error", error: error.message });
  }
});

// Create a new rental (requires authentication)
router.post("/", auth.isAuthenticated, async (req, res) => {
  try {
    const { bookId, rentalDuration } = req.body;
    const userId = req.user._id; // Using _id from req.user
    
    console.log(`Creating rental - User: ${userId}, Book: ${bookId}, Duration: ${rentalDuration} days`);
    
    // Validate if bookId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid book ID format" 
      });
    }
    
    // Check if book exists and is available
    const book = await Book.findById(bookId);
    console.log("Book found for rental:", book ? "Yes" : "No");
    
    if (!book) {
      console.log(`Book with ID ${bookId} not found in database`);
      return res.status(404).json({ success: false, message: "Book not found" });
    }
    
    if (book.stockQuantity <= 0) {
      return res.status(400).json({ success: false, message: "Book is out of stock" });
    }
    
    if (book.isRentalDisabled) {
      return res.status(400).json({ success: false, message: "This book is not available for rental" });
    }
    
    // Calculate rental end date (default 14 days if not specified)
    const durationDays = rentalDuration || 14;
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + parseInt(durationDays));
    
    // Create rental record
    const rental = new Rental({
      userId,
      bookId,
      startDate,
      dueDate: endDate,
      rentalPrice: book.price * 0.3, // 30% of book price
      isReturned: false
    });
    
    await rental.save();
    console.log(`Rental created with ID: ${rental._id}`);
    
    // Decrease book stock
    book.stockQuantity -= 1;
    await book.save();
    console.log(`Book stock updated. New quantity: ${book.stockQuantity}`);
    
    res.status(201).json({ 
      success: true, 
      message: "Rental created successfully", 
      rental 
    });
    
  } catch (error) {
    console.error("Error creating rental:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

// New endpoint for batch rental creation with email notification
router.post("/batch", auth.isAuthenticated, async (req, res) => {
  try {
    const { items, rentalDuration } = req.body;
    const userId = req.user._id;
    
    console.log(`Creating batch rental - User: ${userId}, Items count: ${items.length}`);
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No rental items provided"
      });
    }
    
    // Get user information for email
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    const createdRentals = [];
    const rentedBooks = [];
    
    // Process each rental item
    for (const item of items) {
      const { bookId, quantity = 1 } = item;
      
      // Validate bookId
      if (!mongoose.Types.ObjectId.isValid(bookId)) {
        console.log(`Skipping invalid bookId: ${bookId}`);
        continue;
      }
      
      // Check if book exists and is available
      const book = await Book.findById(bookId);
      if (!book || book.stockQuantity <= 0 || book.isRentalDisabled) {
        console.log(`Skipping unavailable book ${bookId}`);
        continue;
      }
      
      // Check available quantity
      const availableQuantity = Math.min(book.stockQuantity, quantity);
      if (availableQuantity <= 0) continue;
      
      // Calculate rental end date
      const durationDays = rentalDuration || 10;
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + parseInt(durationDays));
      
      // Create rentals for the specified quantity
      for (let i = 0; i < availableQuantity; i++) {
        const rental = new Rental({
          userId,
          bookId,
          startDate,
          dueDate: endDate,
          rentalPrice: book.price * 0.3, // 30% of book price
          isReturned: false
        });
        
        await rental.save();
        createdRentals.push(rental);
        rentedBooks.push(book);
        
        // Decrease book stock
        book.stockQuantity -= 1;
      }
      
      await book.save();
    }
    
    if (createdRentals.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No rentals could be created"
      });
    }
    
    // Send confirmation email
    try {
      await sendRentalConfirmationEmail(user, createdRentals, rentedBooks);
      console.log('Rental confirmation email sent to user:', user.email);
    } catch (emailError) {
      console.error('Failed to send email but rentals were created:', emailError);
      // Continue with the response even if email fails
    }
    
    res.status(201).json({
      success: true,
      message: `${createdRentals.length} rentals created successfully`,
      rentals: createdRentals
    });
    
  } catch (error) {
    console.error("Error creating batch rentals:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

// Get user's rental history
router.get("/history", auth.isAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id;
    console.log(`Fetching rental history for user: ${userId}`);
    
    const rentals = await Rental.find({ userId })
      .populate('bookId')
      .sort({ startDate: -1 });
      
    console.log(`Found ${rentals.length} rentals for user`);
    res.json(rentals);
    
  } catch (error) {
    console.error("Error fetching rental history:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Return a rented book
router.post("/return/:rentalId", auth.isAuthenticated, async (req, res) => {
  try {
    const rentalId = req.params.rentalId;
    const userId = req.user._id;
    
    console.log(`Processing return for rental: ${rentalId} by user: ${userId}`);
    
    // Validate if rentalId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(rentalId)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid rental ID format" 
      });
    }
    
    const rental = await Rental.findById(rentalId);
    if (!rental) {
      console.log(`Rental with ID ${rentalId} not found`);
      return res.status(404).json({ success: false, message: "Rental not found" });
    }
    
    if (rental.userId.toString() !== userId.toString()) {
      console.log(`Authorization failed: Rental belongs to ${rental.userId}, not ${userId}`);
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }
    
    if (rental.isReturned) {
      return res.status(400).json({ success: false, message: "Book already returned" });
    }
    
    // Mark as returned and set return date
    rental.isReturned = true;
    rental.returnDate = new Date();
    
    // Calculate late fees if any
    if (rental.returnDate > rental.dueDate) {
      const daysLate = Math.ceil((rental.returnDate - rental.dueDate) / (1000 * 60 * 60 * 24));
      rental.lateFee = daysLate * 10; // Rs.10 per day late fee
      console.log(`Late fee applied: ${rental.lateFee} (${daysLate} days late)`);
    }
    
    await rental.save();
    console.log(`Rental ${rentalId} marked as returned`);
    
    // Increase book stock
    const book = await Book.findById(rental.bookId);
    if (book) {
      book.stockQuantity += 1;
      await book.save();
      console.log(`Book stock increased. New quantity: ${book.stockQuantity}`);
    } else {
      console.log(`Warning: Book with ID ${rental.bookId} not found when processing return`);
    }
    
    res.json({ 
      success: true, 
      message: "Book returned successfully", 
      rental 
    });
    
  } catch (error) {
    console.error("Error returning book:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

export default router;