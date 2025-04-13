import React, { useEffect } from 'react';
import { Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import AdminLogin from './AdminLogin';
import AdminDashboard from './AdminDashboard';
import MembershipPlans from './admin/MembershipPlans';
import MembershipApplications from './admin/MembershipApplications';
import BookManagement from './admin/BookManagement';

const AdminRoute = () => {
  const { user, isAdmin, loading, checkAdminStatus } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (user) {
      checkAdminStatus();
    }
  }, [checkAdminStatus, user, location.pathname]);

  // Simple inline loading display
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-t-4 border-blue-500 border-solid rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  const isAuthenticated = user && isAdmin;

  return (
    <Routes>
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to="/admin/dashboard" /> : <AdminLogin />}
      />
      <Route
        path="/dashboard"
        element={isAuthenticated ? <AdminDashboard /> : <Navigate to="/admin/login" />}
      />
      <Route
        path="/membership-plans"
        element={isAuthenticated ? <MembershipPlans /> : <Navigate to="/admin/login" />}
      />
      <Route
        path="/membership-applications"
        element={isAuthenticated ? <MembershipApplications /> : <Navigate to="/admin/login" />}
      />
      <Route
        path="/books"
        element={isAuthenticated ? <BookManagement /> : <Navigate to="/admin/login" />}
      />
      <Route path="*" element={<Navigate to="/admin/login" />} />
    </Routes>
  );
};

export default AdminRoute;