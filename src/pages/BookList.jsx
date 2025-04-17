import React, { useState, useEffect } from 'react';
import { useCart } from '../contexts/CartContext';
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Search, Globe } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const BooksSection = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLanguage, setSelectedLanguage] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const { addToCart } = useCart();
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const navigate = useNavigate();

  // Fetch books from API
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/books');
        setBooks(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching books:', err);
        setError('Failed to load books. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, []);

  const handleAddToCart = (book) => {
    addToCart(book);
    setAlertMessage('Item has been added to your cart successfully.');
    setShowAlert(true);
  };

  // Modified handleRentBook function to navigate directly to checkout
  const handleRentBook = (book) => {
    try {
      // Add book to cart as rental
      addToCart({
        ...book,
        isRental: true,
        rentalPrice: book.price * 0.3, // 30% of purchase price
        rentalDuration: '14 days'
      });
      
      setAlertMessage('Book rental added to cart! Redirecting to checkout...');
      setShowAlert(true);
      
      // Navigate directly to checkout after a short delay
      setTimeout(() => {
        setShowAlert(false);
        navigate('/checkout'); // Navigate to checkout instead of cart
      }, 1500);
    } catch (err) {
      console.error('Error adding rental to cart:', err);
      setAlertMessage('Error adding rental to cart. Please try again.');
      setShowAlert(true);
    }
  };

  // Get unique genres from books
  const genres = ['All', ...new Set(books.map(book => book.genre).filter(Boolean))];
  
  // Get unique languages from books
  const languages = ['All', ...new Set(books.map(book => book.language).filter(Boolean))];

  const filteredBooks = books
    .filter(book => {
      const matchesCategory = selectedCategory === 'All' || book.genre === selectedCategory;
      const matchesLanguage = selectedLanguage === 'All' || book.language === selectedLanguage;
      const matchesSearch = searchQuery === '' || 
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesLanguage && matchesSearch;
    });

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header with Search */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h2 className="text-4xl font-bold">Explore Our Book Collection</h2>
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            type="text"
            placeholder="Search by book title or author..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
      </div>

      {/* Category Filter */}
      <div className="mb-4">
        <h3 className="text-lg font-medium mb-2">Genre</h3>
        <div className="flex flex-wrap gap-2">
          {genres.map(genre => (
            <Button
              key={genre}
              onClick={() => setSelectedCategory(genre)}
              variant={selectedCategory === genre ? "default" : "secondary"}
              className="rounded-full"
            >
              {genre}
            </Button>
          ))}
        </div>
      </div>

      {/* Language Filter */}
      <div className="mb-8">
        <h3 className="text-lg font-medium mb-2">Language</h3>
        <div className="flex flex-wrap gap-2">
          {languages.map(language => (
            <Button
              key={language}
              onClick={() => setSelectedLanguage(language)}
              variant={selectedLanguage === language ? "default" : "secondary"}
              className="rounded-full"
            >
              {language}
            </Button>
          ))}
        </div>
      </div>

      {/* Loading and Error States */}
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading books...</p>
        </div>
      )}

      {error && (
        <div className="text-center text-red-500 py-8">
          <p>{error}</p>
        </div>
      )}

      {/* Books Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredBooks.length > 0 ? (
            filteredBooks.map(book => (
              <div key={book._id} className="bg-white rounded-lg shadow-lg overflow-hidden transition-transform hover:scale-105">
                {/* Language and Genre Tags positioned over image */}
                <div className="relative">
                  <img
                    src={book.imageUrl || '/api/placeholder/200/300'}
                    alt={book.title}
                    className="w-full h-64 object-cover"
                    onError={(e) => {
                      e.target.src = '/api/placeholder/200/300';
                    }}
                  />
                  <div className="absolute top-2 left-2 flex items-center">
                    <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs flex items-center">
                      <Globe className="h-3 w-3 mr-1" />
                      {book.language || 'Unknown'}
                    </span>
                  </div>
                  {book.genre && (
                    <div className="absolute top-2 right-2">
                      <span className="bg-purple-500 text-white px-2 py-1 rounded-full text-xs">
                        {book.genre}
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-2">{book.title}</h3>
                  <p className="text-gray-600 mb-2">by {book.author}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-blue-500 font-bold">Rs.{book.price}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2 line-clamp-2">{book.description}</p>
                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="default"
                      className="flex-1"
                      onClick={() => handleAddToCart(book)}
                      disabled={book.stockQuantity <= 0}
                    >
                      {book.stockQuantity > 0 ? 'Add to Cart' : 'Out of Stock'}
                    </Button>
                    <Button
                      variant="secondary"
                      className="flex-1"
                      onClick={() => handleRentBook(book)}
                      disabled={book.stockQuantity <= 0}
                    >
                      Rent Book
                    </Button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-8">
              <p>No books found matching your criteria.</p>
            </div>
          )}
        </div>
      )}

      {/* Alert Dialog */}
      <AlertDialog open={showAlert} onOpenChange={setShowAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Notice</AlertDialogTitle>
            <AlertDialogDescription>
              {alertMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BooksSection;