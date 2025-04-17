import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import axios from 'axios';

const RecommendationContext = createContext();

export function useRecommendations() {
  return useContext(RecommendationContext);
}

export function RecommendationProvider({ children }) {
  const [topPicks, setTopPicks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [refreshStatus, setRefreshStatus] = useState({
    isRefreshed: false,
    message: ''
  });
  const [error, setError] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;
  
  // Add a ref to track if the initial data has been loaded
  const initialLoadComplete = useRef(false);
  // Add a ref to track active fetch operations
  const isFetchingRef = useRef(false);

  // Check if recommendations need refreshing based on time
  const shouldRefresh = useCallback(() => {
    if (!lastRefreshed) return true;
    
    // Refresh if data is older than 30 minutes
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    return lastRefreshed < thirtyMinutesAgo;
  }, [lastRefreshed]);

  // Get current user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      try {
        const response = await axios.get('/api/user/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data && response.data.user) {
          setUserProfile(response.data.user);
        }
      } catch (error) {
        console.warn("Failed to fetch user profile:", error);
      }
    };
    
    fetchUserProfile();
  }, []);

  // Load recommendations from localStorage on initial load
  useEffect(() => {
    // Skip if we've already loaded initial data
    if (initialLoadComplete.current) return;
    
    const loadCachedRecommendations = () => {
      const cachedRecommendations = localStorage.getItem('cachedRecommendations');
      
      if (cachedRecommendations) {
        try {
          const parsed = JSON.parse(cachedRecommendations);
          
          // Validate the cached data structure
          if (parsed && parsed.data && Array.isArray(parsed.data) && parsed.data.length > 0) {
            console.log("Loaded recommendations from cache:", parsed.data);
            // Create a new array reference to ensure state update triggers
            setTopPicks([...parsed.data]);
            setLastRefreshed(new Date(parsed.timestamp));
            initialLoadComplete.current = true;
            return true;
          } else {
            console.warn("Cached recommendations found but in invalid format:", parsed);
            localStorage.removeItem('cachedRecommendations');
          }
        } catch (error) {
          console.error("Error parsing cached recommendations:", error);
          localStorage.removeItem('cachedRecommendations');
        }
      }
      return false;
    };
    
    loadCachedRecommendations();
  }, []);

  // Fetch recommendations with optional force refresh
  const fetchRecommendations = useCallback(async (options = {}) => {
    const { force = false, signal, useCache = true } = options;
    
    console.log("fetchRecommendations called, force:", force, "useCache:", useCache);
    console.log("Current state - topPicks length:", topPicks?.length || 0);
    console.log("Should refresh:", shouldRefresh());
    console.log("User profile available:", !!userProfile);
    
    // Critical fix: Use ref to prevent concurrent fetches
    if (isFetchingRef.current && !force) {
      console.log("Already fetching recommendations, skipping duplicate request");
      return [...topPicks];
    }
    
    // Reset retry count on force refresh
    if (force) {
      setRetryCount(0);
    }
    
    // Prevent infinite retry loops
    if (retryCount >= MAX_RETRIES) {
      console.log("Maximum retry attempts reached, using cached data if available");
      setError("Too many failed attempts. Please try again later.");
      
      // Try to use cached data
      const cachedData = localStorage.getItem('cachedRecommendations');
      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData);
          if (parsed?.data?.length > 0) {
            return [...parsed.data];
          }
        } catch (e) {
          console.error("Failed to parse cached data:", e);
        }
      }
      
      return topPicks.length > 0 ? [...topPicks] : [];
    }
    
    // Exit early if already loading to prevent duplicate requests
    if (isLoading && !force) {
      console.log("Skipping fetch because already loading");
      return [...topPicks]; // Return current data
    }
    
    // Clear any previous errors
    setError(null);
    
    // Check if we should use cached data
    if (useCache && !force && !shouldRefresh() && topPicks && topPicks.length > 0) {
      console.log("Using cached recommendations, count:", topPicks.length);
      return [...topPicks]; // Return a new array reference
    }
    
    // Increment retry count on each attempt (except for cached responses)
    if (!useCache || force) {
      setRetryCount(prev => prev + 1);
    }
    
    setIsLoading(true);
    isFetchingRef.current = true; // Set fetching ref flag
    
    try {
      // Get the auth token
      const token = localStorage.getItem('token');
      console.log("Auth token available:", !!token);
      
      // First try the recommendations endpoint
      try {
        console.log("Fetching from recommendations endpoint...");
        
        // Add user-specific query parameters if available
        let params = {};
        if (userProfile) {
          if (userProfile.preferences) params.preferences = userProfile.preferences;
          if (userProfile.readingHistory) params.history = userProfile.readingHistory;
          if (userProfile.id) params.userId = userProfile.id;
        }
        
        // Create a local controller that will be cleaned up
        const localController = new AbortController();
        const combinedSignal = signal || localController.signal;
        const timeoutId = setTimeout(() => {
          try {
            localController.abort();
          } catch (e) {
            console.warn("Failed to abort request:", e);
          }
        }, 8000);
        
        const response = await axios.get('/api/books/recommendations', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          params: params,
          signal: combinedSignal,
          timeout: 10000
        });
        
        clearTimeout(timeoutId);
        console.log("Raw response data:", response.data);
        
        // More flexible data extraction handling different API response formats
        let recommendationsArray = [];
        
        if (response.data) {
          if (Array.isArray(response.data)) {
            // Direct array response
            recommendationsArray = [...response.data];
          } else if (response.data.data && Array.isArray(response.data.data)) {
            // Nested data property response
            recommendationsArray = [...response.data.data];
          } else if (typeof response.data === 'object') {
            // Try to find an array somewhere in the response
            const possibleArrays = Object.values(response.data).filter(val => Array.isArray(val));
            if (possibleArrays.length > 0) {
              // Use the first array found
              recommendationsArray = [...possibleArrays[0]];
            }
          }
        }
        
        // Validate that each recommendation has an ID to prevent rendering issues
        recommendationsArray = recommendationsArray.filter(item => 
          item && typeof item === 'object' && (item._id || item.id)
        );
        
        if (recommendationsArray.length > 0) {
          console.log("Successfully processed recommendations. Count:", recommendationsArray.length);
          setTopPicks(recommendationsArray);
          
          const now = new Date();
          setLastRefreshed(now);
          initialLoadComplete.current = true;
          
          // Only cache if this was a successful personalized request
          if (token) {
            localStorage.setItem('cachedRecommendations', JSON.stringify({
              data: recommendationsArray,
              timestamp: now.toISOString(),
              personalized: !!token
            }));
          }
          
          setRefreshStatus({
            isRefreshed: true,
            message: token ? 'Personal recommendations updated!' : 'Recommendations updated!'
          });
          
          // Reset status after 3 seconds
          setTimeout(() => {
            setRefreshStatus({
              isRefreshed: false,
              message: ''
            });
          }, 3000);
          
          return recommendationsArray;
        } else {
          console.warn("No valid recommendations found in response");
          throw new Error("No valid recommendations found in response");
        }
      } catch (recommendationsError) {
        // Fix: Better cancellation detection
        if (recommendationsError.name === 'CanceledError' || 
            recommendationsError.name === 'AbortError' ||
            (recommendationsError.code && recommendationsError.code === 'ERR_CANCELED') ||
            axios.isCancel(recommendationsError)) {
          console.log("Request was canceled, not falling back to trending");
          throw recommendationsError; // Rethrow to be handled by the outer catch
        }
        
        console.warn("Failed to get recommendations, trying trending instead:", recommendationsError);
        
        // Fall back to trending endpoint
        console.log("Fetching from trending endpoint...");
        
        // Create a new controller for trending request
        const localController = new AbortController();
        const combinedSignal = signal || localController.signal;
        const timeoutId = setTimeout(() => {
          try {
            localController.abort();
          } catch (e) {
            console.warn("Failed to abort trending request:", e);
          }
        }, 8000);
        
        const trendingResponse = await axios.get('/api/books/trending', {
          signal: combinedSignal,
          timeout: 10000
        });
        
        clearTimeout(timeoutId);
        console.log("Trending response data:", trendingResponse.data);
        
        // Apply the same flexible data extraction logic
        let trendingArray = [];
        
        if (trendingResponse.data) {
          if (Array.isArray(trendingResponse.data)) {
            trendingArray = [...trendingResponse.data];
          } else if (trendingResponse.data.data && Array.isArray(trendingResponse.data.data)) {
            trendingArray = [...trendingResponse.data.data];
          } else if (typeof trendingResponse.data === 'object') {
            const possibleArrays = Object.values(trendingResponse.data).filter(val => Array.isArray(val));
            if (possibleArrays.length > 0) {
              trendingArray = [...possibleArrays[0]];
            }
          }
        }
        
        // Validate that each trending book has an ID
        trendingArray = trendingArray.filter(item =>
          item && typeof item === 'object' && (item._id || item.id)
        );
        
        if (trendingArray.length > 0) {
          console.log("Using trending books as fallback. Count:", trendingArray.length);
          setTopPicks(trendingArray);
          
          const now = new Date();
          setLastRefreshed(now);
          initialLoadComplete.current = true;
          
          // Cache the trending books as fallback
          localStorage.setItem('cachedRecommendations', JSON.stringify({
            data: trendingArray,
            timestamp: now.toISOString(),
            personalized: false
          }));
          
          setRefreshStatus({
            isRefreshed: true,
            message: 'Using trending books (couldn\'t get personalized recommendations)'
          });
          
          // Reset status after 3 seconds
          setTimeout(() => {
            setRefreshStatus({
              isRefreshed: false,
              message: ''
            });
          }, 3000);
          
          return trendingArray;
        } else {
          console.warn("No valid trending books found either");
          throw new Error("No trending books found either");
        }
      }
    } catch (error) {
      // Fix: Use Axios's isCancel helper in addition to name checks
      const isRequestCanceled = error.name === 'CanceledError' || 
                               error.name === 'AbortError' || 
                               (error.code && error.code === 'ERR_CANCELED') ||
                               axios.isCancel(error);
      
      if (isRequestCanceled) {
        console.log("Request was canceled, not retrying");
        // Fix: Don't set error for canceled requests, as this triggers re-renders
        return topPicks.length > 0 ? [...topPicks] : [];
      }
      
      console.error("Error fetching recommendations:", error);
      
      // Add circuit breaker to prevent infinite retries
      setError("Failed to load recommendations. Please try again later.");
      
      // Use existing data if available
      if (topPicks && topPicks.length > 0) {
        return [...topPicks];
      }
      
      // Final fallback - try cached data then empty array
      try {
        const cachedData = localStorage.getItem('cachedRecommendations');
        if (cachedData) {
          const parsed = JSON.parse(cachedData);
          if (parsed && parsed.data && Array.isArray(parsed.data)) {
            return [...parsed.data];
          }
        }
      } catch (e) {
        console.error("Cache recovery failed:", e);
      }
      
      return []; // Empty array as final fallback
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false; // Clear fetching flag
      console.log("Recommendations loading:", false);
      console.log("Final topPicks state:", topPicks);
    }
  }, [topPicks, lastRefreshed, shouldRefresh, userProfile, isLoading, retryCount]);
  
  // Manual refresh trigger for recommendation refresh API endpoint
  const triggerRecommendationRefresh = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn("No token available for recommendation refresh");
        setError("Authentication required to refresh recommendations");
        return;
      }
      
      // Prevent concurrent refresh operations
      if (isFetchingRef.current) {
        console.log("Already fetching, not triggering another refresh");
        return topPicks.length > 0 ? [...topPicks] : [];
      }
      
      setIsLoading(true);
      isFetchingRef.current = true;
      console.log("Triggering recommendation refresh on backend...");
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        try {
          controller.abort();
        } catch (e) {
          console.warn("Failed to abort refresh request:", e);
        }
      }, 8000);
      
      const response = await axios.post('/api/books/refresh-recommendations', {}, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
        timeout: 10000
      });
      
      clearTimeout(timeoutId);
      console.log("Refresh trigger response:", response.data);
      
      // After backend refreshes recommendations, fetch the new ones with force and no cache
      const newRecommendations = await fetchRecommendations({ force: true, useCache: false });
      
      return newRecommendations;
    } catch (error) {
      // Fix: Better cancellation check
      const isRequestCanceled = error.name === 'CanceledError' || 
                               error.name === 'AbortError' || 
                               (error.code && error.code === 'ERR_CANCELED') ||
                               axios.isCancel(error);
      
      if (isRequestCanceled) {
        console.log("Refresh request was canceled");
        return topPicks.length > 0 ? [...topPicks] : [];
      }
      
      console.error("Error triggering recommendation refresh:", error);
      setError(error.message || "Failed to refresh recommendations");
      
      // Even if refresh fails, try to fetch existing recommendations
      await fetchRecommendations({ force: true });
      
      throw error;
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [fetchRecommendations, topPicks]);
  
  // Reset local cached recommendations when user logs out
  const clearRecommendations = useCallback(() => {
    setTopPicks([]);
    setLastRefreshed(null);
    setError(null);
    setUserProfile(null);
    setRetryCount(0);
    localStorage.removeItem('cachedRecommendations');
    console.log("Recommendations cleared");
  }, []);
  
  // Check for auth changes
  useEffect(() => {
    const handleAuthChange = (event) => {
      if (event.key === 'token') {
        const token = localStorage.getItem('token');
        if (!token) {
          // User logged out
          clearRecommendations();
        } else {
          // User logged in, fetch personalized recommendations
          // Add a delay to prevent immediate retrigger
          setTimeout(() => {
            fetchRecommendations({ force: true, useCache: false });
          }, 300);
        }
      }
    };
    
    // Listen for storage events (like token changes)
    window.addEventListener('storage', handleAuthChange);
    
    return () => {
      window.removeEventListener('storage', handleAuthChange);
    };
  }, [clearRecommendations, fetchRecommendations]);

  // Initial data fetch - only run once
  useEffect(() => {
    // Skip fetch if we already have data from cache
    if (initialLoadComplete.current) {
      console.log("Skipping initial fetch as we already have data");
      return;
    }
    
    const controller = new AbortController();
    
    const initialFetch = async () => {
      try {
        console.log("Performing initial data fetch");
        await fetchRecommendations({ 
          useCache: true, 
          signal: controller.signal 
        });
        initialLoadComplete.current = true;
      } catch (error) {
        const isRequestCanceled = error.name === 'CanceledError' || 
                                 error.name === 'AbortError' || 
                                 (error.code && error.code === 'ERR_CANCELED') ||
                                 axios.isCancel(error);
        
        if (!isRequestCanceled) {
          console.error("Initial fetch failed:", error);
        }
      }
    };
    
    // Add small delay to avoid React 18 double-mount issues
    const timeoutId = setTimeout(() => {
      initialFetch();
    }, 100);
    
    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [fetchRecommendations]);

  const value = {
    topPicks,
    isLoading,
    lastRefreshed,
    refreshStatus,
    error,
    fetchRecommendations,
    triggerRecommendationRefresh,
    clearRecommendations,
    isPersonalized: !!userProfile
  };

  return (
    <RecommendationContext.Provider value={value}>
      {children}
    </RecommendationContext.Provider>
  );
}