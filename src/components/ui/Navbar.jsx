// src/components/Navbar.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Menu, X, Home, Library, LogIn } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext.jsx";
import UserDropdown from "../UserDropdown.jsx";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, currentUser, loading } = useAuth();
  const [mounted, setMounted] = useState(false);

  // Set mounted state after first render to ensure we're fully mounted
  useEffect(() => {
    setMounted(true);
    console.log("Navbar mounted, auth state:", {
      isAuthenticated,
      currentUser,
      loading,
    });
  }, [isAuthenticated, currentUser, loading]);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  // Function to close menu
  const closeMenu = () => {
    setIsOpen(false);
  };

  // For debugging - remove in production
  console.log("Auth state in Navbar:", {
    isAuthenticated,
    currentUser,
    loading,
    mounted,
  });

  return (
    <>
      <nav className="fixed top-0 w-full bg-purple-700 shadow-lg z-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <img src="/logo.png" alt="" />
            <div>
              <Link
                to="/"
                className="flex items-center space-x-2"
                onClick={closeMenu}
              >
                <span className="font-bold text-xl text-white">
                  BookHub: A Book Rental Platform
                </span>
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={toggleMenu}
                className="text-white hover:text-purple-200 focus:outline-none"
              >
                {isOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>

            {/* Desktop menu - right-aligned */}
            <div className="hidden md:flex items-center space-x-8">
              <Link
                to="/"
                className="text-white hover:text-purple-200 flex items-center space-x-1"
              >
                <Home className="h-5 w-5" />
                <span>Home</span>
              </Link>
              <Link
                to="/BookList"
                className="text-white hover:text-purple-200 flex items-center space-x-1"
              >
                <Library className="h-5 w-5" />
                <span>Books</span>
              </Link>
              <Link
                to="/MembershipPage"
                className="text-white hover:text-purple-200 flex items-center space-x-1"
              >
                <Home className="h-5 w-5" />
                <span>Membership</span>
              </Link>
              <Link
                to="/cart"
                className="text-white hover:text-purple-200 relative flex items-center space-x-1"
              >
                <ShoppingCart className="h-5 w-5" />
                <span>Cart</span>
              </Link>

              {loading ? (
                <div className="text-white flex items-center">
                  <div className="animate-pulse h-5 w-20 bg-purple-600 rounded"></div>
                </div>
              ) : isAuthenticated && currentUser ? (
                <UserDropdown />
              ) : (
                <Link
                  to="/login"
                  className="text-white hover:text-purple-200 flex items-center space-x-1"
                >
                  <LogIn className="h-5 w-5" />
                  <span>Login/SignUp</span>
                </Link>
              )}
            </div>
          </div>

          {/* Mobile menu */}
          <div
            className={`${
              isOpen ? "block" : "hidden"
            } md:hidden pb-4 bg-purple-900`}
          >
            <div className="flex flex-col space-y-4">
              <Link
                to="/"
                className="text-white hover:text-purple-200 py-2 flex items-center justify-center space-x-2"
                onClick={closeMenu}
              >
                <Home className="h-5 w-5" />
                <span>Home</span>
              </Link>
              <Link
                to="/BookList"
                className="text-white hover:text-purple-200 py-2 flex items-center justify-center space-x-2"
                onClick={closeMenu}
              >
                <Library className="h-5 w-5" />
                <span>Books</span>
              </Link>
              <Link
                to="/MembershipPage"
                className="text-white hover:text-purple-200 py-2 flex items-center justify-center space-x-2"
                onClick={closeMenu}
              >
                <Home className="h-5 w-5" />
                <span>Membership</span>
              </Link>

              {loading ? (
                <div className="text-white flex items-center justify-center">
                  <div className="animate-pulse h-5 w-20 bg-purple-600 rounded"></div>
                </div>
              ) : isAuthenticated && currentUser ? (
                <div className="text-white hover:text-purple-200 py-2 flex flex-col items-center justify-center">
                  <UserDropdown />
                </div>
              ) : (
                <Link
                  to="/login"
                  className="text-white hover:text-purple-200 py-2 flex items-center justify-center space-x-2"
                  onClick={closeMenu}
                >
                  <LogIn className="h-5 w-5" />
                  <span>Login/SignUp</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>
      {/* Add spacing below navbar to prevent content from being hidden */}
      <div className="h-16"></div>
    </>
  );
};

export default Navbar;
