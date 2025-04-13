import React, { useEffect } from 'react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const Cart = () => {
  const { cartItems, removeFromCart, updateQuantity, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // Check if we were just redirected from login
  useEffect(() => {
    // If we have state that indicates we came from login and we're now authenticated
    if (location.state?.fromLogin && isAuthenticated && cartItems.length > 0) {
      navigate('/checkout');
    }
  }, [location, isAuthenticated, cartItems, navigate]);
  
  const handleCheckoutClick = (e) => {
    e.preventDefault();
    
    // Check if cart is empty
    if (cartItems.length === 0) {
      return;
    }
    
    // If user is not authenticated, redirect to login page with return path
    if (!isAuthenticated) {
      navigate('/login', { 
        state: { 
          from: '/cart', // Return to cart instead of directly to checkout
          returnToCheckout: true, // Flag that we want to go to checkout after login
          message: 'Please log in to complete your checkout' 
        } 
      });
      return;
    }
    
    // If authenticated, proceed to checkout
    navigate('/checkout');
  };
  
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-[#f5f0e8]">
        <Card className="w-full max-w-2xl mx-auto mt-8">
          <CardHeader>
            <CardTitle className="text-center">Your Cart is Empty</CardTitle>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Link to="/BookList">
              <Button>Continue Shopping</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-[#f5f0e8] py-8">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Shopping Cart</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {cartItems.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg bg-white">
              <div className="flex-1">
                <h3 className="font-medium">{item.title}</h3>
                <p className="text-sm text-gray-600">by {item.author}</p>
                <p className="mt-1">Rs.{item.price}</p>
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  disabled={item.quantity <= 1}
                >
                  -
                </Button>
                
                <span className="w-8 text-center">{item.quantity}</span>
                
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                >
                  +
                </Button>
                
                <Button 
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFromCart(item.id)}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
        
        <CardFooter className="flex flex-col gap-4 sm:flex-row sm:justify-between items-center">
          <div className="flex gap-4">
            <Button 
              variant="outline"
              onClick={clearCart}
            >
              Clear Cart
            </Button>
            <p className="text-lg font-semibold">Total: Rs.{total.toFixed(2)}</p>
          </div>
          
          <Button onClick={handleCheckoutClick}>
            Proceed to Checkout
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Cart;