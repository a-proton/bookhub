// src/components/UserDropdown.jsx
import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { User, LogOut, Mail, ChevronDown } from "lucide-react";

// Import shadcn UI components
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const UserDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);
  const dropdownRef = useRef(null);
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleLogoutClick = () => {
    setIsOpen(false);
    setShowLogoutAlert(true);
  };

  const handleLogoutConfirm = async () => {
    try {
      // First navigate to home route, then perform logout
      navigate("/", { replace: true });

      // Small timeout to ensure navigation happens before auth state changes
      setTimeout(() => {
        logout();
        setShowLogoutAlert(false);
      }, 100);
    } catch (error) {
      console.error("Logout error:", error);
      setShowLogoutAlert(false);
    }
  };

  const handleLogoutCancel = () => {
    setShowLogoutAlert(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Debug user info
  console.log("UserDropdown received user:", currentUser);

  // If no user, don't render dropdown
  if (!currentUser) {
    console.log("No currentUser in UserDropdown");
    return null;
  }

  // Get first letter of name for avatar
  const userInitial = currentUser.fullName?.charAt(0).toUpperCase() || "U";

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className="flex items-center space-x-1 text-white hover:text-purple-200 focus:outline-none"
      >
        <div className="h-8 w-8 rounded-full bg-purple-800 flex items-center justify-center text-white font-bold">
          {userInitial}
        </div>
        <span className="max-w-[100px] truncate">{currentUser.fullName}</span>
        <ChevronDown className="h-4 w-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
          <div className="px-4 py-2 text-sm text-gray-700 border-b">
            Signed in as{" "}
            <span className="font-medium">{currentUser.email}</span>
          </div>

          <Link
            to="/Profile"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
            onClick={() => setIsOpen(false)}
          >
            <User className="h-4 w-4 mr-2" />
            My Profile
          </Link>

          {/* <Link 
            to="/user-preferences"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
            onClick={() => setIsOpen(false)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Preferences
          </Link> */}

          <Link
            to="/contact"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
            onClick={() => setIsOpen(false)}
          >
            <Mail className="h-4 w-4 mr-2" />
            Contact Us
          </Link>

          <button
            onClick={handleLogoutClick}
            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </button>
        </div>
      )}

      {/* Logout Confirmation Alert Dialog */}
      <AlertDialog open={showLogoutAlert} onOpenChange={setShowLogoutAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to logout?
            </AlertDialogTitle>
            <AlertDialogDescription>
              You will need to sign in again to access your account features.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleLogoutCancel}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogoutConfirm}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UserDropdown;
