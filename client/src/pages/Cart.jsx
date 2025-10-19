import React, { useEffect, useState } from 'react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2, Plus, Minus } from 'lucide-react';

const Cart = () => {
  const { cartItems, removeFromCart, updateQuantity, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // State for managing dialog visibility and selected item
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  
  const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // Check if we were just redirected from login
  useEffect(() => {
    if (location.state?.fromLogin && isAuthenticated && cartItems.length > 0) {
      navigate('/checkout');
    }
  }, [location, isAuthenticated, cartItems, navigate]);
  
  const handleCheckoutClick = (e) => {
    e.preventDefault();
    
    if (cartItems.length === 0) {
      return;
    }
    
    if (!isAuthenticated) {
      navigate('/login', { 
        state: { 
          from: '/cart',
          returnToCheckout: true,
          message: 'Please log in to complete your checkout' 
        } 
      });
      return;
    }
    
    navigate('/checkout');
  };

  // Updated to show dialog instead of alert
  const handleRemoveItem = (item) => {
    setSelectedItem(item);
    setShowRemoveDialog(true);
  };

  // Confirm remove item
  const confirmRemoveItem = () => {
    if (selectedItem) {
      removeFromCart(selectedItem.id, selectedItem);
      setSelectedItem(null);
    }
    setShowRemoveDialog(false);
  };

  // Updated to pass the full item details to updateQuantity
  const handleUpdateQuantity = (item, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveItem(item);
      return;
    }
    // Pass both the item ID and the full item details for unique identification
    updateQuantity(item.id, newQuantity, item);
  };

  const handleClearCart = () => {
    setShowClearDialog(true);
  };

  // Confirm clear cart
  const confirmClearCart = () => {
    clearCart();
    setShowClearDialog(false);
  };
  
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-[#f5f0e8] py-8">
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center text-2xl">Your Cart is Empty</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-600 mb-6">
              Looks like you haven't added any books to your cart yet.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Link to="/BookList">
              <Button size="lg" className="px-8">
                Continue Shopping
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-[#f5f0e8] py-8">
      <div className="container mx-auto px-4">
        <Card className="w-full max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl">Shopping Cart ({cartItems.length} items)</CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {cartItems.map((item, index) => (
              // Using index as part of the key since items might have similar properties
              <div key={`${item.id}-${item.title}-${index}`} className="flex items-center justify-between p-4 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{item.title}</h3>
                  <p className="text-sm text-gray-600 mb-1">by {item.author}</p>
                  {item.isbn && (
                    <p className="text-xs text-gray-500">ISBN: {item.isbn}</p>
                  )}
                  {item.edition && (
                    <p className="text-xs text-gray-500">Edition: {item.edition}</p>
                  )}
                  <p className="font-medium text-green-600 mt-1">Rs. {item.price}</p>
                  <p className="text-sm text-gray-500">
                    Subtotal: Rs. {(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 border rounded-md">
                    <Button 
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handleUpdateQuantity(item, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    
                    <span className="w-12 text-center font-medium">{item.quantity}</span>
                    
                    <Button 
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handleUpdateQuantity(item, item.quantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <Button 
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveItem(item)}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8 w-8 p-0"
                    title="Remove item from cart"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
          
          <CardFooter className="flex flex-col gap-4 sm:flex-row sm:justify-between items-center pt-6 border-t">
            <div className="flex gap-4 items-center">
              <Button 
                variant="outline"
                onClick={handleClearCart}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                Clear Cart
              </Button>
              <Link to="/BookList">
                <Button variant="outline">
                  Continue Shopping
                </Button>
              </Link>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold text-green-600">Rs. {total.toFixed(2)}</p>
              </div>
              
              <Button 
                onClick={handleCheckoutClick}
                size="lg"
                className="px-8"
                disabled={cartItems.length === 0}
              >
                Proceed to Checkout
              </Button>
            </div>
          </CardFooter>
        </Card>

        {/* Remove Item Dialog */}
        <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Item</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove "{selectedItem?.title}" from your cart? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowRemoveDialog(false)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmRemoveItem}
                className="bg-red-600 hover:bg-red-700"
              >
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Clear Cart Dialog */}
        <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear Cart</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to clear your entire cart? This will remove all {cartItems.length} items and cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowClearDialog(false)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmClearCart}
                className="bg-red-600 hover:bg-red-700"
              >
                Clear Cart
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default Cart;