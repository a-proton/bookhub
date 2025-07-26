// src/api/admin/bookRoute.js

import express from "express";
import Book from "../../database/schema/bookSchema.js";

//
// --- THE FINAL FIX IS HERE ---
// This is the correct import for this file's location and name.
//
import { isAdmin } from "../../middleware/authMiddleware.js";

const router = express.Router();

// This will now print '✅'
console.log(
  `Admin Book Route: isAdmin middleware imported: ${
    typeof isAdmin === "function" ? "✅" : "❌"
  }`
);

// Get all books
router.get("/", isAdmin, async (req, res) => {
  try {
    const books = await Book.find().sort({ createdAt: -1 });
    res.json(books);
  } catch (error) {
    console.error("Error fetching books:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get single book
router.get("/:id", isAdmin, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
    res.json(book);
  } catch (error) {
    console.error("Error fetching book:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Add new book
router.post("/", isAdmin, async (req, res) => {
  try {
    const { isbn } = req.body;
    const existingBook = await Book.findOne({ isbn });
    if (existingBook) {
      return res
        .status(400)
        .json({ message: "Book with this ISBN already exists" });
    }

    const newBook = new Book(req.body);
    await newBook.save();
    res.status(201).json(newBook);
  } catch (error) {
    console.error("Error adding book:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Update book
router.put("/:id", isAdmin, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    const updatedBook = await Book.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(updatedBook);
  } catch (error) {
    console.error("Error updating book:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Delete book
router.delete("/:id", isAdmin, async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
    res.json({ message: "Book deleted successfully" });
  } catch (error) {
    console.error("Error deleting book:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;
