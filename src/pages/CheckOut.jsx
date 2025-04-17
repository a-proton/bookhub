import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useAuth } from '../contexts/AuthContext';

const Checkout = () => {
  const { cartItems, clearCart } = useCart();
  const { currentUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  useEffect(() => {
    // Redirect if cart is empty
    if (cartItems.length === 0 && !success) {
      navigate('/BookList');
    }
    
    // Ensure user is logged in
    if (!isAuthenticated || !currentUser) {
      navigate('/login', { state: { from: '/checkout', message: 'Please log in to complete your checkout' } });
    }
  }, [cartItems, currentUser, isAuthenticated, navigate, success]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Calculate rental duration (10 days)
      const rentalDuration = 10;
      
      // Prepare items for batch rental
      const rentalItems = cartItems.map(item => ({
        bookId: item._id,
        quantity: item.quantity
      }));
      
      // Call the batch rental endpoint instead of individual rental endpoints
      const response = await fetch('/api/rentals/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          items: rentalItems,
          rentalDuration: rentalDuration
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to process rentals');
      }
      
      // Success! Clear cart and show success message
      clearCart();
      setSuccess(true);
      setLoading(false);
      
      // After 3 seconds, redirect to rental history tab in profile
      setTimeout(() => {
        navigate('/profile', { state: { activeTab: 'rentals' } });
      }, 3000);
      
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };
  
  if (success) {
    return (
      <div className="min-h-screen bg-[#f5f0e8] py-8">
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center text-green-600">Checkout Successful!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center">
              Your rental has been confirmed. A confirmation email has been sent to your registered email address with rental details.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={() => navigate('/profile', { state: { activeTab: 'rentals' } })}>
              View My Rentals
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-[#f5f0e8] py-8">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Complete Your Rental</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <h2 className="text-lg font-medium">Order Summary</h2>
          
          {cartItems.map((item) => (
            <div key={item._id} className="flex justify-between p-2 border-b">
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
              </div>
              <p>Rs.{(item.price * item.quantity).toFixed(2)}</p>
            </div>
          ))}
          
          <div className="flex justify-between font-bold pt-4">
            <p>Total Amount:</p>
            <p>Rs.{total.toFixed(2)}</p>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-md mt-6">
            <h3 className="font-medium">Rental Terms</h3>
            <p className="text-sm mt-2">
              Books must be returned within 10 days from checkout date. Late returns will incur additional charges.
            </p>
          </div>
          
          {currentUser && (
            <div className="mt-4">
              <p><strong>Delivery To:</strong> {currentUser.fullName}</p>
              <p><strong>Email:</strong> {currentUser.email}</p>
              <p><strong>Contact Number:</strong> {currentUser.phone || 'No phone number provided'}</p>
              {!currentUser.phone && (
                <p className="text-yellow-500 text-sm">
                  Consider updating your profile with a phone number to receive SMS notifications.
                </p>
              )}
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-md">
              {error}
            </div>
          )}
        </CardContent>
        
        <CardFooter>
          <Button 
            onClick={handleSubmit} 
            disabled={loading} 
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing
              </>
            ) : (
              'Confirm Rental'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Checkout;