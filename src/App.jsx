import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from "./components/ui/Layout";
import Navbar from "./components/ui/Navbar";
import Home from "./pages/Home";
import Cart from "./pages/Cart";
import BookList from "./pages/BookList";
import Login from "./pages/Login";
import SignUpPage from "./pages/SignUpPage";
import MembershipForm from './pages/Membership';
import Profile from './pages/userProfile';
import ContactUs from './pages/ContactUs';
import Checkout from './pages/CheckOut';
import UserPreferencesPage from './pages/UserPreferencePage';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminLogin from './pages/admin/AdminLogin';
import ApplicationsReviewPage from './pages/admin/ApplicationReview';
import MembershipPlansPage from './pages/admin/MembershipPlans';
import BookManagement from './pages/admin/BookManagement';
import MessageManagement from './pages/admin/MessageManagement';  

// Context providers
import { CartProvider } from './contexts/CartContext';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={
              <Layout>
                <Navbar />
                <Home />
              </Layout>
            } />
            <Route path="/BookList" element={
              <Layout>
                <Navbar />
                <BookList />
              </Layout>
            } />
            <Route path="/login" element={
              <Layout>
                <Navbar />
                <Login />
              </Layout>
            } />
            <Route path="/signup" element={
              <Layout>
                <Navbar />
                <SignUpPage />
              </Layout>
            } />
            <Route path="/contact" element={
              <Layout>
                <Navbar />
                <ContactUs />
              </Layout>
            } />
            
           
            
            {/* User Preferences Page - For completing profile after signup */}
            <Route path="/complete-profile" element={
              <ProtectedRoute>
                <Layout>
                  <Navbar />
                  <UserPreferencesPage />
                </Layout>
              </ProtectedRoute>
            } />
            
            {/* Protected User Routes */}
            <Route path="/cart" element={
              <ProtectedRoute>
                <Layout>
                  <Navbar />
                  <Cart />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/checkout" element={
              <ProtectedRoute>
                <Layout>
                  <Navbar />
                  <Checkout />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/MembershipPage" element={
              <ProtectedRoute>
                <Layout>
                  <Navbar />
                  <MembershipForm />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/Profile" element={
              <ProtectedRoute>
                <Layout>
                  <Navbar />
                  <Profile />
                </Layout>
              </ProtectedRoute>
            } />
           
            
            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={
              <ProtectedRoute requireAdmin={true}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/applications" element={
              <ProtectedRoute requireAdmin={true}>
                <ApplicationsReviewPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/membership-plans" element={
              <ProtectedRoute requireAdmin={true}>
                <MembershipPlansPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/books" element={
              <ProtectedRoute requireAdmin={true}>
                <BookManagement />
              </ProtectedRoute>
            } />
            {/* New Message Management Route */}
            <Route path="/admin/messages" element={
              <ProtectedRoute requireAdmin={true}>
                <MessageManagement />
              </ProtectedRoute>
            } />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;