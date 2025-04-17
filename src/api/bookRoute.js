import express from "express";
import Book from '../../src/database/schema/bookSchema.js';
import mongoose from "mongoose";
import RecommendationEngine from '../../src/services/RecommendationEngine.js';
import auth from '../../src/middleware/auth.js';  

const router = express.Router();

// Enhanced debugging middleware
router.use((req, res, next) => {
  console.log("Public Book API Request:", {
    method: req.method,
    path: req.path,
    query: req.query,
    params: req.params
  });
  next();
});
// Get trending books
router.get("/trending", async (req, res) => {
  try {
    console.log("GET /api/books/trending route hit");
    const limit = parseInt(req.query.limit) || 5;
    
    const trendingBooks = await Book.find({ 
      stockQuantity: { $gt: 0 },
      rating: { $gte: 4 }
    })
    .sort({ rating: -1, createdAt: -1 })
    .limit(limit);
    
    console.log(`Found ${trendingBooks.length} trending books`);
    
    // Fix: Format the response to match what the frontend expects
    res.json({
      data: trendingBooks,
      message: "Trending books retrieved successfully"
    });
  } catch (error) {
    console.error("Error fetching trending books:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
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

// Get new arrivals (adds this missing endpoint)
router.get("/new-arrivals", async (req, res) => {
  try {
    console.log("GET /api/books/new-arrivals route hit");
    const limit = parseInt(req.query.limit) || 5;
    
    const newArrivals = await Book.find({ stockQuantity: { $gt: 0 } })
      .sort({ createdAt: -1 })
      .limit(limit);
    
    console.log(`Found ${newArrivals.length} new arrivals`);
    res.json(newArrivals);
  } catch (error) {
    console.error("Error fetching new arrivals:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get personalized recommendations for the logged-in user
router.get("/recommendations", auth.isAuthenticated, async (req, res) => {
  try {
    console.log("GET /api/books/recommendations route hit");
    
    // Fix 1: Access userId correctly from req.user
    // The logs show user is available as req.user.userId, not req.user.id
    const userId = req.user.userId; 
    console.log(`Generating personalized recommendations for user ${userId}`);
    
    const limit = parseInt(req.query.limit) || 10;
    const excludeBookIds = req.query.exclude ? req.query.exclude.split(',') : [];
    
    const recommendationEngine = new RecommendationEngine();
    
    // Fix 2: Correct the function call pattern
    const recommendations = await recommendationEngine.getRecommendationsForUser(
      userId, 
      { 
        limit, 
        includeTrending: true,
        excludeBookIds
      }
    );
    
    console.log(`Found ${recommendations.length} personalized recommendations`);
    
    // Properly structure the response
    res.json({
      data: recommendations,
      message: "Recommendations retrieved successfully"
    });
  } catch (error) {
    console.error("Error fetching personalized recommendations:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get recommendations for non-logged-in users or fallback
router.get("/recommended", async (req, res) => {
  try {
    console.log("GET /api/books/recommended route hit");
    
    // Get query parameters with defaults
    const limit = parseInt(req.query.limit) || 6;
    const genre = req.query.genre || null;
    
    // If user is logged in, redirect to personalized recommendations
    if (req.user) {
      return res.redirect(`/api/books/recommendations?limit=${limit}`);
    }
    
    console.log(`Fetching ${limit} recommended books${genre ? ` with preference for ${genre}` : ''}`);
    
    // For non-logged-in users, provide generic recommendations
    const recommendations = await getGenericRecommendations(limit, genre);
    
    console.log(`Found ${recommendations.length} recommended books`);
    res.json(recommendations);
  } catch (error) {
    console.error("Error fetching recommended books:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get "Because You Like" recommendations based on a specific book
router.get("/:id/similar", async (req, res) => {
  try {
    const bookId = req.params.id;
    console.log(`GET /api/books/${bookId}/similar route hit`);
    
    // Validate bookId
    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      return res.status(400).json({ message: "Invalid book ID format" });
    }
    
    const limit = parseInt(req.query.limit) || 5;
    const userId = req.user ? req.user.id : null; // Optional user context
    
    const similarBooks = await RecommendationEngine.getBecauseYouLikeRecommendations(
      bookId, 
      userId, 
      limit
    );
    
    console.log(`Found ${similarBooks.length} similar books for book ${bookId}`);
    res.json(similarBooks);
  } catch (error) {
    console.error("Error fetching similar books:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get new releases personalized for the user (kept for backward compatibility)
router.get("/new-releases", auth.isAuthenticated, async (req, res) => {
  try {
    console.log("GET /api/books/new-releases route hit (authenticated)");
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 5;
    
    const newReleases = await RecommendationEngine.getNewReleaseRecommendations(
      userId, 
      limit
    );
    
    console.log(`Found ${newReleases.length} personalized new releases`);
    res.json(newReleases);
  } catch (error) {
    console.error("Error fetching personalized new releases:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get single book details
router.get("/:id", async (req, res) => {
  try {
    const bookId = req.params.id;
    console.log(`GET /api/books/${bookId} route hit`);
    
    // Validate if bookId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      console.log(`Invalid bookId format: ${bookId}`);
      return res.status(400).json({ message: "Invalid book ID format" });
    }
    
    const book = await Book.findById(bookId);
    console.log(`Book found: ${book ? 'Yes' : 'No'}`);
    
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

// Generic recommendation function for non-logged-in users
async function getGenericRecommendations(limit = 6, preferredGenre = null) {
  const recommendationMix = [];
  
  try {
    // 1. Include trending books (high rating & recent)
    const trendingBooks = await Book.find({ 
      stockQuantity: { $gt: 0 }, 
      rating: { $gte: 4 } 
    })
    .sort({ rating: -1, createdAt: -1 })
    .limit(Math.ceil(limit / 3));
    
    recommendationMix.push(...trendingBooks);
    
    // 2. Include books from preferred genre if provided
    if (preferredGenre) {
      const genreBooks = await Book.find({
        genre: preferredGenre,
        stockQuantity: { $gt: 0 }
      })
      .sort({ rating: -1 })
      .limit(Math.floor(limit / 3));
      
      recommendationMix.push(...genreBooks);
    } else {
      // If no genre preference, include popular books across all genres
      const popularBooks = await Book.find({ stockQuantity: { $gt: 0 } })
        .sort({ rating: -1 })
        .limit(Math.floor(limit / 3));
        
      recommendationMix.push(...popularBooks);
    }
    
    // 3. Include newest releases
    const newReleases = await Book.find({ stockQuantity: { $gt: 0 } })
      .sort({ createdAt: -1 })
      .limit(Math.floor(limit / 3));
      
    recommendationMix.push(...newReleases);
    
    // Remove duplicates by converting to a Set based on book IDs and back to array
    const uniqueRecommendations = Array.from(
      new Map(recommendationMix.map(book => [book._id.toString(), book])).values()
    );
    
    // Ensure we only return the requested limit
    return uniqueRecommendations.slice(0, limit);
  } catch (error) {
    console.error("Error in generic recommendation engine:", error);
    // Return an empty array if there's an error
    return [];
  }
}

export default router;