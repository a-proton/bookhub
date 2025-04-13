import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const RentalHistory = () => {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchRentals = async () => {
      try {
        const response = await fetch('/api/rentals/history', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Failed to load rental history');
        }
        
        setRentals(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRentals();
  }, []);
  
  // Calculate if a rental is overdue
  const isOverdue = (dueDate) => {
    const today = new Date();
    return new Date(dueDate) < today;
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f0e8] flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-[#f5f0e8] py-8">
        <Card className="w-full max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error}</p>
            <Button onClick={() => navigate('/')} className="mt-4">
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-[#f5f0e8] py-8">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>My Rental History</CardTitle>
        </CardHeader>
        
        <CardContent>
          {rentals.length === 0 ? (
            <p className="text-center py-8">You don't have any rental records yet.</p>
          ) : (
            <div className="space-y-4">
              {rentals.map((rental) => (
                <Card key={rental._id} className="overflow-hidden">
                  <div className={`p-1 ${rental.status === 'returned' 
                    ? 'bg-green-100' 
                    : isOverdue(rental.dueDate) 
                      ? 'bg-red-100' 
                      : 'bg-blue-100'}`}
                  />
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{rental.book?.title || 'Book Unavailable'}</h3>
                        <p className="text-sm text-gray-600">
                          {rental.book?.author ? `by ${rental.book.author}` : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-medium ${isOverdue(rental.dueDate) && rental.status !== 'returned' 
                          ? 'text-red-600' 
                          : ''}`}>
                          {rental.status === 'returned' ? 'Returned' : `Due: ${new Date(rental.dueDate).toLocaleDateString()}`}
                        </p>
                        <p className="text-xs text-gray-500">
                          Issued: {new Date(rental.issueDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    {rental.status !== 'returned' && isOverdue(rental.dueDate) && (
                      <div className="mt-3 bg-red-50 p-2 rounded text-red-700 text-sm">
                        This book is overdue. Please return it as soon as possible to avoid additional charges.
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RentalHistory;