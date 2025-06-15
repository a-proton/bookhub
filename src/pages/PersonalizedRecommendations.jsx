import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { BookOpen, Star, Globe, Bookmark } from 'lucide-react';
import { useAuth } from './../contexts/AuthContext';  

const PersonalizedRecommendations = ({ 
  title = "Top Picks For You",
  limit = 6, 
  preferredGenre = null 
}) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isAuthenticated, user } = useAuth(); // Get auth status
  const [debugMode, setDebugMode] = useState(false); // For debugging

  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoading(true);
      try {
        let response;
        
        // Add timestamp to prevent caching
        const timestamp = new Date().getTime();
        
        // Build query params
        const queryParams = new URLSearchParams();
        queryParams.append('limit', limit);
        queryParams.append('t', timestamp); // Cache busting
        if (preferredGenre) {
          queryParams.append('genre', preferredGenre);
        }
        
        // Use different endpoints based on authentication status
        if (isAuthenticated && user) {
          // For logged-in users - personalized recommendations
          response = await axios.get(`/api/books/recommendations?${queryParams}`, {
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
          });
        } else {
          // For non-logged-in users - generic recommendations
          response = await axios.get(`/api/books/recommended?${queryParams}`, {
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
          });
        }
        
        console.log('Recommendation data:', response.data);
        setRecommendations(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching recommendations:', err);
        setError('Failed to load recommendations. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [isAuthenticated, user, limit, preferredGenre]);

  // Function to refresh recommendations
  const refreshRecommendations = async () => {
    try {
      setLoading(true);
      
      // Build query params with cache busting
      const queryParams = new URLSearchParams();
      queryParams.append('limit', limit);
      queryParams.append('t', new Date().getTime());
      if (preferredGenre) {
        queryParams.append('genre', preferredGenre);
      }
      
      const endpoint = isAuthenticated && user
        ? `/api/books/recommendations?${queryParams}`
        : `/api/books/recommended?${queryParams}`;
      
      const response = await axios.get(endpoint, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      console.log('Refreshed recommendations:', response.data);
      setRecommendations(response.data);
      setError(null);
    } catch (err) {
      console.error('Error refreshing recommendations:', err);
      setError('Failed to refresh recommendations. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full py-8 text-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-6 bg-gray-200 rounded-full w-1/3 mb-4"></div>
          <div className="flex flex-wrap justify-center gap-6">
            {[...Array(limit)].map((_, i) => (
              <div key={i} className="w-48 h-64 bg-gray-200 rounded-md"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full py-8 text-center text-red-500">
        <p>{error}</p>
        <button 
          onClick={refreshRecommendations}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="w-full py-8 text-center">
        <p className="text-gray-500">No recommendations available at this time.</p>
        <button 
          onClick={refreshRecommendations}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Refresh Recommendations
        </button>
      </div>
    );
  }

  return (
    <div className="w-full py-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">{title}</h2>
        <div className="flex items-center gap-3">
          {isAuthenticated && (
            <span className="text-sm text-blue-600">Personalized for you</span>
          )}
          <button 
            onClick={refreshRecommendations}
            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-sm rounded flex items-center gap-1 transition-colors"
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          <button
            onClick={() => setDebugMode(!debugMode)}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            {debugMode ? 'Hide Debug' : 'Debug'}
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {recommendations.map((book) => (
          <Link 
            to={`/books/${book._id}`} 
            key={book._id} 
            className="group bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300"
          >
            <div className="aspect-w-2 aspect-h-3 w-full overflow-hidden bg-gray-100 relative">
              {book.coverImage ? (
                <img 
                  src={book.coverImage} 
                  alt={book.title} 
                  className="object-cover object-center w-full h-full group-hover:scale-105 transition-transform duration-300" 
                />
              ) : (
                <div className="flex items-center justify-center h-full bg-gray-200">
                  <BookOpen size={48} className="text-gray-400" />
                </div>
              )}
              
              {/* Language Badge */}
              {book.language && (
                <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  <Globe size={12} />
                  <span>{book.language}</span>
                </div>
              )}
              
              {/* Genre Badge */}
              {book.genre && (
                <div className="absolute top-2 right-2 bg-purple-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  <Bookmark size={12} />
                  <span>{book.genre}</span>
                </div>
              )}
            </div>
            
            <div className="p-4">
              <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors duration-300 truncate">
                {book.title}
              </h3>
              <p className="text-sm text-gray-500 truncate">{book.author}</p>
              
              <div className="mt-2 flex items-center">
                <Star 
                  size={16} 
                  className={`${book.rating && book.rating >= 4 ? 'text-yellow-400' : 'text-gray-300'} fill-current`} 
                />
                <span className="ml-1 text-sm text-gray-600">
                  {book.rating ? book.rating.toFixed(1) : 'N/A'}
                </span>
                <span className="ml-auto text-sm font-medium text-green-600">
                  ${book.price ? book.price.toFixed(2) : '0.00'}
                </span>
              </div>
              
              {/* Enhanced info row */}
              {(book.language || book.genre) && (
                <div className="mt-2 flex items-center text-xs text-gray-500">
                  {book.language && (
                    <div className="mr-2">
                      <span className="font-medium">Lang:</span> {book.language}
                    </div>
                  )}
                  {book.genre && (
                    <div>
                      <span className="font-medium">Genre:</span> {book.genre}
                    </div>
                  )}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
      
      {/* Debug Panel */}
      {debugMode && (
        <div className="mt-8 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h3 className="font-bold mb-2">Debug Information</h3>
          <p className="mb-2">Recommendation count: {recommendations.length}</p>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 text-left">Title</th>
                  <th className="p-2 text-left">Language</th>
                  <th className="p-2 text-left">Genre</th>
                  <th className="p-2 text-left">Rating</th>
                </tr>
              </thead>
              <tbody>
                {recommendations.map((book, index) => (
                  <tr key={book._id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="p-2">{book.title}</td>
                    <td className="p-2">{book.language || 'N/A'}</td>
                    <td className="p-2">{book.genre || 'N/A'}</td>
                    <td className="p-2">{book.rating || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonalizedRecommendations;