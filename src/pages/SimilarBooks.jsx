import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { BookOpen, Star } from 'lucide-react';

const SimilarBooks = ({ bookId, limit = 4 }) => {
  const [similarBooks, setSimilarBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSimilarBooks = async () => {
      if (!bookId) return;
      
      setLoading(true);
      try {
        const response = await axios.get(`/api/books/${bookId}/similar?limit=${limit}`);
        setSimilarBooks(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching similar books:', err);
        setError('Failed to load similar books');
      } finally {
        setLoading(false);
      }
    };

    fetchSimilarBooks();
  }, [bookId, limit]);

  if (loading) {
    return (
      <div className="my-8">
        <h2 className="text-xl font-bold mb-4">Because You Like This Book</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(limit)].map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-200 rounded-md h-40"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error || similarBooks.length === 0) {
    return null;
  }

  return (
    <div className="my-8">
      <h2 className="text-xl font-bold mb-4">Because You Like This Book</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {similarBooks.map((book) => (
          <Link 
            to={`/books/${book._id}`} 
            key={book._id} 
            className="group bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300"
          >
            <div className="aspect-w-2 aspect-h-3 w-full overflow-hidden bg-gray-100">
              {book.coverImage ? (
                <img 
                  src={book.coverImage} 
                  alt={book.title} 
                  className="object-cover object-center w-full h-full group-hover:scale-105 transition-transform duration-300" 
                />
              ) : (
                <div className="flex items-center justify-center h-full bg-gray-200">
                  <BookOpen size={24} className="text-gray-400" />
                </div>
              )}
            </div>
            
            <div className="p-3">
              <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors duration-300 truncate text-sm">
                {book.title}
              </h3>
              <p className="text-xs text-gray-500 truncate">{book.author}</p>
              
              <div className="mt-1 flex items-center">
                <Star size={12} className={`${book.rating >= 4 ? 'text-yellow-400' : 'text-gray-300'} fill-current`} />
                <span className="ml-1 text-xs text-gray-600">{book.rating.toFixed(1)}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default SimilarBooks;