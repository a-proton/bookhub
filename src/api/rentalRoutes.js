import express from "express";
import mongoose from "mongoose";

// --- Model Imports ---
// Correctly import the specific Mongoose models used in this file.
import Book from "../../src/database/schema/bookSchema.js";
import Rental from "../../src/database/schema/rentalSchema.js";
import User from "../../src/database/schema/userSchema.js";

// --- Middleware and Service Imports ---
// Import the single, standardized authentication middleware.
import { isAuthenticated } from "../middleware/authMiddleware.js";
import { sendRentalConfirmationEmail } from "../lib/emailService.js";

const router = express.Router();

// This middleware is helpful for debugging and will log every request to this router.
router.use((req, res, next) => {
  console.log("--- New Rental API Request ---");
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);

  // Fix: Check if req.body exists and is an object before using Object.keys
  if (
    req.body &&
    typeof req.body === "object" &&
    Object.keys(req.body).length > 0
  ) {
    console.log("Request Body:", req.body);
  }

  console.log("User from token:", req.user);
  next();
});

//==============================================================================
// CHECK BOOK AVAILABILITY FOR RENTAL
//==============================================================================
router.get("/check-availability/:bookId", async (req, res) => {
  try {
    const bookId = req.params.bookId;

    // Validate if bookId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      console.log(`Invalid bookId format: ${bookId}`);
      return res.status(400).json({
        available: false,
        message: "Invalid book ID format",
      });
    }

    console.log(`Checking availability for book ID: ${bookId}`);

    // Check if book exists and has stock
    const book = await Book.findById(bookId);
    console.log("Book found:", book ? "Yes" : "No");

    if (!book) {
      return res
        .status(404)
        .json({ available: false, message: "Book not found" });
    }

    if (book.stockQuantity <= 0) {
      return res.json({ available: false, message: "Book is out of stock" });
    }

    // Check if book is already marked as not available for rental
    if (book.isRentalDisabled) {
      return res.json({
        available: false,
        message: "This book is not available for rental",
      });
    }

    // Check if there are any active rentals for this book that exceed the available stock
    const activeRentals = await Rental.countDocuments({
      bookId: bookId,
      isReturned: false,
    });

    console.log(
      `Active rentals for book ${bookId}: ${activeRentals}, Stock quantity: ${book.stockQuantity}`
    );

    // If all copies are out for rental
    if (activeRentals >= book.stockQuantity) {
      return res.json({
        available: false,
        message: "All copies are currently rented out",
      });
    }

    return res.json({
      available: true,
      message: "Book is available for rental",
    });
  } catch (error) {
    console.error("Error checking book availability:", error);
    res.status(500).json({
      available: false,
      message: "Server error",
      error: error.message,
    });
  }
});

//==============================================================================
// BATCH RENTAL CREATION (FOR CHECKOUT)
//==============================================================================
router.post("/batch", isAuthenticated, async (req, res) => {
  try {
    const { items, rentalDuration } = req.body;
    // Handle different possible user ID fields from the authentication middleware
    const userId = req.user.userId || req.user.user_id || req.user._id;

    console.log("Authenticated user:", req.user);
    console.log("Extracted userId:", userId);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User ID not found in authentication token.",
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No rental items were provided." });
    }

    const user = await User.findById(userId);
    if (!user) {
      console.log("User not found in database:", userId);
      return res.status(404).json({
        success: false,
        message: "Authenticated user could not be found in database.",
      });
    }

    const createdRentals = [];
    const rentedBooksDetails = [];
    const unavailableBooks = [];

    for (const item of items) {
      try {
        // Validate bookId
        if (!mongoose.Types.ObjectId.isValid(item.bookId)) {
          console.warn(`Invalid bookId format: ${item.bookId}`);
          unavailableBooks.push({
            bookId: item.bookId,
            reason: "Invalid ID format",
          });
          continue;
        }

        const book = await Book.findById(item.bookId);
        if (!book) {
          console.warn(`Book not found: ${item.bookId}`);
          unavailableBooks.push({
            bookId: item.bookId,
            reason: "Book not found",
          });
          continue;
        }

        if (book.stockQuantity < 1) {
          console.warn(`Book out of stock: ${item.bookId}`);
          unavailableBooks.push({
            bookId: item.bookId,
            reason: "Out of stock",
            title: book.title,
          });
          continue;
        }

        if (book.isRentalDisabled) {
          console.warn(`Book rental disabled: ${item.bookId}`);
          unavailableBooks.push({
            bookId: item.bookId,
            reason: "Rental disabled",
            title: book.title,
          });
          continue;
        }

        // Calculate rental dates
        const startDate = new Date();
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + (rentalDuration || 14));

        // Create rental record with proper pricing
        const rental = new Rental({
          userId,
          bookId: item.bookId,
          startDate,
          dueDate,
          rentalPrice: book.price * 0.3, // 30% of book price as rental fee
          isReturned: false,
        });

        await rental.save();
        createdRentals.push(rental);
        rentedBooksDetails.push(book);

        // Decrease book stock
        await Book.findByIdAndUpdate(book._id, { $inc: { stockQuantity: -1 } });

        console.log(`Successfully created rental for book: ${book.title}`);
      } catch (itemError) {
        console.error(`Error processing item ${item.bookId}:`, itemError);
        unavailableBooks.push({
          bookId: item.bookId,
          reason: "Processing error",
          error: itemError.message,
        });
      }
    }

    if (createdRentals.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "No books could be rented. They may be out of stock or unavailable.",
        unavailableBooks,
      });
    }

    // Send confirmation email (don't block the response if this fails)
    try {
      await sendRentalConfirmationEmail(
        user,
        createdRentals,
        rentedBooksDetails
      );
      console.log("Rental confirmation email sent successfully");
    } catch (emailError) {
      console.error(
        "Email sending failed (continuing with response):",
        emailError
      );
    }

    const responseData = {
      success: true,
      message: `${createdRentals.length} book(s) rented successfully!`,
      rentalsCreated: createdRentals.length,
    };

    // Include information about unavailable books if any
    if (unavailableBooks.length > 0) {
      responseData.unavailableBooks = unavailableBooks;
      responseData.message += ` ${unavailableBooks.length} book(s) were unavailable.`;
    }

    return res.status(201).json(responseData);
  } catch (error) {
    console.error("!!! UNHANDLED EXCEPTION IN BATCH RENTAL !!!", error);
    return res.status(500).json({
      success: false,
      message: "An internal server error occurred.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

//==============================================================================
// GET USER'S RENTAL HISTORY
//==============================================================================
router.get("/history", isAuthenticated, async (req, res) => {
  try {
    // Handle different possible user ID fields from the authentication middleware
    const userId = req.user.userId || req.user.user_id || req.user._id;

    if (!userId) {
      return res.status(401).json({
        message: "User ID not found in authentication token.",
      });
    }

    console.log(`Fetching rental history for user: ${userId}`);

    // Use the userId from the authenticated user's token
    const rentals = await Rental.find({ userId })
      // Populate with specific book fields for better performance
      .populate("bookId", "title author imageUrl price")
      .sort({ startDate: -1 }); // Show newest rentals first

    console.log(`Found ${rentals.length} rentals for user`);
    res.status(200).json(rentals);
  } catch (error) {
    console.error("Error fetching rental history:", error);
    res
      .status(500)
      .json({ message: "Server error while fetching rental history." });
  }
});

//==============================================================================
// RETURN A RENTED BOOK
//==============================================================================
router.post("/return/:rentalId", isAuthenticated, async (req, res) => {
  try {
    const { rentalId } = req.params;
    // Handle different possible user ID fields from the authentication middleware
    const userId = req.user.userId || req.user.user_id || req.user._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User ID not found in authentication token.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(rentalId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid rental ID format." });
    }

    const rental = await Rental.findById(rentalId);

    if (!rental) {
      return res
        .status(404)
        .json({ success: false, message: "Rental record not found." });
    }

    // Security Check: Ensure the user owns this rental
    if (rental.userId.toString() !== userId.toString()) {
      console.log(
        `Authorization failed: Rental belongs to ${rental.userId}, not ${userId}`
      );
      return res.status(403).json({
        success: false,
        message: "You are not authorized to return this book.",
      });
    }

    if (rental.isReturned) {
      return res.status(400).json({
        success: false,
        message: "This book has already been returned.",
      });
    }

    // Update the rental record
    rental.isReturned = true;
    rental.returnDate = new Date(); // Fixed the syntax error

    // Calculate late fees if any
    if (rental.returnDate > rental.dueDate) {
      const daysLate = Math.ceil(
        (rental.returnDate - rental.dueDate) / (1000 * 60 * 60 * 24)
      );
      rental.lateFee = daysLate * 10; // Rs.10 per day late fee
      console.log(
        `Late fee applied: ${rental.lateFee} (${daysLate} days late)`
      );
    }

    await rental.save();
    console.log(`Rental ${rentalId} marked as returned`);

    // Increment the book's stock
    const book = await Book.findByIdAndUpdate(
      rental.bookId,
      { $inc: { stockQuantity: 1 } },
      { new: true }
    );

    if (book) {
      console.log(`Book stock increased. New quantity: ${book.stockQuantity}`);
    } else {
      console.log(
        `Warning: Book with ID ${rental.bookId} not found when processing return`
      );
    }

    res.status(200).json({
      success: true,
      message: "Book returned successfully.",
      rental,
      lateFee: rental.lateFee || 0,
    });
  } catch (error) {
    console.error("Error processing book return:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error while returning book." });
  }
});

export default router;
