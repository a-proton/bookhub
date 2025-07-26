import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, currentUser, loading } = useAuth();
  const location = useLocation();

  // Check if we have token in localStorage as fallback
  const hasToken =
    localStorage.getItem("token") || localStorage.getItem("authToken");
  const hasUserData = localStorage.getItem("user");

  // Parse user data from localStorage for fallback check
  let localUser = null;
  try {
    if (hasUserData) {
      localUser = JSON.parse(hasUserData);
    }
  } catch (error) {
    console.error("Error parsing local user data:", error);
  }

  // Debugging information
  console.log("ProtectedRoute check:", {
    path: location.pathname,
    isAuthenticated,
    userRole: currentUser?.role,
    localUserRole: localUser?.role,
    requireAdmin,
    isAdmin: currentUser?.role === "admin" || localUser?.role === "admin",
    hasToken: !!hasToken,
    hasUserData: !!hasUserData,
    loading,
  });

  // If still loading and we don't have basic token/user data, show loading
  if (loading && (!hasToken || !hasUserData)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  // If not authenticated and no token, redirect to appropriate login
  if (!isAuthenticated && !hasToken) {
    return (
      <Navigate
        to={requireAdmin ? "/admin/login" : "/login"}
        replace
        state={{
          from: location.pathname,
          message: "Please log in to access this page",
        }}
      />
    );
  }

  // For admin routes, ensure we have admin privileges
  if (requireAdmin) {
    // Use currentUser from context first, fallback to localStorage
    const user = currentUser || localUser;

    // If we're still loading user data but have a token, show loading
    if (loading && !user && hasToken) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      );
    }

    // FIXED: Check if user is admin - redirect non-admins away from admin routes
    if (user?.role !== "admin") {
      console.log("Admin access denied: User is not an admin");
      return (
        <Navigate
          to="/" // Redirect to home instead of admin dashboard
          replace
          state={{
            message: "You need admin privileges to access this page",
            from: location.pathname,
          }}
        />
      );
    }
  }

  // For non-admin routes, just check if authenticated (with fallback to token)
  if (!requireAdmin && !isAuthenticated && hasToken && hasUserData) {
    // If we have token and user data but context says not authenticated,
    // it might be a timing issue - allow access but log it
    console.warn(
      "Context not updated but have valid token/user data, allowing access"
    );
  }

  // Final check: if no authentication at all, redirect to login
  if (!isAuthenticated && !hasToken) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname,
          message: "Authentication required",
        }}
      />
    );
  }

  // User is authenticated (and is admin if required)
  return children;
};

export default ProtectedRoute;
