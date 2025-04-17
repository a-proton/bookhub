import User from "../database/schema/userSchema.js"
import Book from "../database/schema/bookSchema.js"

/**
 * Book Recommendation Engine - Fixed Version
 *
 * This service provides personalized book recommendations based on user preferences,
 * demographics, reading history, and collaborative filtering from similar users.
 * Fixes include: better case-insensitive matching, improved language-genre combinations,
 * enhanced fallback strategies, additional debugging, and optimized preference matching.
 */
class RecommendationEngine {
  /**
   * Generate recommendations for a specific user
   *
   * @param {string} userId - The ID of the user to generate recommendations for
   * @param {Object} options - Configuration options for recommendations
   * @param {number} options.limit - Maximum number of recommendations to return
   * @param {boolean} options.includeTrending - Whether to include trending books
   * @param {Array<string>} options.excludeBookIds - Book IDs to exclude from recommendations
   * @param {boolean} options.debug - Whether to enable detailed debugging
   * @returns {Promise<Array>} - Array of recommended book objects
   */
  async getRecommendationsForUser(userId, options = {}) {
    const { 
      limit = 10, 
      includeTrending = true, 
      excludeBookIds = [],
      debug = false 
    } = options

    try {
      // Get user profile
      const user = await User.findById(userId).lean()
      if (!user) {
        console.error(`User not found with ID: ${userId}`)
        return this.getFallbackRecommendations(limit)
      }

      console.log(`Generating recommendations for user: ${userId}`)
      
      // Normalize user preferences to lowercase for case-insensitive matching
      const normalizedUser = this.normalizeUserPreferences(user)
      
      console.log(
        `User preferences: ${JSON.stringify({
          favoriteGenres: normalizedUser.favoriteGenres || [],
          preferredLanguages: normalizedUser.preferredLanguages || [],
        })}`,
      )

      // Before proceeding, verify if any books exist with the user's exact preferences
      // This is a critical test to see if Hindi poetry books exist and can be matched
      const exactMatchQuery = {}
      
      if (normalizedUser.favoriteGenres && normalizedUser.favoriteGenres.length > 0) {
        // Create case-insensitive genre conditions
        exactMatchQuery.genre = { 
          $regex: new RegExp(normalizedUser.favoriteGenres.map(g => 
            `^${g}$`).join('|'), 'i') 
        }
      }
      
      if (normalizedUser.preferredLanguages && normalizedUser.preferredLanguages.length > 0) {
        // Create case-insensitive language conditions
        exactMatchQuery.language = { 
          $regex: new RegExp(normalizedUser.preferredLanguages.map(l => 
            `^${l}$`).join('|'), 'i') 
        }
      }
      
      if (Object.keys(exactMatchQuery).length > 0) {
        exactMatchQuery.stockQuantity = { $gt: 0 }
        
        // Check if any books exist that match these exact preferences
        const exactMatches = await Book.find(exactMatchQuery).limit(5)
        
        if (debug) {
          console.log(`Exact preference match test - Found ${exactMatches.length} books`)
          if (exactMatches.length > 0) {
            console.log('Sample matches:', exactMatches.map(book => ({
              title: book.title,
              genre: book.genre,
              language: book.language
            })))
          } else {
            console.log('No exact matches found with query:', JSON.stringify(exactMatchQuery))
            
            // Further debug: check how many books exist with just the genre
            if (normalizedUser.favoriteGenres && normalizedUser.favoriteGenres.length > 0) {
              const genreOnlyMatches = await Book.find({
                genre: exactMatchQuery.genre,
                stockQuantity: { $gt: 0 }
              }).limit(3)
              
              console.log(`Genre-only test - Found ${genreOnlyMatches.length} books`)
              if (genreOnlyMatches.length > 0) {
                console.log('Sample genre matches:', genreOnlyMatches.map(b => 
                  ({ title: b.title, genre: b.genre, language: b.language })))
              }
            }
            
            // Further debug: check how many books exist with just the language
            if (normalizedUser.preferredLanguages && normalizedUser.preferredLanguages.length > 0) {
              const languageOnlyMatches = await Book.find({
                language: exactMatchQuery.language,
                stockQuantity: { $gt: 0 }
              }).limit(3)
              
              console.log(`Language-only test - Found ${languageOnlyMatches.length} books`)
              if (languageOnlyMatches.length > 0) {
                console.log('Sample language matches:', languageOnlyMatches.map(b => 
                  ({ title: b.title, genre: b.genre, language: b.language })))
              }
            }
          }
        }
      }

      // Calculate weights for different recommendation factors
      const weights = this.calculateWeights(normalizedUser)
      if (debug) console.log(`Calculated weights: ${JSON.stringify(weights)}`)

      // Prioritize getting direct combination matches first
      // This is to specifically address the issue with Hindi + Poetry combinations
      let directMatches = []
      if (normalizedUser.favoriteGenres && normalizedUser.favoriteGenres.length > 0 &&
          normalizedUser.preferredLanguages && normalizedUser.preferredLanguages.length > 0) {
          
        directMatches = await this.getDirectCombinationMatches(
          normalizedUser, 
          excludeBookIds, 
          Math.min(limit * 2, 20),
          debug
        )
        
        // If we found good direct matches, return them immediately
        if (directMatches.length >= Math.ceil(limit / 2)) {
          if (debug) console.log(`Found ${directMatches.length} direct combination matches, using these`)
          
          if (directMatches.length >= limit) {
            return directMatches.slice(0, limit)
          }
        }
      }

      // Get recommendations using different strategies
      // We still do this even if we found direct matches, to combine them for better diversity
      const [genreBasedBooks, languageBasedBooks, demographicBasedBooks, collaborativeBooks, trendingBooks] =
        await Promise.all([
          this.getGenreBasedRecommendations(normalizedUser, excludeBookIds, debug),
          this.getLanguageBasedRecommendations(normalizedUser, excludeBookIds, debug),
          this.getDemographicBasedRecommendations(normalizedUser, excludeBookIds, debug),
          this.getCollaborativeFilteringRecommendations(normalizedUser, excludeBookIds, debug),
          includeTrending ? this.getTrendingBooks(excludeBookIds, normalizedUser, debug) : [],
        ])

      // Log results from each recommendation source
      if (debug) {
        console.log(`Genre-based recommendations: ${genreBasedBooks.length}`)
        console.log(`Language-based recommendations: ${languageBasedBooks.length}`)
        console.log(`Demographic-based recommendations: ${demographicBasedBooks.length}`)
        console.log(`Collaborative recommendations: ${collaborativeBooks.length}`)
        console.log(`Trending recommendations: ${trendingBooks.length}`)
        console.log(`Direct combination matches: ${directMatches.length}`)
      }

      // If primary preferences yield no results, use fallback query with case-insensitive matching
      let fallbackMatches = []
      const needsFallback = (genreBasedBooks.length === 0 || languageBasedBooks.length === 0) && directMatches.length === 0
      
      if (needsFallback) {
        if (debug) console.log("No matching recommendations found, using fallback query")
        
        fallbackMatches = await this.getForcedPreferenceMatches(normalizedUser, excludeBookIds, limit, debug)
        
        // If we found direct matches through fallback, use them
        if (fallbackMatches.length > 0) {
          if (debug) console.log(`Found ${fallbackMatches.length} fallback matches`)
          
          if (fallbackMatches.length >= limit) {
            return fallbackMatches.slice(0, limit)
          }
        }
      }

      // Combine and score recommendations (including direct and fallback matches)
      const scoredRecommendations = this.scoreAndCombineRecommendations(
        normalizedUser,
        weights,
        [...genreBasedBooks, ...directMatches, ...fallbackMatches],  // Add direct matches to genre books
        languageBasedBooks,
        demographicBasedBooks,
        collaborativeBooks,
        trendingBooks,
        debug
      )

      // Get top recommendations
      const topRecommendations = scoredRecommendations.sort((a, b) => b.score - a.score).slice(0, limit)

      if (debug) {
        console.log("Top recommendations scores:")
        topRecommendations.forEach((rec, i) => {
          console.log(
            `${i + 1}. "${rec.book.title}" - Score: ${rec.score.toFixed(2)} - Genre: ${rec.book.genre} - Language: ${rec.book.language}`,
          )
        })
      }

      // Return top recommendations
      const result = topRecommendations.map((item) => item.book)

      // If no recommendations were found, return fallback recommendations
      if (result.length === 0) {
        console.log("No recommendations found, using general fallback")
        return this.getFallbackRecommendations(limit, normalizedUser)
      }

      return result
    } catch (error) {
      console.error("Error generating recommendations:", error)
      return this.getFallbackRecommendations(limit)
    }
  }

  /**
   * Get direct matches for combined language and genre preferences
   * 
   * @param {Object} user - Normalized user object
   * @param {Array<string>} excludeBookIds - Book IDs to exclude
   * @param {number} limit - Maximum number of books to return
   * @param {boolean} debug - Whether to enable detailed debugging
   * @returns {Promise<Array>} - Array of directly matched books
   */
  async getDirectCombinationMatches(user, excludeBookIds = [], limit = 10, debug = false) {
    if (!user.favoriteGenres || !user.favoriteGenres.length || 
        !user.preferredLanguages || !user.preferredLanguages.length) {
      return []
    }

    try {
      if (debug) {
        console.log(`Looking for direct matches with genres [${user.favoriteGenres.join(', ')}] and languages [${user.preferredLanguages.join(', ')}]`)
      }
      
      // Create individual regexes for each genre and language
      const genreRegexStrings = user.favoriteGenres.map(genre => `^${genre}$`)
      const languageRegexStrings = user.preferredLanguages.map(lang => `^${lang}$`)
      
      // Combine them into a single regex pattern for each
      const genreRegex = new RegExp(genreRegexStrings.join('|'), 'i')
      const languageRegex = new RegExp(languageRegexStrings.join('|'), 'i')
      
      // Look for books that match both genre AND language exactly
      const combinedMatches = await Book.find({
        genre: { $regex: genreRegex },
        language: { $regex: languageRegex },
        _id: { $nin: excludeBookIds },
        stockQuantity: { $gt: 0 }
      }).sort({ rating: -1 }).limit(limit)
      
      if (debug) {
        console.log(`Found ${combinedMatches.length} direct combination matches`)
        if (combinedMatches.length > 0) {
          console.log('Sample matches:', combinedMatches.slice(0, 3).map(book => ({
            title: book.title,
            genre: book.genre,
            language: book.language
          })))
        } else {
          // Try alternate query formats to debug if nothing is found
          console.log('Testing alternate query formats...')
          
          // Try with explicit regex pattern
          const altMatches = await Book.find({
            genre: { $regex: /^poetry$/i },
            language: { $regex: /^hindi$/i },
            stockQuantity: { $gt: 0 }
          }).limit(3)
          
          console.log(`Alt query test found ${altMatches.length} matches`)
          
          // Investigate what genres actually exist in the database
          const uniqueGenres = await Book.distinct('genre')
          console.log(`Database has these genres: ${uniqueGenres.slice(0, 10).join(', ')}${uniqueGenres.length > 10 ? '...' : ''}`)
          
          // Investigate what languages actually exist in the database
          const uniqueLanguages = await Book.distinct('language')
          console.log(`Database has these languages: ${uniqueLanguages.slice(0, 10).join(', ')}${uniqueLanguages.length > 10 ? '...' : ''}`)
        }
      }
      
      return combinedMatches
    } catch (error) {
      console.error("Error getting direct combination matches:", error)
      return []
    }
  }

  /**
   * Normalize user preferences to handle case-insensitivity
   * 
   * @param {Object} user - User object
   * @returns {Object} - User with normalized preferences
   */
  normalizeUserPreferences(user) {
    const normalizedUser = { ...user }
    
    // Normalize favorite genres to lowercase
    if (user.favoriteGenres && Array.isArray(user.favoriteGenres)) {
      normalizedUser.favoriteGenres = user.favoriteGenres.map(genre => 
        typeof genre === 'string' ? genre.toLowerCase().trim() : genre
      ).filter(Boolean) // Filter out empty strings
    } else {
      normalizedUser.favoriteGenres = []
    }
    
    // Normalize preferred languages to lowercase
    if (user.preferredLanguages && Array.isArray(user.preferredLanguages)) {
      normalizedUser.preferredLanguages = user.preferredLanguages.map(language => 
        typeof language === 'string' ? language.toLowerCase().trim() : language
      ).filter(Boolean) // Filter out empty strings
    } else {
      normalizedUser.preferredLanguages = []
    }
    
    return normalizedUser
  }

  /**
   * Forced matching for user's genre and language preferences when normal strategies fail
   * This is a more aggressive approach to find matches
   * 
   * @param {Object} user - Normalized user object
   * @param {Array<string>} excludeBookIds - Book IDs to exclude
   * @param {number} limit - Maximum number of books to return
   * @param {boolean} debug - Whether to enable detailed debugging
   * @returns {Promise<Array>} - Array of matched books
   */
  async getForcedPreferenceMatches(user, excludeBookIds = [], limit = 10, debug = false) {
    if ((!user.favoriteGenres || !user.favoriteGenres.length) && 
        (!user.preferredLanguages || !user.preferredLanguages.length)) {
      return []
    }

    try {
      const queries = []
      
      // Try multiple query strategies
      
      // Strategy 1: Direct text search on genre and language fields
      if (user.favoriteGenres && user.favoriteGenres.length) {
        // For each genre, create a direct text match query
        user.favoriteGenres.forEach(genre => {
          if (genre && typeof genre === 'string') {
            // Try exact word boundary match
            queries.push({
              $text: { $search: `"${genre}"` },
              _id: { $nin: excludeBookIds },
              stockQuantity: { $gt: 0 }
            })
            
            // Also try with case-insensitive regex
            queries.push({
              genre: { $regex: new RegExp(genre, 'i') },
              _id: { $nin: excludeBookIds },
              stockQuantity: { $gt: 0 }
            })
          }
        })
      }
      
      if (user.preferredLanguages && user.preferredLanguages.length) {
        // For each language, create a direct text match query
        user.preferredLanguages.forEach(language => {
          if (language && typeof language === 'string') {
            // Try exact word boundary match
            queries.push({
              $text: { $search: `"${language}"` },
              _id: { $nin: excludeBookIds },
              stockQuantity: { $gt: 0 }
            })
            
            // Also try with case-insensitive regex
            queries.push({
              language: { $regex: new RegExp(language, 'i') },
              _id: { $nin: excludeBookIds },
              stockQuantity: { $gt: 0 }
            })
          }
        })
      }
      
      // Strategy 2: Combination queries with different formats
      if (user.favoriteGenres && user.favoriteGenres.length && 
          user.preferredLanguages && user.preferredLanguages.length) {
        
        // Try combined query with both genre and language
        user.favoriteGenres.forEach(genre => {
          user.preferredLanguages.forEach(language => {
            if (genre && language) {
              queries.push({
                $and: [
                  { genre: { $regex: new RegExp(`\\b${genre}\\b`, 'i') } },
                  { language: { $regex: new RegExp(`\\b${language}\\b`, 'i') } }
                ],
                _id: { $nin: excludeBookIds },
                stockQuantity: { $gt: 0 }
              })
              
              // Also try as a string contains search
              queries.push({
                $and: [
                  { genre: { $regex: new RegExp(genre, 'i') } },
                  { language: { $regex: new RegExp(language, 'i') } }
                ],
                _id: { $nin: excludeBookIds },
                stockQuantity: { $gt: 0 }
              })
            }
          })
        })
      }
      
      // Execute all queries and combine results, removing duplicates
      const allResults = []
      const seenIds = new Set()
      
      if (debug) console.log(`Trying ${queries.length} different forced match queries`)
      
      // Execute each query sequentially to avoid overwhelming the database
      for (const query of queries) {
        const results = await Book.find(query).limit(Math.min(5, limit))
        
        if (results.length > 0 && debug) {
          console.log(`Found ${results.length} books with forced query: ${JSON.stringify(query)}`)
        }
        
        // Add results while avoiding duplicates
        results.forEach(book => {
          const bookId = book._id.toString()
          if (!seenIds.has(bookId)) {
            seenIds.add(bookId)
            allResults.push(book)
          }
        })
        
        // Break early if we have enough results
        if (allResults.length >= limit) break
      }
      
      // Score results to prioritize those matching both criteria
      const scoredResults = allResults.map(book => {
        let score = 1
        
        const bookGenre = (book.genre || '').toLowerCase()
        const bookLanguage = (book.language || '').toLowerCase()
        
        // Check genre match
        if (user.favoriteGenres.some(g => 
          bookGenre.includes(g.toLowerCase()) || g.toLowerCase().includes(bookGenre))) {
          score += 2
        }
        
        // Check language match
        if (user.preferredLanguages.some(l => 
          bookLanguage.includes(l.toLowerCase()) || l.toLowerCase().includes(bookLanguage))) {
          score += 2
        }
        
        // Bonus for exact matches
        if (user.favoriteGenres.some(g => g.toLowerCase() === bookGenre)) {
          score += 1
        }
        
        if (user.preferredLanguages.some(l => l.toLowerCase() === bookLanguage)) {
          score += 1
        }
        
        return { book, score }
      })
      
      // Sort by score and return top results
      return scoredResults
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(item => item.book)
      
    } catch (error) {
      console.error("Error in forced preference matching:", error)
      return []
    }
  }

  /**
   * Get fallback recommendations when personalized recommendations fail
   *
   * @param {number} limit - Maximum number of recommendations to return
   * @param {Object} user - User object for personalization if available
   * @returns {Promise<Array>} - Array of fallback book recommendations
   */
  async getFallbackRecommendations(limit = 10, user = null) {
    try {
      console.log("Getting fallback recommendations")
      
      // If we have user preferences, try to use them first
      if (user) {
        // Try a more lenient approach to matching genres
        if (user.favoriteGenres && user.favoriteGenres.length > 0) {
          // Create case-insensitive regex for matching any part of genre strings
          const genrePatterns = user.favoriteGenres.map(genre => 
            new RegExp(genre, 'i')
          )
          
          // Try regex matching on genre field
          const regexGenreQueries = user.favoriteGenres.map(genre => ({
            genre: { $regex: new RegExp(genre, 'i') }
          }))
          
          // Find books with regex genre matching
          const relaxedGenreMatches = await Book.find({
            $or: regexGenreQueries,
            stockQuantity: { $gt: 0 }
          }).sort({ rating: -1 }).limit(limit)
          
          if (relaxedGenreMatches.length > 0) {
            console.log(`Found ${relaxedGenreMatches.length} fallback books with relaxed genre matching`)
            return relaxedGenreMatches
          }
        }
        
        // Try the same with languages
        if (user.preferredLanguages && user.preferredLanguages.length > 0) {
          // Create case-insensitive regex for matching any part of language strings
          const languagePatterns = user.preferredLanguages.map(language => 
            new RegExp(language, 'i')
          )
          
          // Try regex matching on language field
          const regexLanguageQueries = user.preferredLanguages.map(language => ({
            language: { $regex: new RegExp(language, 'i') }
          }))
          
          // Find books with regex language matching
          const relaxedLanguageMatches = await Book.find({
            $or: regexLanguageQueries,
            stockQuantity: { $gt: 0 }
          }).sort({ rating: -1 }).limit(limit)
          
          if (relaxedLanguageMatches.length > 0) {
            console.log(`Found ${relaxedLanguageMatches.length} fallback books with relaxed language matching`)
            return relaxedLanguageMatches
          }
        }
      }
      
      // General fallback: popular and highly rated books
      const fallbackBooks = await Book.find({
        stockQuantity: { $gt: 0 },
        rating: { $gte: 4 },
      })
        .sort({ rating: -1 })
        .limit(limit)

      if (fallbackBooks.length === 0) {
        // If no books with good ratings, just get any books in stock
        return Book.find({ stockQuantity: { $gt: 0 } })
          .sort({ createdAt: -1 })
          .limit(limit)
      }

      return fallbackBooks
    } catch (error) {
      console.error("Error getting fallback recommendations:", error)
      return []
    }
  }

  /**
   * Calculate weights for different recommendation factors based on user profile
   *
   * @param {Object} user - User object
   * @returns {Object} - Weight factors for different recommendation strategies
   */
  calculateWeights(user) {
    // Handle undefined user preferences
    const hasGenrePreferences = user.favoriteGenres && user.favoriteGenres.length > 0
    const hasLanguagePreferences = user.preferredLanguages && user.preferredLanguages.length > 0
    const hasRentalPreferences = user.rentalPreferences && typeof user.rentalPreferences === "object"

    // Enhanced default weights with stronger emphasis on explicit preferences
    const weights = {
      genre: 0.5,
      language: 0.25,
      demographic: 0.05,
      collaborative: 0.15,
      trending: 0.05,
    }

    // Adjust weights based on user preferences
    if (hasRentalPreferences && user.rentalPreferences.prefersTrending) {
      weights.trending = 0.1
      weights.genre = 0.45
    }

    // If user has strong preferences, focus heavily on them
    if (hasGenrePreferences) {
      weights.genre = 0.6  // Increased from 0.5
    }

    if (hasLanguagePreferences) {
      weights.language = 0.35  // Increased from 0.25
    }

    // If both genre and language preferences exist, boost their combined importance
    if (hasGenrePreferences && hasLanguagePreferences) {
      // Rebalance to give more weight to these explicit preferences
      weights.genre = 0.45
      weights.language = 0.35
      weights.demographic = 0.05
      weights.collaborative = 0.10
      weights.trending = 0.05
    }

    return weights
  }

  /**
   * Get recommendations based on user's favorite genres
   *
   * @param {Object} user - User object
   * @param {Array<string>} excludeBookIds - Book IDs to exclude
   * @param {boolean} debug - Whether to enable detailed debugging
   * @returns {Promise<Array>} - Array of books matching user's genre preferences
   */
  async getGenreBasedRecommendations(user, excludeBookIds = [], debug = false) {
    // Handle undefined favoriteGenres
    if (!user.favoriteGenres || !user.favoriteGenres.length) {
      if (debug) console.log("No favorite genres found for user")
      return []
    }

    try {
      // Create a regex pattern that matches any of the user's genres with case insensitivity
      const genrePattern = new RegExp(user.favoriteGenres.map(g => `^${g}$`).join('|'), 'i')
      
      // Query using the combined regex pattern
      const genreBooks = await Book.find({
        genre: { $regex: genrePattern },
        _id: { $nin: excludeBookIds },
        stockQuantity: { $gt: 0 },
      }).limit(30)

      if (debug) {
        console.log(`Found ${genreBooks.length} books matching genres: ${user.favoriteGenres.join(", ")}`)
        
        // If no books found, try alternative query formats
        if (genreBooks.length === 0) {
          console.log("Testing alternative genre queries...")
          
          // Try individual genre queries
          for (const genre of user.favoriteGenres) {
            const singleGenreBooks = await Book.find({
              genre: { $regex: new RegExp(`^${genre}$`, 'i') },
              stockQuantity: { $gt: 0 }
            }).limit(3)
            
            console.log(`Query for genre "${genre}" found ${singleGenreBooks.length} books`)
            
            if (singleGenreBooks.length > 0) {
              console.log('Sample match:', singleGenreBooks[0].title, 
                'Genre:', singleGenreBooks[0].genre)
            }
          }
          
          // Also try partial matching
          const partialMatches = await Book.find({
            genre: { $regex: new RegExp(user.favoriteGenres[0], 'i') },
            stockQuantity: { $gt: 0 }
          }).limit(3)
          
          console.log(`Partial match query for "${user.favoriteGenres[0]}" found ${partialMatches.length} books`)
        }
      }
      
      // Return an empty array if no books were found
      return genreBooks || []
    } catch (error) {
      console.error("Error getting genre-based recommendations:", error)
      return []
    }
  }

  /**
   * Get recommendations based on user's preferred languages
   *
   * @param {Object} user - User object
   * @param {Array<string>} excludeBookIds - Book IDs to exclude
   * @param {boolean} debug - Whether to enable detailed debugging
   * @returns {Promise<Array>} - Array of books matching user's language preferences
   */
  async getLanguageBasedRecommendations(user, excludeBookIds = [], debug = false) {
    // Handle undefined preferredLanguages
    if (!user.preferredLanguages || !user.preferredLanguages.length) {
      if (debug) console.log("No preferred languages found for user")
      return []
    }

    try {
      // Create a regex pattern that matches any of the user's languages with case insensitivity
      const languagePattern = new RegExp(user.preferredLanguages.map(l => `^${l}$`).join('|'), 'i')
      
      // Look for books in user's preferred language with case insensitivity
      const languageBooks = await Book.find({
        language: { $regex: languagePattern },
        _id: { $nin: excludeBookIds },
        stockQuantity: { $gt: 0 },
      }).limit(20)

      if (debug) {
        console.log(`Found ${languageBooks.length} books matching languages: ${user.preferredLanguages.join(", ")}`)
        
        // If no books found, try alternative query formats
        if (languageBooks.length === 0) {
          console.log("Testing alternative language queries...")
          
          // Try individual language queries
          for (const language of user.preferredLanguages) {
            const singleLanguageBooks = await Book.find({
              language: { $regex: new RegExp(`^${language}$`, 'i') },
              stockQuantity: { $gt: 0 }
            }).limit(3)
            
            console.log(`Query for language "${language}" found ${singleLanguageBooks.length} books`)
            
            if (singleLanguageBooks.length > 0) {
              console.log('Sample match:', singleLanguageBooks[0].title, 
                'Language:', singleLanguageBooks[0].language)
            }
          }
          
          // Also try partial matching
          const partialMatches = await Book.find({
            language: { $regex: new RegExp(user.preferredLanguages[0], 'i') },
            stockQuantity: { $gt: 0 }
          }).limit(3)
          
          console.log(`Partial match query for "${user.preferredLanguages[0]}" found ${partialMatches.length} books`)
        }
      }
      
      return languageBooks
    } catch (error) {
      console.error("Error getting language-based recommendations:", error)
      return []
    }
  }

  /**
   * Get recommendations based on demographic similarities
   *
   * @param {Object} user - User object
   *  * @param {Array<string>} excludeBookIds - Book IDs to exclude
   * @param {boolean} debug - Whether to enable detailed debugging
   * @returns {Promise<Array>} - Array of books popular with users of similar demographics
   */
  async getDemographicBasedRecommendations(user, excludeBookIds = [], debug = false) {
    try {
      // Skip if user has no demographic data
      if (!user.age && !user.location && !user.occupation) {
        if (debug) console.log("No demographic data found for user")
        return []
      }

      // Build demographic query
      const demographicQuery = { _id: { $ne: user._id } }
      
      // Match by age range if available
      if (user.age) {
        // Find users in similar age range (±5 years)
        demographicQuery.age = { 
          $gte: Math.max(user.age - 5, 13), // Enforce minimum age
          $lte: user.age + 5 
        }
      }
      
      // Match by location if available
      if (user.location) {
        demographicQuery.location = user.location
      }
      
      // Match by occupation if available
      if (user.occupation) {
        demographicQuery.occupation = user.occupation
      }

      // Find similar users
      const similarUsers = await User.find(demographicQuery).limit(20)
      
      if (debug) {
        console.log(`Found ${similarUsers.length} users with similar demographics`)
      }
      
      if (similarUsers.length === 0) {
        return []
      }

      // Get book IDs from reading history of similar users
      const similarUserIds = similarUsers.map(u => u._id)
      
      // Find books read by similar users, excluding already excluded books
      const demographicBooks = await Book.find({
        _id: { $nin: excludeBookIds },
        readBy: { $in: similarUserIds },
        stockQuantity: { $gt: 0 }
      })
        .sort({ rating: -1 })
        .limit(15)

      if (debug) {
        console.log(`Found ${demographicBooks.length} books popular with similar demographics`)
      }

      return demographicBooks
    } catch (error) {
      console.error("Error getting demographic-based recommendations:", error)
      return []
    }
  }

  /**
   * Get recommendations based on collaborative filtering
   *
   * @param {Object} user - User object
   * @param {Array<string>} excludeBookIds - Book IDs to exclude
   * @param {boolean} debug - Whether to enable detailed debugging
   * @returns {Promise<Array>} - Array of books recommended via collaborative filtering
   */
  async getCollaborativeFilteringRecommendations(user, excludeBookIds = [], debug = false) {
    try {
      // Need reading history to perform collaborative filtering
      if (!user.readingHistory || !user.readingHistory.length) {
        if (debug) console.log("No reading history found for collaborative filtering")
        return []
      }

      // Get IDs of books the user has read
      const userReadBookIds = user.readingHistory.map(item => item.bookId)
      
      if (userReadBookIds.length === 0) {
        return []
      }

      // Find users who read at least one of the same books
      const similarReaders = await User.find({
        _id: { $ne: user._id },
        "readingHistory.bookId": { $in: userReadBookIds }
      }).limit(25)

      if (debug) {
        console.log(`Found ${similarReaders.length} users with similar reading taste`)
      }
      
      if (similarReaders.length === 0) {
        return []
      }

      // Extract book IDs read by similar users
      const similarUserBookIds = new Set()
      
      similarReaders.forEach(reader => {
        if (reader.readingHistory && Array.isArray(reader.readingHistory)) {
          reader.readingHistory.forEach(item => {
            // Don't include books the user has already read
            if (!userReadBookIds.includes(item.bookId)) {
              similarUserBookIds.add(item.bookId)
            }
          })
        }
      })

      // Convert Set to Array
      const recommendedBookIds = Array.from(similarUserBookIds)
      
      if (recommendedBookIds.length === 0) {
        return []
      }

      // Get the actual book objects
      const collaborativeBooks = await Book.find({
        _id: { 
          $in: recommendedBookIds, 
          $nin: excludeBookIds
        },
        stockQuantity: { $gt: 0 }
      })
        .sort({ rating: -1 })
        .limit(20)

      if (debug) {
        console.log(`Found ${collaborativeBooks.length} books via collaborative filtering`)
      }

      return collaborativeBooks
    } catch (error) {
      console.error("Error getting collaborative recommendations:", error)
      return []
    }
  }

  /**
   * Get trending books based on recent rentals and popularity
   *
   * @param {Array<string>} excludeBookIds - Book IDs to exclude
   * @param {Object} user - User object for personalization
   * @param {boolean} debug - Whether to enable detailed debugging
   * @returns {Promise<Array>} - Array of trending books
   */
  async getTrendingBooks(excludeBookIds = [], user = null, debug = false) {
    try {
      // Calculate the date 30 days ago
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      // Query for trending books (rented frequently in the last 30 days)
      const trendingBooks = await Book.find({
        _id: { $nin: excludeBookIds },
        stockQuantity: { $gt: 0 },
        lastRented: { $gte: thirtyDaysAgo },
        rentalCount: { $gte: 3 } // Books rented at least 3 times
      })
        .sort({ rentalCount: -1, rating: -1 })
        .limit(15)

      if (debug) {
        console.log(`Found ${trendingBooks.length} trending books`)
      }

      // If user has preferences, personalize trending results
      if (user && user.favoriteGenres && user.favoriteGenres.length > 0) {
        // Score trending books based on genre match
        const scoredTrending = trendingBooks.map(book => {
          let score = 1 // Base score
          
          if (book.genre) {
            const bookGenre = book.genre.toLowerCase()
            // Increase score if the book's genre matches user's favorite genres
            user.favoriteGenres.forEach(genre => {
              if (bookGenre.includes(genre.toLowerCase()) || 
                  genre.toLowerCase().includes(bookGenre)) {
                score += 1
              }
            })
          }
          
          return { book, score }
        })
        
        // Sort by score and return
        return scoredTrending
          .sort((a, b) => b.score - a.score)
          .map(item => item.book)
      }

      return trendingBooks
    } catch (error) {
      console.error("Error getting trending books:", error)
      return []
    }
  }

  /**
   * Score and combine recommendations from different sources
   *
   * @param {Object} user - User object
   * @param {Object} weights - Weight factors for different recommendation strategies
   * @param {Array} genreBooks - Books matching user's genre preferences
   * @param {Array} languageBooks - Books matching user's language preferences
   * @param {Array} demographicBooks - Books matching user's demographic
   * @param {Array} collaborativeBooks - Books from collaborative filtering
   * @param {Array} trendingBooks - Trending books
   * @param {boolean} debug - Whether to enable detailed debugging
   * @returns {Array} - Combined and scored recommendations
   */
  scoreAndCombineRecommendations(
    user,
    weights,
    genreBooks,
    languageBooks,
    demographicBooks,
    collaborativeBooks,
    trendingBooks,
    debug = false
  ) {
    // Map to store scored recommendations with book ID as key
    const recommendationsMap = new Map()

    // Helper function to add books to the recommendations map with a score
    const addBooksWithScore = (books, score) => {
      books.forEach(book => {
        const bookId = book._id.toString()
        
        if (recommendationsMap.has(bookId)) {
          // Update score if book already exists in map
          const existingRec = recommendationsMap.get(bookId)
          existingRec.score += score
          recommendationsMap.set(bookId, existingRec)
        } else {
          // Add new book to map
          recommendationsMap.set(bookId, { 
            book, 
            score,
            matchTypes: [] // Track which strategies matched this book
          })
        }
      })
    }

    // Add books from each source with their respective weights
    addBooksWithScore(genreBooks, weights.genre)
    addBooksWithScore(languageBooks, weights.language)
    addBooksWithScore(demographicBooks, weights.demographic)
    addBooksWithScore(collaborativeBooks, weights.collaborative)
    addBooksWithScore(trendingBooks, weights.trending)

    // Get all scored recommendations
    const scoredRecommendations = Array.from(recommendationsMap.values())

    // Apply bonus for books that match multiple criteria
    scoredRecommendations.forEach(rec => {
      const book = rec.book
      
      // Bonuses based on quality signals
      if (book.rating >= 4.5) {
        rec.score *= 1.2 // 20% bonus for highly rated books
      }
      
      // Give bonus for exact genre and language matches
      if (user.favoriteGenres && user.favoriteGenres.length > 0 && book.genre) {
        const bookGenre = book.genre.toLowerCase()
        user.favoriteGenres.forEach(genre => {
          if (genre.toLowerCase() === bookGenre) {
            rec.score *= 1.3 // 30% bonus for exact genre match
            rec.matchTypes.push('exactGenre')
          }
        })
      }
      
      if (user.preferredLanguages && user.preferredLanguages.length > 0 && book.language) {
        const bookLanguage = book.language.toLowerCase()
        user.preferredLanguages.forEach(language => {
          if (language.toLowerCase() === bookLanguage) {
            rec.score *= 1.3 // 30% bonus for exact language match
            rec.matchTypes.push('exactLanguage')
          }
        })
      }
      
      // Extra bonus for books that match both genre AND language exactly
      if (rec.matchTypes.includes('exactGenre') && rec.matchTypes.includes('exactLanguage')) {
        rec.score *= 1.5 // 50% extra bonus for perfect matches
        rec.matchTypes.push('perfectMatch')
      }
    })

    if (debug) {
      // Log the highest-scoring recommendations
      const topFive = [...scoredRecommendations]
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
      
      console.log("Top 5 scored recommendations:")
      topFive.forEach((rec, i) => {
        console.log(
          `${i + 1}. "${rec.book.title}" - Score: ${rec.score.toFixed(2)} - ` +
          `Genre: ${rec.book.genre}, Language: ${rec.book.language}`
        )
      })
    }

    return scoredRecommendations
  }
}

export default RecommendationEngine