import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const AdminSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const menuItems = [
    { path: '/admin/dashboard', icon: '🏠', label: 'Dashboard' },
    { path: '/admin/books', icon: '📚', label: 'Books' },
    { path: '/admin/membership-plans', icon: '🏆', label: 'Membership Plans' },
    { path: '/admin/applications', icon: '📝', label: 'Applications' },
    { path: '/admin/messages', icon: '💬', label: 'Messages' }, // Added Messages menu item
  ];

  return (
    <div className="w-64 bg-gray-800 text-white h-screen flex flex-col">
      <div className="p-4">
        <h2 className="text-2xl font-bold">BookHub Admin</h2>
      </div>
      <div className="py-4 flex-grow">
        <ul>
          {menuItems.map((item) => (
            <li key={item.path} className={`px-4 py-2 hover:bg-gray-700 ${isActive(item.path) ? 'bg-gray-700' : ''}`}>
              <Link to={item.path} className="flex items-center">
                <span className="mr-2">{item.icon}</span>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div className="p-4">
        <button 
          onClick={handleLogout}
          className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded flex items-center justify-center"
        >
          <span className="mr-2">🚪</span>
          Logout
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;