import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const AdminDashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  // Sample admin statistics
  const stats = [
    { title: 'Total Books', value: '0', icon: '📚' },
    { title: 'Active Members', value: '256', icon: '👥' },
    { title: 'Pending Applications', value: '12', icon: '📝' },
    { title: 'Membership Plans', value: '4', icon: '🏆' },
  ];

  // Admin features
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
          <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
          
          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center mb-2">
                  <span className="text-3xl mr-2">{stat.icon}</span>
                  <h3 className="text-xl font-semibold text-gray-700">{stat.title}</h3>
                </div>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
            ))}
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