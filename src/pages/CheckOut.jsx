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
      // Calculate due date (14 days from now)
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14);
      
      // Format phone number - strip all non-numeric characters except leading +
      const formattedPhone = currentUser.phone ? 
        currentUser.phone.replace(/(?!^\+)[^\d]/g, '') : '';
      
      console.log("Sending phone number:", formattedPhone); // For debugging
      
      // Make API call to create rentals
      const rentalPromises = cartItems.map(async (item) => {
        const response = await fetch('/api/rentals', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            book: item._id,
            dueDate: dueDate.toISOString(),
            quantity: item.quantity,
            phone: formattedPhone
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Failed to rent ${item.title}`);
        }
        
        return response.json();
      });
      
      // Use Promise.allSettled to handle partial failures
      const results = await Promise.allSettled(rentalPromises);
      
      // Check if any request failed
      const failedRentals = results.filter(result => result.status === 'rejected');
      if (failedRentals.length > 0) {
        throw new Error(`${failedRentals.length} rentals failed. ${failedRentals[0].reason.message}`);
      }
      
      // Success! Clear cart and show success message
      clearCart();
      setSuccess(true);
      setLoading(false);
      
      // After 3 seconds, redirect to rental history
      setTimeout(() => {
        navigate('/rentals');
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
              Your rental has been confirmed. An SMS has been sent to your registered phone number with rental details.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={() => navigate('/rentals')}>View My Rentals</Button>
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
              Books must be returned within 14 days from checkout date. Late returns will incur additional charges.
            </p>
          </div>
          
          {currentUser && (
            <div className="mt-4">
              <p><strong>Delivery To:</strong> {currentUser.fullName}</p>
              <p><strong>Contact Number:</strong> {currentUser.phone || 'No phone number provided'}</p>
              {!currentUser.phone && (
                <p className="text-red-500 text-sm">
                  Please update your profile with a phone number to receive rental notifications.
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