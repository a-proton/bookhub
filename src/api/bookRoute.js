import express from "express";
import Book from '../../src/database/schema/bookSchema.js';

const router = express.Router();

// Enhanced debugging middleware
router.use((req, res, next) => {
  console.log("Public Book API Request:", {
    method: req.method,
    path: req.path,
    query: req.query
  });
  next();
});

// Get all books (public route - no authentication needed)
router.get("/", async (req, res) => {
  try {
    console.log("GET /api/books route hit");
    const books = await Book.find({ stockQuantity: { $gt: 0 } }).sort({ createdAt: -1 });
    console.log(`Found ${books.length} available books`);
    res.json(books);
  } catch (error) {
    console.error("Error fetching books:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get single book details
router.get("/:id", async (req, res) => {
  try {
    console.log(`GET /api/books/${req.params.id} route hit`);
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

// Get books by genre
router.get("/genre/:genre", async (req, res) => {
  try {
    console.log(`GET /api/books/genre/${req.params.genre} route hit`);
    const books = await Book.find({ 
      genre: req.params.genre,
      stockQuantity: { $gt: 0 }
    }).sort({ createdAt: -1 });
    console.log(`Found ${books.length} books in genre: ${req.params.genre}`);
    res.json(books);
  } catch (error) {
    console.error("Error fetching books by genre:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Search books
router.get("/search/:query", async (req, res) => {
  try {
    const searchQuery = req.params.query;
    console.log(`GET /api/books/search/${searchQuery} route hit`);
    
    const books = await Book.find({
      $and: [
        { stockQuantity: { $gt: 0 } },
        {
          $or: [
            { title: { $regex: searchQuery, $options: 'i' } },
            { author: { $regex: searchQuery, $options: 'i' } },
            { description: { $regex: searchQuery, $options: 'i' } }
          ]
        }
      ]
    }).sort({ createdAt: -1 });
    
    console.log(`Found ${books.length} books matching search: "${searchQuery}"`);
    res.json(books);
  } catch (error) {
    console.error("Error searching books:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;