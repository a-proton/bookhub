import express from "express";
import Book from "../database/schema/bookSchema.js"; // Corrected path
import mongoose from "mongoose";
import RecommendationEngine from "../services/RecommendationEngine.js"; // Corrected path

import { isAuthenticated } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get all books (public route)
router.get("/", async (req, res) => {
  try {
    const books = await Book.find({ stockQuantity: { $gt: 0 } }).sort({
      createdAt: -1,
    });
    res.json(books);
  } catch (error) {
    console.error("Error fetching books:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get new arrivals (public route)
router.get("/new-arrivals", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const newArrivals = await Book.find({ stockQuantity: { $gt: 0 } })
      .sort({ createdAt: -1 })
      .limit(limit);
    res.json(newArrivals);
  } catch (error) {
    console.error("Error fetching new arrivals:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get trending books (public route)
router.get("/trending", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const trendingBooks = await Book.find({
      stockQuantity: { $gt: 0 },
      rating: { $gte: 4 },
    })
      .sort({ rating: -1 })
      .limit(limit);
    res.json({ data: trendingBooks, message: "Trending books retrieved" });
  } catch (error) {
    console.error("Error fetching trending books:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get personalized recommendations (authenticated route)
router.get("/recommendations", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.userId;
    const limit = parseInt(req.query.limit) || 10;
    const recommendationEngine = new RecommendationEngine();
    const recommendations =
      await recommendationEngine.getRecommendationsForUser(userId, { limit });
    res.json({ data: recommendations, message: "Recommendations retrieved" });
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get single book details (public route)
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid book ID format" });
    }
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
    res.json(book);
  } catch (error) {
    console.error("Error fetching book:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Search books (public route)
router.get("/search/:query", async (req, res) => {
  try {
    const searchQuery = req.params.query;
    const books = await Book.find({
      stockQuantity: { $gt: 0 },
      $or: [
        { title: { $regex: searchQuery, $options: "i" } },
        { author: { $regex: searchQuery, $options: "i" } },
      ],
    });
    res.json(books);
  } catch (error) {
    console.error("Error searching books:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
