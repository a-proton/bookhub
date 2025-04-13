import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, currentUser, loading } = useAuth();
  const location = useLocation();
  
  // Debugging information
  console.log('ProtectedRoute check:', {
    path: location.pathname,
    isAuthenticated,
    userRole: currentUser?.role,
    requireAdmin,
    isAdmin: currentUser?.role === 'admin'
  });
  
  if (loading) {
    // Show an improved loading spinner while checking authentication
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    // Redirect to login page and save the location they were trying to access
    return (
      <Navigate 
        to={requireAdmin ? "/admin/login" : "/login"} 
        replace 
        state={{ 
          from: location.pathname,
          message: 'Please log in to access this page'
        }} 
      />
    );
  }
  
  // Check if admin route is requested but user is not admin
  if (requireAdmin && currentUser?.role !== 'admin') {
    console.log('Admin access denied: User is not an admin');
    return <Navigate to="/" replace state={{ message: 'You need admin privileges to access this page' }} />;
  }
  
  // User is authenticated (and is admin if required)
  return children;
};

export default ProtectedRoute;