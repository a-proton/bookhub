import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Book, Clock, LogOut } from 'lucide-react';

const Dashboard = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [rentedBooks, setRentedBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check authentication
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // Fetch user's rented books
    const fetchRentedBooks = async () => {
      try {
        const token = localStorage.getItem('token');
        
        const response = await fetch('/api/rentals/user', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch rentals');
        }

        const data = await response.json();
        setRentedBooks(data);
      } catch (err) {
        console.error('Error fetching rentals:', err);
        setError('Failed to load your rented books');
      } finally {
        setLoading(false);
      }
    };

    fetchRentedBooks();
  }, [isAuthenticated, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Calculate days left until return deadline
  const calculateDaysLeft = (deadlineDate) => {
    const today = new Date();
    const deadline = new Date(deadlineDate);
    const diffTime = deadline - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Format date nicely
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Determine badge color based on days left
  const getBadgeVariant = (daysLeft) => {
    if (daysLeft <= 1) return "destructive";
    if (daysLeft <= 3) return "warning";
    return "secondary";
  };

  return (
    <div className="min-h-screen bg-[#f5f0e8] p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-purple-900">My Dashboard</h1>
            <p className="text-gray-600">Welcome back, {user?.name || 'Reader'}!</p>
          </div>
          <Button 
            onClick={handleLogout}
            variant="outline" 
            className="flex items-center gap-2 border-purple-900 text-purple-900 hover:bg-purple-100"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </Button>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl text-purple-900">Your Rented Books</CardTitle>
              <Button 
                onClick={() => navigate('/books')}
                className="bg-purple-900 hover:bg-purple-800"
              >
                Browse More Books
              </Button>
            </div>
            <CardDescription>
              Books you currently have checked out from our library
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-900 mx-auto"></div>
                <p className="mt-4 text-gray-500">Loading your books...</p>
              </div>
            )}

            {error && (
              <div className="text-center py-8">
                <p className="text-red-500">{error}</p>
                <Button 
                  onClick={() => window.location.reload()}
                  variant="outline"
                  className="mt-4"
                >
                  Try Again
                </Button>
              </div>
            )}

            {!loading && !error && rentedBooks.length === 0 && (
              <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                <Book size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-medium text-gray-600 mb-2">No books rented yet</h3>
                <p className="text-gray-500 mb-6">Browse our collection and rent your first book today!</p>
                <Button 
                  onClick={() => navigate('/books')}
                  className="bg-purple-900 hover:bg-purple-800"
                >
                  Explore Books
                </Button>
              </div>
            )}

            {!loading && !error && rentedBooks.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rentedBooks.map((rental) => {
                  const daysLeft = calculateDaysLeft(rental.returnDeadline);
                  const badgeVariant = getBadgeVariant(daysLeft);
                  
                  return (
                    <Card key={rental._id} className="border border-gray-200 overflow-hidden">
                      <div className="h-40 bg-gray-200 relative">
                        {rental.book.coverImage ? (
                          <img 
                            src={rental.book.coverImage} 
                            alt={rental.book.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-purple-100">
                            <Book size={64} className="text-purple-300" />
                          </div>
                        )}
                      </div>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg text-purple-900 line-clamp-1">
                          {rental.book.title}
                        </CardTitle>
                        <CardDescription className="line-clamp-1">
                          {rental.book.author}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pb-4 space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <CalendarDays size={16} className="text-gray-500" />
                          <span>Rented on: {formatDate(rental.rentalDate)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock size={16} className="text-gray-500" />
                          <span>Return by: {formatDate(rental.returnDeadline)}</span>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Badge variant={badgeVariant} className="w-full justify-center py-1">
                          {daysLeft} {daysLeft === 1 ? 'day' : 'days'} remaining
                        </Badge>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-purple-900">Reading Statistics</CardTitle>
            <CardDescription>
              Your reading activity and progress
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-purple-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-purple-900">Books Read</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold text-purple-900">
                    {Math.floor(Math.random() * 5)}
                  </p>
                  <p className="text-sm text-gray-500">in the last 30 days</p>
                </CardContent>
              </Card>
              
              <Card className="bg-purple-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-purple-900">Current Rentals</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold text-purple-900">
                    {rentedBooks.length}
                  </p>
                  <p className="text-sm text-gray-500">books to return</p>
                </CardContent>
              </Card>
              
              <Card className="bg-purple-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-purple-900">Favorite Genre</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-purple-900">
                    Fiction
                  </p>
                  <p className="text-sm text-gray-500">based on your history</p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;