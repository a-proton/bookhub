import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { isAuthenticated, user, adminLogin } = useAuth();
  const navigate = useNavigate();

  // If already authenticated as admin, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated && user?.role === "admin") {
      console.log("Already authenticated as admin, redirecting...");
      navigate("/admin/dashboard", { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      console.log("Attempting admin login with:", { email });

      if (!email || !password) {
        setError("Email and password are required");
        setLoading(false);
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setError("Please enter a valid email address");
        setLoading(false);
        return;
      }

      // Use the adminLogin function from context
      const result = await adminLogin(email, password);

      console.log("Admin login result:", result);

      if (result.success) {
        console.log("Admin login successful, navigating to dashboard...");

        // Clear form
        setEmail("");
        setPassword("");

        // Navigate to dashboard
        navigate("/admin/dashboard", { replace: true });
      } else {
        setError(result.message || "Failed to login as admin");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking authentication
  if (loading && isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-gray-600">Checking authentication...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
          BookHub Admin Login
        </h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="email"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="admin@bookhub.com"
              disabled={loading}
            />
          </div>

          <div className="mb-6">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="password"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
              disabled={loading}
            />
          </div>

          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Logging in...
                </div>
              ) : (
                "Login"
              )}
            </button>
          </div>
        </form>

        <div className="mt-4 text-center">
          <a
            href="/"
            className="text-blue-500 hover:text-blue-700 text-sm"
            onClick={(e) => {
              if (loading) {
                e.preventDefault();
              }
            }}
          >
            Back to Home
          </a>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
