"use client"

import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react"
import axios from "axios"

const RecommendationContext = createContext()

export function useRecommendations() {
  return useContext(RecommendationContext)
}

export function RecommendationProvider({ children }) {
  const [topPicks, setTopPicks] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [lastRefreshed, setLastRefreshed] = useState(null)
  const [refreshStatus, setRefreshStatus] = useState({
    isRefreshed: false,
    message: "",
  })
  const [error, setError] = useState(null)
  const [userProfile, setUserProfile] = useState(null)

  // Add refs to prevent infinite loops and track state
  const isFetchingRef = useRef(false)
  const initialLoadComplete = useRef(false)
  const lastFetchTime = useRef(0)
  const fetchCooldown = 10000 // 10 seconds between fetches

  // Check if recommendations need refreshing based on time
  const shouldRefresh = useCallback(() => {
    if (!lastRefreshed) return true

    // Refresh if data is older than 30 minutes
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000)
    return lastRefreshed < thirtyMinutesAgo
  }, [lastRefreshed])

  // Load recommendations from localStorage on initial load
  useEffect(() => {
    // Skip if we've already loaded initial data
    if (initialLoadComplete.current) return

    const loadCachedRecommendations = () => {
      const cachedRecommendations = localStorage.getItem("cachedRecommendations")

      if (cachedRecommendations) {
        try {
          const parsed = JSON.parse(cachedRecommendations)

          // Validate the cached data structure
          if (parsed && parsed.data && Array.isArray(parsed.data) && parsed.data.length > 0) {
            console.log("Loaded recommendations from cache:", parsed.data.length)
            setTopPicks([...parsed.data])
            setLastRefreshed(new Date(parsed.timestamp))
            initialLoadComplete.current = true
            return true
          } else {
            console.warn("Cached recommendations found but in invalid format")
            localStorage.removeItem("cachedRecommendations")
          }
        } catch (error) {
          console.error("Error parsing cached recommendations:", error)
          localStorage.removeItem("cachedRecommendations")
        }
      }
      return false
    }

    loadCachedRecommendations()
  }, [])

  // Get current user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      const token = localStorage.getItem("token")
      if (!token) return

      try {
        const response = await axios.get("/api/user/profile", {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (response.data && response.data.user) {
          setUserProfile(response.data.user)
        }
      } catch (error) {
        console.warn("Failed to fetch user profile:", error)
      }
    }

    fetchUserProfile()
  }, [])

  // Fetch recommendations with optional force refresh
  const fetchRecommendations = useCallback(
    async (options = {}) => {
      const { force = false, signal, useCache = true } = options

      // CRITICAL FIX: Implement cooldown between fetches
      const now = Date.now()
      if (!force && now - lastFetchTime.current < fetchCooldown) {
        console.log(
          `Fetch cooldown active (${(now - lastFetchTime.current) / 1000}s < ${fetchCooldown / 1000}s), skipping request`,
        )
        return [...topPicks]
      }

      // CRITICAL FIX: Prevent concurrent fetches
      if (isFetchingRef.current && !force) {
        console.log("Already fetching recommendations, skipping duplicate request")
        return [...topPicks]
      }

      // Check if we should use cached data
      if (useCache && !force && !shouldRefresh() && topPicks && topPicks.length > 0) {
        console.log("Using cached recommendations, count:", topPicks.length)
        return [...topPicks]
      }

      // Clear any previous errors
      setError(null)

      // Set loading state and fetching flag
      setIsLoading(true)
      isFetchingRef.current = true
      lastFetchTime.current = now

      try {
        // Get the auth token
        const token = localStorage.getItem("token")

        // First try the recommendations endpoint
        try {
          console.log("Fetching from recommendations endpoint...")

          // Create a local controller that will be cleaned up
          const localController = new AbortController()
          const combinedSignal = signal || localController.signal
          const timeoutId = setTimeout(() => {
            try {
              localController.abort()
            } catch (e) {
              console.warn("Failed to abort request:", e)
            }
          }, 8000)

          const response = await axios.get("/api/books/recommendations", {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            signal: combinedSignal,
            timeout: 10000,
          })

          clearTimeout(timeoutId)

          // Extract recommendations from response
          let recommendationsArray = []

          if (response.data) {
            if (Array.isArray(response.data)) {
              recommendationsArray = [...response.data]
            } else if (response.data.data && Array.isArray(response.data.data)) {
              recommendationsArray = [...response.data.data]
            } else if (typeof response.data === "object") {
              const possibleArrays = Object.values(response.data).filter((val) => Array.isArray(val))
              if (possibleArrays.length > 0) {
                recommendationsArray = [...possibleArrays[0]]
              }
            }
          }

          // Validate recommendations
          recommendationsArray = recommendationsArray.filter(
            (item) => item && typeof item === "object" && (item._id || item.id),
          )

          if (recommendationsArray.length > 0) {
            console.log("Successfully processed recommendations. Count:", recommendationsArray.length)

            // CRITICAL FIX: Deep compare before updating state to prevent unnecessary re-renders
            const shouldUpdateState = !areArraysEqual(topPicks, recommendationsArray)

            if (shouldUpdateState) {
              setTopPicks(recommendationsArray)

              const now = new Date()
              setLastRefreshed(now)
              initialLoadComplete.current = true

              // Cache recommendations
              localStorage.setItem(
                "cachedRecommendations",
                JSON.stringify({
                  data: recommendationsArray,
                  timestamp: now.toISOString(),
                  personalized: !!token,
                }),
              )

              setRefreshStatus({
                isRefreshed: true,
                message: token ? "Personal recommendations updated!" : "Recommendations updated!",
              })

              // Reset status after 3 seconds
              setTimeout(() => {
                setRefreshStatus({
                  isRefreshed: false,
                  message: "",
                })
              }, 3000)
            } else {
              console.log("Recommendations unchanged, not updating state")
            }

            return recommendationsArray
          } else {
            throw new Error("No valid recommendations found in response")
          }
        } catch (recommendationsError) {
          // Check if request was canceled
          if (
            recommendationsError.name === "CanceledError" ||
            recommendationsError.name === "AbortError" ||
            (recommendationsError.code && recommendationsError.code === "ERR_CANCELED") ||
            axios.isCancel(recommendationsError)
          ) {
            throw recommendationsError
          }

          console.warn("Failed to get recommendations, trying trending instead:", recommendationsError)

          // Fall back to trending endpoint
          console.log("Fetching from trending endpoint...")

          const localController = new AbortController()
          const combinedSignal = signal || localController.signal
          const timeoutId = setTimeout(() => {
            try {
              localController.abort()
            } catch (e) {
              console.warn("Failed to abort trending request:", e)
            }
          }, 8000)

          const trendingResponse = await axios.get("/api/books/trending", {
            signal: combinedSignal,
            timeout: 10000,
          })

          clearTimeout(timeoutId)

          // Extract trending books
          let trendingArray = []

          if (trendingResponse.data) {
            if (Array.isArray(trendingResponse.data)) {
              trendingArray = [...trendingResponse.data]
            } else if (trendingResponse.data.data && Array.isArray(trendingResponse.data.data)) {
              trendingArray = [...trendingResponse.data.data]
            } else if (typeof trendingResponse.data === "object") {
              const possibleArrays = Object.values(trendingResponse.data).filter((val) => Array.isArray(val))
              if (possibleArrays.length > 0) {
                trendingArray = [...possibleArrays[0]]
              }
            }
          }

          // Validate trending books
          trendingArray = trendingArray.filter((item) => item && typeof item === "object" && (item._id || item.id))

          if (trendingArray.length > 0) {
            console.log("Using trending books as fallback. Count:", trendingArray.length)

            // CRITICAL FIX: Deep compare before updating state
            const shouldUpdateState = !areArraysEqual(topPicks, trendingArray)

            if (shouldUpdateState) {
              setTopPicks(trendingArray)

              const now = new Date()
              setLastRefreshed(now)
              initialLoadComplete.current = true

              // Cache trending books
              localStorage.setItem(
                "cachedRecommendations",
                JSON.stringify({
                  data: trendingArray,
                  timestamp: now.toISOString(),
                  personalized: false,
                }),
              )

              setRefreshStatus({
                isRefreshed: true,
                message: "Using trending books (couldn't get personalized recommendations)",
              })

              // Reset status after 3 seconds
              setTimeout(() => {
                setRefreshStatus({
                  isRefreshed: false,
                  message: "",
                })
              }, 3000)
            } else {
              console.log("Trending books unchanged, not updating state")
            }

            return trendingArray
          } else {
            throw new Error("No trending books found either")
          }
        }
      } catch (error) {
        // Check if request was canceled
        const isRequestCanceled =
          error.name === "CanceledError" ||
          error.name === "AbortError" ||
          (error.code && error.code === "ERR_CANCELED") ||
          axios.isCancel(error)

        if (isRequestCanceled) {
          console.log("Request was canceled, not retrying")
          return topPicks.length > 0 ? [...topPicks] : []
        }

        console.error("Error fetching recommendations:", error)
        setError("Failed to load recommendations. Please try again later.")

        // Use existing data if available
        if (topPicks && topPicks.length > 0) {
          return [...topPicks]
        }

        // Try to use cached data
        try {
          const cachedData = localStorage.getItem("cachedRecommendations")
          if (cachedData) {
            const parsed = JSON.parse(cachedData)
            if (parsed && parsed.data && Array.isArray(parsed.data)) {
              return [...parsed.data]
            }
          }
        } catch (e) {
          console.error("Cache recovery failed:", e)
        }

        return [] // Empty array as final fallback
      } finally {
        setIsLoading(false)
        isFetchingRef.current = false // Clear fetching flag
      }
    },
    [topPicks, lastRefreshed, shouldRefresh],
  )

  // Helper function to deep compare arrays of objects
  function areArraysEqual(arr1, arr2) {
    if (!arr1 || !arr2) return false
    if (arr1.length !== arr2.length) return false

    // Compare each book by ID
    const arr1Ids = new Set(arr1.map((book) => book._id || book.id))
    const arr2Ids = new Set(arr2.map((book) => book._id || book.id))

    if (arr1Ids.size !== arr2Ids.size) return false

    for (const id of arr1Ids) {
      if (!arr2Ids.has(id)) return false
    }

    return true
  }

  // Manual refresh trigger for recommendation refresh API endpoint
  const triggerRecommendationRefresh = useCallback(async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        console.warn("No token available for recommendation refresh")
        setError("Authentication required to refresh recommendations")
        return
      }

      // Prevent concurrent refresh operations
      if (isFetchingRef.current) {
        console.log("Already fetching, not triggering another refresh")
        return topPicks.length > 0 ? [...topPicks] : []
      }

      setIsLoading(true)
      isFetchingRef.current = true
      console.log("Triggering recommendation refresh on backend...")

      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        try {
          controller.abort()
        } catch (e) {
          console.warn("Failed to abort refresh request:", e)
        }
      }, 8000)

      const response = await axios.post(
        "/api/books/refresh-recommendations",
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
          timeout: 10000,
        },
      )

      clearTimeout(timeoutId)
      console.log("Refresh trigger response:", response.data)

      // After backend refreshes recommendations, fetch the new ones with force and no cache
      const newRecommendations = await fetchRecommendations({ force: true, useCache: false })

      return newRecommendations
    } catch (error) {
      // Check if request was canceled
      const isRequestCanceled =
        error.name === "CanceledError" ||
        error.name === "AbortError" ||
        (error.code && error.code === "ERR_CANCELED") ||
        axios.isCancel(error)

      if (isRequestCanceled) {
        console.log("Refresh request was canceled")
        return topPicks.length > 0 ? [...topPicks] : []
      }

      console.error("Error triggering recommendation refresh:", error)
      setError(error.message || "Failed to refresh recommendations")

      // Even if refresh fails, try to fetch existing recommendations
      await fetchRecommendations({ force: true })

      throw error
    } finally {
      setIsLoading(false)
      isFetchingRef.current = false
    }
  }, [fetchRecommendations, topPicks])

  // Reset local cached recommendations when user logs out
  const clearRecommendations = useCallback(() => {
    setTopPicks([])
    setLastRefreshed(null)
    setError(null)
    setUserProfile(null)
    localStorage.removeItem("cachedRecommendations")
    console.log("Recommendations cleared")
  }, [])

  // Check for auth changes
  useEffect(() => {
    const handleAuthChange = (event) => {
      if (event.key === "token") {
        const token = localStorage.getItem("token")
        if (!token) {
          // User logged out
          clearRecommendations()
        } else {
          // User logged in, fetch personalized recommendations
          // Add a delay to prevent immediate retrigger
          setTimeout(() => {
            fetchRecommendations({ force: true, useCache: false })
          }, 300)
        }
      }
    }

    // Listen for storage events (like token changes)
    window.addEventListener("storage", handleAuthChange)

    return () => {
      window.removeEventListener("storage", handleAuthChange)
    }
  }, [clearRecommendations, fetchRecommendations])

  // Initial data fetch - only run once
  useEffect(() => {
    // Skip fetch if we already have data from cache
    if (initialLoadComplete.current) {
      console.log("Skipping initial fetch as we already have data")
      return
    }

    const controller = new AbortController()

    const initialFetch = async () => {
      try {
        console.log("Performing initial data fetch")
        await fetchRecommendations({
          useCache: true,
          signal: controller.signal,
        })
        initialLoadComplete.current = true
      } catch (error) {
        const isRequestCanceled =
          error.name === "CanceledError" ||
          error.name === "AbortError" ||
          (error.code && error.code === "ERR_CANCELED") ||
          axios.isCancel(error)

        if (!isRequestCanceled) {
          console.error("Initial fetch failed:", error)
        }
      }
    }

    // Add small delay to avoid React 18 double-mount issues
    const timeoutId = setTimeout(() => {
      initialFetch()
    }, 100)

    return () => {
      clearTimeout(timeoutId)
      controller.abort()
    }
  }, [fetchRecommendations])

  const value = {
    topPicks,
    isLoading,
    lastRefreshed,
    refreshStatus,
    error,
    fetchRecommendations,
    triggerRecommendationRefresh,
    clearRecommendations,
    isPersonalized: !!userProfile,
  }

  return <RecommendationContext.Provider value={value}>{children}</RecommendationContext.Provider>
}
