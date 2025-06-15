import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
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

  // Check if recommendations need refreshing based on time
  const shouldRefresh = useCallback(() => {
    if (!lastRefreshed) return true;
    
    // Refresh if data is older than 30 minutes
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    return lastRefreshed < thirtyMinutesAgo;
  }, [lastRefreshed]);

  // Load recommendations from localStorage on initial load
  useEffect(() => {
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
    const { force = false, signal } = options;
    
    console.log("fetchRecommendations called, force:", force);
    console.log("Current state - topPicks length:", topPicks?.length || 0);
    console.log("Should refresh:", shouldRefresh());
    
    // Clear any previous errors
    setError(null);
    
    // Check if we should use cached data
    if (!force && !shouldRefresh() && topPicks && topPicks.length > 0) {
      console.log("Using cached recommendations, count:", topPicks.length);
      return [...topPicks]; // Return a new array reference
    }
    
    setIsLoading(true);
    try {
      // Get the auth token
      const token = localStorage.getItem('token');
      console.log("Auth token available:", !!token);
      
      // First try the recommendations endpoint
      try {
        console.log("Fetching from recommendations endpoint...");
        const response = await axios.get('/api/books/recommendations', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          signal: signal
        });
        
        console.log("Raw response data:", response.data);
        
        // Check if we got data in the expected format
        if (response.data && response.data.data && Array.isArray(response.data.data)) {
          console.log("Successfully received recommendations. Count:", response.data.data.length);
          
          // Important: Make sure we're setting an array, not another data type
          const recommendationsArray = [...response.data.data];
          setTopPicks(recommendationsArray);
          
          const now = new Date();
          setLastRefreshed(now);
          
          // Cache the recommendations
          localStorage.setItem('cachedRecommendations', JSON.stringify({
            data: recommendationsArray,
            timestamp: now.toISOString()
          }));
          
          setRefreshStatus({
            isRefreshed: true,
            message: 'Recommendations updated!'
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
          console.warn("Invalid response format:", response.data);
          throw new Error("Invalid response format or empty recommendations");
        }
      } catch (recommendationsError) {
        console.warn("Failed to get recommendations, trying trending instead:", recommendationsError);
        
        // Fall back to trending endpoint
        console.log("Fetching from trending endpoint...");
        const trendingResponse = await axios.get('/api/books/trending', {
          signal: signal
        });
        
        console.log("Trending response data:", trendingResponse.data);
        
        if (trendingResponse.data && trendingResponse.data.data && Array.isArray(trendingResponse.data.data) && trendingResponse.data.data.length > 0) {
          console.log("Using trending books as fallback. Count:", trendingResponse.data.data.length);
          
          // Again, ensure we're setting a proper array
          const trendingArray = [...trendingResponse.data.data];
          setTopPicks(trendingArray);
          
          const now = new Date();
          setLastRefreshed(now);
          
          // Cache the trending books as fallback
          localStorage.setItem('cachedRecommendations', JSON.stringify({
            data: trendingArray,
            timestamp: now.toISOString()
          }));
          
          return trendingArray;
        } else {
          console.warn("Invalid trending response format:", trendingResponse.data);
          throw new Error("No trending books found either");
        }
      }
    } catch (error) {
      // Ignore aborted requests
      if (error.name === 'CanceledError' || error.name === 'AbortError') {
        console.log("Request was canceled");
        return [...topPicks]; // Return a new array reference
      }
      
      console.error("Error fetching recommendations:", error);
      
      // Store the error for UI feedback
      setError(error.message || "Failed to fetch recommendations");
      
      setRefreshStatus({
        isRefreshed: false,
        message: 'Failed to update recommendations'
      });
      
      // If we have cached data, still return it despite the error
      if (topPicks && topPicks.length > 0) {
        console.log("Returning existing topPicks despite error:", topPicks);
        return [...topPicks]; // Return a new array reference
      }
      
      // Try to load from cache one more time
      const cachedRecommendations = localStorage.getItem('cachedRecommendations');
      if (cachedRecommendations) {
        try {
          const parsed = JSON.parse(cachedRecommendations);
          if (parsed && parsed.data && Array.isArray(parsed.data) && parsed.data.length > 0) {
            console.log("Using cached recommendations after error:", parsed.data);
            // Don't update state here, just return the data
            return [...parsed.data];
          }
        } catch (cacheError) {
          console.error("Error parsing cached recommendations during error recovery:", cacheError);
        }
      }
      
      return []; // Return empty array if all else fails
    } finally {
      setIsLoading(false);
      console.log("Recommendations loading:", false);
      console.log("Final topPicks state:", topPicks);
    }
  }, [topPicks, lastRefreshed, shouldRefresh]);
  
  // Manual refresh trigger for recommendation refresh API endpoint
  const triggerRecommendationRefresh = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn("No token available for recommendation refresh");
        setError("Authentication required to refresh recommendations");
        return;
      }
      
      setIsLoading(true);
      console.log("Triggering recommendation refresh on backend...");
      
      const response = await axios.post('/api/books/refresh-recommendations', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log("Refresh trigger response:", response.data);
      
      // After backend refreshes recommendations, fetch the new ones
      const newRecommendations = await fetchRecommendations({ force: true });
      
      return newRecommendations;
    } catch (error) {
      console.error("Error triggering recommendation refresh:", error);
      setError(error.message || "Failed to trigger recommendation refresh");
      
      // Even if refresh fails, try to fetch existing recommendations
      await fetchRecommendations({ force: true });
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [fetchRecommendations]);
  
  // Reset local cached recommendations when user logs out
  const clearRecommendations = useCallback(() => {
    setTopPicks([]);
    setLastRefreshed(null);
    setError(null);
    localStorage.removeItem('cachedRecommendations');
    console.log("Recommendations cleared");
  }, []);

  const value = {
    topPicks,
    isLoading,
    lastRefreshed,
    refreshStatus,
    error,
    fetchRecommendations,
    triggerRecommendationRefresh,
    clearRecommendations
  };

  return (
    <RecommendationContext.Provider value={value}>
      {children}
    </RecommendationContext.Provider>
  );
}