import express from "express"
import Book from "../database/schema/bookSchema.js"
import { isAuthenticated } from "../middleware/auth.js"
import User from "../database/schema/userSchema.js"
import RecommendationEngine from "../services/RecommendationEngine.js"

const router = express.Router()

/**
 * Enhanced debugging middleware for book routes
 */
router.use((req, res, next) => {
  console.log(`Book API Request: ${req.method} ${req.path}`, {
    query: req.query,
    params: req.params,
    user: req.user ? `ID: ${req.user._id || req.user.userId}` : "Not authenticated",
  })
  next()
})

/**
 * @route GET /api/books/trending
 * @desc Get trending books with improved error handling
 * @access Public
 */
router.get("/api/books/trending", async (req, res) => {
  try {
    console.log("Fetching trending books")
    const limit = Number.parseInt(req.query.limit) || 10
    const userId = req.user ? req.user._id || req.user.userId : null
    const user = userId ? await User.findById(userId) : null

    // If user is authenticated, try to get personalized trending books
    if (user) {
      console.log(`Getting personalized trending books for user ${userId}`)
      const trendingBooks = await RecommendationEngine.getTrendingBooks([], user)

      if (trendingBooks && trendingBooks.length > 0) {
        console.log(`Found ${trendingBooks.length} personalized trending books`)
        return res.json({
          success: true,
          count: trendingBooks.length,
          data: trendingBooks,
        })
      }
    }

    // Fallback to general trending books
    console.log("Getting general trending books")
    const trendingBooks = await Book.find({
      stockQuantity: { $gt: 0 },
    })
      .sort({ rating: -1, publicationYear: -1 })
      .limit(limit)

    // If still no books, try with even more relaxed criteria
    if (trendingBooks.length === 0) {
      console.log("No trending books found with initial criteria, using fallback")
      const fallbackBooks = await Book.find({
        stockQuantity: { $gt: 0 },
      })
        .sort({ createdAt: -1 })
        .limit(limit)

      console.log(`Found ${fallbackBooks.length} fallback trending books`)

      return res.json({
        success: true,
        count: fallbackBooks.length,
        data: fallbackBooks,
      })
    }

    console.log(`Found ${trendingBooks.length} trending books`)

    res.json({
      success: true,
      count: trendingBooks.length,
      data: trendingBooks,
    })
  } catch (error) {
    console.error("Error fetching trending books:", error)
    // Return empty array instead of error
    res.json({
      success: false,
      count: 0,
      data: [],
      message: "Failed to get trending books",
      error: error.message,
    })
  }
})

/**
 * @route GET /api/books/recommendations
 * @desc Get personalized book recommendations for the authenticated user
 * @access Private
 */
router.get("/api/books/recommendations", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id || req.user.userId
    const limit = Number.parseInt(req.query.limit) || 10
    const excludeIds = req.query.exclude ? req.query.exclude.split(",") : []
    const genre = req.query.genre || null

    console.log(`Fetching recommendations for user ${userId} with limit ${limit}`)

    // Get recommendations from the engine
    let recommendations

    if (genre) {
      // If genre is specified, filter recommendations by genre
      recommendations = await Book.find({
        genre: { $regex: new RegExp(genre, "i") },
        stockQuantity: { $gt: 0 },
        _id: { $nin: excludeIds },
      }).limit(limit)
    } else {
      // Otherwise get personalized recommendations
      recommendations = await RecommendationEngine.getRecommendationsForUser(userId, {
        limit,
        excludeBookIds: excludeIds,
        includeTrending: true,
      })
    }

    res.json({
      success: true,
      count: recommendations.length,
      data: recommendations,
    })
  } catch (error) {
    console.error("Error fetching recommendations:", error)
    res.status(500).json({
      success: false,
      message: "Failed to get recommendations",
      error: error.message,
      data: [], // Include empty data array for consistent frontend handling
    })
  }
})

/**
 * @route GET /api/books/new-arrivals
 * @desc Get new book arrivals, personalized if authenticated
 * @access Public (but personalizes if authenticated)
 */
router.get("/api/books/new-arrivals", async (req, res) => {
  try {
    const limit = Number.parseInt(req.query.limit) || 10

    // Check if user is authenticated
    const userId = req.user ? req.user._id || req.user.userId : null
    let newArrivals

    if (userId) {
      // If user is authenticated, get personalized new arrivals
      newArrivals = await RecommendationEngine.getNewReleaseRecommendations(userId, limit)
    } else {
      // Otherwise, get general new arrivals
      const currentYear = new Date().getFullYear()
      newArrivals = await Book.find({
        publicationYear: { $gte: currentYear - 1 },
        stockQuantity: { $gt: 0 },
      })
        .sort({ publicationYear: -1 })
        .limit(limit)

      // If no new books found, just get the most recently added books
      if (newArrivals.length === 0) {
        newArrivals = await Book.find({
          stockQuantity: { $gt: 0 },
        })
          .sort({ createdAt: -1 })
          .limit(limit)
      }
    }

    res.json({
      success: true,
      count: newArrivals.length,
      data: newArrivals,
    })
  } catch (error) {
    console.error("Error fetching new arrivals:", error)
    res.status(500).json({
      success: false,
      message: "Failed to get new arrivals",
      error: error.message,
      data: [], // Include empty data array for consistent frontend handling
    })
  }
})

/**
 * @route GET /api/books/because-you-like/:bookId
 * @desc Get recommendations based on a specific book
 * @access Public (but personalizes if authenticated)
 */
router.get("/api/books/because-you-like/:bookId", async (req, res) => {
  try {
    const { bookId } = req.params
    const limit = Number.parseInt(req.query.limit) || 5

    // Get user if authenticated
    const userId = req.user ? req.user._id || req.user.userId : null

    const recommendations = await RecommendationEngine.getBecauseYouLikeRecommendations(bookId, userId, limit)

    res.json({
      success: true,
      count: recommendations.length,
      data: recommendations,
    })
  } catch (error) {
    console.error("Error fetching similar books:", error)
    res.status(500).json({
      success: false,
      message: "Failed to get similar books",
      error: error.message,
      data: [], 
    })
  }
})

export default router
