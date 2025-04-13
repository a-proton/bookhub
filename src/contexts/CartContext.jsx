import React, { createContext, useState, useContext, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  // Load cart from localStorage on initial render
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem('bookHubCart');
    return savedCart ? JSON.parse(savedCart) : [];
  });
  
  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('bookHubCart', JSON.stringify(cartItems));
  }, [cartItems]);
  
  const addToCart = (book) => {
    setCartItems(prevItems => {
      // Create a unique identifier using multiple properties
      // This ensures different books are treated as different items
      // even if they might share the same ID
      const bookUniqueIdentifier = getUniqueIdentifier(book);
      
      // Check if item already exists in cart using the unique identifier
      const existingItemIndex = prevItems.findIndex(item => 
        getUniqueIdentifier(item) === bookUniqueIdentifier
      );
      
      if (existingItemIndex >= 0) {
        // If item exists, increase quantity
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + 1
        };
        return updatedItems;
      } else {
        // If item doesn't exist, add it with quantity 1
        return [...prevItems, { ...book, quantity: 1 }];
      }
    });
  };
  
  // Helper function to generate a unique identifier for a book
  // Modify this to include all properties that make a book unique
  const getUniqueIdentifier = (book) => {
    // Use multiple properties to create a unique identifier
    // Add more properties as needed to uniquely identify each book
    return `${book.id}-${book.title}-${book.author}-${book.isbn || ''}-${book.edition || ''}`;
  };
  
  const removeFromCart = (bookId, bookDetails = null) => {
    if (bookDetails) {
      // If additional book details are provided, use the unique identifier
      const bookUniqueIdentifier = getUniqueIdentifier(bookDetails);
      setCartItems(prevItems => 
        prevItems.filter(item => getUniqueIdentifier(item) !== bookUniqueIdentifier)
      );
    } else {
      // Fallback to just using ID if no additional details are provided
      setCartItems(prevItems => prevItems.filter(item => item.id !== bookId));
    }
  };
  
  const updateQuantity = (bookId, newQuantity, bookDetails = null) => {
    if (newQuantity < 1) {
      return;
    }
    
    setCartItems(prevItems => {
      if (bookDetails) {
        // If additional book details are provided, use the unique identifier
        const bookUniqueIdentifier = getUniqueIdentifier(bookDetails);
        return prevItems.map(item => 
          getUniqueIdentifier(item) === bookUniqueIdentifier 
            ? { ...item, quantity: newQuantity } 
            : item
        );
      } else {
        // Fallback to just using ID if no additional details are provided
        return prevItems.map(item => 
          item.id === bookId ? { ...item, quantity: newQuantity } : item
        );
      }
    });
  };
  
  const clearCart = () => {
    setCartItems([]);
  };
  
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  
  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      cartCount,
      getUniqueIdentifier
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartContext;