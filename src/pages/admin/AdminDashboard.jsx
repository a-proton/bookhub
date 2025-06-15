import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { fetchDashboardStats } from '../../services/adminService';

const AdminDashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [dashboardStats, setDashboardStats] = useState({
    totalBooks: 0,
    activeMembers: 0,
    pendingApplications: 0,
    membershipPlans: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        const stats = await fetchDashboardStats();
        setDashboardStats(stats);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, []);

   
  const stats = [
    { title: 'Total Books', value: dashboardStats.totalBooks.toString(), icon: '📚' },
    { title: 'Active Members', value: dashboardStats.activeMembers.toString(), icon: '👥' },
    { title: 'Pending Applications', value: dashboardStats.pendingApplications.toString(), icon: '📝' },
    { title: 'Membership Plans', value: dashboardStats.membershipPlans.toString(), icon: '🏆' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

 
  const features = [
    { 
      title: 'Manage Books', 
      description: 'Add, edit, or remove books from the library',
      icon: '📚',
      link: '/admin/books'
    },
    { 
      title: 'Membership Plans', 
      description: 'Create and modify membership plans',
      icon: '🏆',
      link: '/admin/membership-plans'
    },
    { 
      title: 'Membership Applications', 
      description: 'Review and approve membership applications',
      icon: '📝',
      link: '/admin/applications'
    },
    { 
      title: 'Messages', 
      description: 'View and manage contact form messages',
      icon: '💬',
      link: '/admin/messages'
    },
  ];

  
  const refreshData = async () => {
    try {
      setLoading(true);
      setError(null);
      const stats = await fetchDashboardStats();
      setDashboardStats(stats);
    } catch (err) {
      setError('Failed to refresh data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 text-white">
        <div className="p-4">
          <h2 className="text-2xl font-bold">BookHub Admin</h2>
        </div>
        <div className="py-4">
          <ul>
            <li className="px-4 py-2 hover:bg-gray-700 bg-gray-700">
              <Link to="/admin/dashboard" className="flex items-center">
                <span className="mr-2">🏠</span>
                Dashboard
              </Link>
            </li>
            <li className="px-4 py-2 hover:bg-gray-700">
              <Link to="/admin/books" className="flex items-center">
                <span className="mr-2">📚</span>
                Books
              </Link>
            </li>
            <li className="px-4 py-2 hover:bg-gray-700">
              <Link to="/admin/membership-plans" className="flex items-center">
                <span className="mr-2">🏆</span>
                Membership Plans
              </Link>
            </li>
            <li className="px-4 py-2 hover:bg-gray-700">
              <Link to="/admin/applications" className="flex items-center">
                <span className="mr-2">📝</span>
                Applications
              </Link>
            </li>
            <li className="px-4 py-2 hover:bg-gray-700">
              <Link to="/admin/messages" className="flex items-center">
                <span className="mr-2">💬</span>
                Messages
              </Link>
            </li>
          </ul>
        </div>
        <div className="absolute bottom-0 w-64 p-4">
          <button 
            onClick={handleLogout}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded flex items-center justify-center"
          >
            <span className="mr-2">🚪</span>
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <button 
              onClick={refreshData}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center"
              disabled={loading}
            >
              <span className="mr-2">🔄</span>
              Refresh Data
            </button>
          </div>
          
          {/* Error Message */}
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
              <p>{error}</p>
            </div>
          )}
          
          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {loading ? (
              // Loading skeleton for stats
              Array(4).fill(0).map((_, index) => (
                <div key={index} className="bg-white rounded-lg shadow p-6">
                  <div className="animate-pulse flex space-x-4">
                    <div className="rounded-full bg-gray-200 h-12 w-12"></div>
                    <div className="flex-1 space-y-4 py-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              // Show stats when data is available
              stats.map((stat, index) => (
                <div key={index} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center mb-2">
                    <span className="text-3xl mr-2">{stat.icon}</span>
                    <h3 className="text-xl font-semibold text-gray-700">{stat.title}</h3>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
              ))
            )}
          </div>
          
          {/* Features Section */}
          <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <Link key={index} to={feature.link} className="block">
                <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition duration-200">
                  <div className="flex items-center mb-3">
                    <span className="text-3xl mr-3">{feature.icon}</span>
                    <h3 className="text-xl font-semibold">{feature.title}</h3>
                  </div>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;