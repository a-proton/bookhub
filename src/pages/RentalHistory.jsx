import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

// Shadcn UI Components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
// Icons
import { BookOpen, CalendarCheck, Clock, AlertCircle, CheckCircle, Loader2 } from "lucide-react";

const RentalHistory = () => {
  const { currentUser, API_URL } = useAuth();
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { toast } = useToast();

  // Add useEffect to trigger fetchRentals when component mounts
  useEffect(() => {
    fetchRentals();
  }, []); // Empty dependency array so it runs once on mount

  const fetchRentals = async () => {
    setLoading(true);
    try {
      // Fix for URL construction - remove any trailing slashes from API_URL
      const baseUrl = API_URL ? API_URL.replace(/\/$/, '') : '';
      
      // Remove the duplicate /api if it's already in the baseUrl
      const endpoint = baseUrl.includes('/api') ? '/rentals/history' : '/api/rentals/history';
      
      // Log the constructed URL for debugging
      console.log("Fetching rentals from:", `${baseUrl}${endpoint}`);
      
      const response = await fetch(`${baseUrl}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      // Log the response status
      console.log("Rental API response status:", response.status);

      if (!response.ok) {
        throw new Error(`Failed to fetch rental history (Status: ${response.status})`);
      }

      const data = await response.json();
      console.log("Fetched rental data:", data);
      setRentals(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching rental history:", err);
      setError("Unable to load your rental history. Please try again later.");
      toast({
        title: "Error",
        description: "Failed to load your rental history.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
 
  const handleReturnBook = async (rentalId) => {
    try {
      // Fix for URL construction - remove any trailing slashes from API_URL
      const baseUrl = API_URL ? API_URL.replace(/\/$/, '') : '';
      
      // Remove the duplicate /api if it's already in the baseUrl
      const endpoint = baseUrl.includes('/api') ? `/rentals/return/${rentalId}` : `/api/rentals/return/${rentalId}`;
      
      console.log("Returning book with URL:", `${baseUrl}${endpoint}`);
      
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to return book');
      }

      toast({
        title: "Success",
        description: "Book returned successfully!",
      });

      // Refresh rental list
      fetchRentals();
    } catch (err) {
      console.error("Error returning book:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to return book. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Calculate days remaining or days overdue
  const calculateDaysStatus = (dueDate) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading your rental history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 rounded-lg text-center">
        <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
        <p className="text-red-600">{error}</p>
        <Button 
          variant="outline" 
          className="mt-4" 
          onClick={fetchRentals}
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (!rentals || rentals.length === 0) {
    return (
      <div className="text-center p-8 bg-gray-50 rounded-lg">
        <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <h3 className="text-xl font-medium text-gray-600 mb-2">No Rentals Yet</h3>
        <p className="text-gray-500">
          You haven't rented any books yet. Browse our collection and start reading today!
        </p>
        <Button className="mt-4 bg-purple-600 hover:bg-purple-700" onClick={() => window.location.href = '/books'}>
          Browse Books
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-purple-800 flex items-center">
          <BookOpen className="mr-2 h-5 w-5" /> Your Rented Books
        </h2>
        <Button variant="outline" size="sm" onClick={fetchRentals}>
          <Loader2 className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        {rentals.map((rental) => {
          const book = rental.bookId;
          const daysStatus = calculateDaysStatus(rental.dueDate);
          
          return (
            <Card key={rental._id} className={`overflow-hidden border ${
              rental.isReturned 
                ? 'border-gray-200' 
                : daysStatus < 0 
                  ? 'border-red-300' 
                  : daysStatus <= 2 
                    ? 'border-yellow-300' 
                    : 'border-green-300'
            }`}>
              <div className="flex flex-col md:flex-row">
                <div className="md:w-1/4 p-4 flex justify-center items-start">
                  {book?.imageUrl ? (
                    <img 
                      src={book.imageUrl} 
                      alt={book?.title || "Book cover"} 
                      className="h-40 w-32 object-cover rounded-md shadow-md"
                    />
                  ) : (
                    <div className="h-40 w-32 bg-gray-200 rounded-md flex items-center justify-center">
                      <BookOpen className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                </div>
                
                <CardContent className="flex-1 p-4">
                  <div className="flex flex-col md:flex-row justify-between items-start mb-2">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        {book?.title || "Unknown Book"}
                      </h3>
                      {book?.author && (
                        <p className="text-sm text-gray-600">by {book.author}</p>
                      )}
                    </div>
                    
                    <div className="mt-2 md:mt-0">
                      {rental.isReturned ? (
                        <Badge variant="outline" className="bg-gray-100 text-gray-600">
                          <CheckCircle className="h-3 w-3 mr-1" /> Returned
                        </Badge>
                      ) : daysStatus < 0 ? (
                        <Badge variant="outline" className="bg-red-100 text-red-600">
                          <AlertCircle className="h-3 w-3 mr-1" /> {Math.abs(daysStatus)} days overdue
                        </Badge>
                      ) : (
                        <Badge variant="outline" className={`${
                          daysStatus <= 2 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-600'
                        }`}>
                          <Clock className="h-3 w-3 mr-1" /> {daysStatus} days remaining
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <Separator className="my-3" />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center text-gray-600">
                      <CalendarCheck className="h-4 w-4 mr-2 text-purple-500" />
                      <span>Rented on: {new Date(rental.rentalDate || rental.startDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Clock className="h-4 w-4 mr-2 text-purple-500" />
                      <span>Due by: {new Date(rental.dueDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  {!rental.isReturned && (
                    <div className="mt-4 flex justify-end">
                      <Button 
                        size="sm" 
                        onClick={() => handleReturnBook(rental._id)}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        Return Book
                      </Button>
                    </div>
                  )}
                </CardContent>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default RentalHistory;