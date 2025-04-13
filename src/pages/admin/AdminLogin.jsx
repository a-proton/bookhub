import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { adminLogin, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  
  // If already authenticated as admin, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      navigate('/admin/dashboard');
    }
  }, [isAuthenticated, user, navigate]);
// In your login component/page
const handleLogin = async (credentials) => {
  try {
    const response = await axios.post('/api/admin/login', credentials);
    
    // Make sure to store the token exactly as expected
    localStorage.setItem('authToken', response.data.token);
    
    // Log to verify it was stored
    console.log('Token stored successfully:', response.data.token.substring(0, 10) + '...');
    
    // Navigate to admin dashboard after successful login
    navigate('/admin/dashboard');
  } catch (error) {
    console.error('Login error:', error);
    setError('Invalid credentials');
  }
};
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      console.log('Attempting admin login with:', { email });
      
      if (!email || !password) {
        setError('Email and password are required');
        setLoading(false);
        return;
      }
      
      // Call the adminLogin from context
      const result = await adminLogin(email, password);
      
      console.log('Admin login result:', result);
      
      if (result.success) {
        // Clear form fields
        setEmail('');
        setPassword('');
        // Redirect to dashboard
        navigate('/admin/dashboard');
      } else {
        setError(result.message || 'Failed to login as admin');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">BookHub Admin Login</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="admin@bookhub.com"
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </div>
        </form>
        
        <div className="mt-4 text-center">
          <a href="/" className="text-blue-500 hover:text-blue-700 text-sm">
            Back to Home
          </a>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;