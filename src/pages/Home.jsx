import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronRight, TrendingUp, Sparkles, BookOpen, Coins, Users, Globe, RefreshCw } from "lucide-react";
import { useCart } from '../contexts/CartContext';
import { useRecommendations } from '../contexts/RecommendationContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import axios from "axios";
import { formatDistanceToNow } from 'date-fns';

const Home = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  // Get recommendations from context with additional properties
  const { 
    topPicks: contextTopPicks, 
    isLoading: recommendationsLoading, 
    fetchRecommendations,
    triggerRecommendationRefresh,
    lastRefreshed,
    refreshStatus,
    isPersonalized // Add this line to get personalization status
  } = useRecommendations();
  
  const [api, setApi] = useState();
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [newArrivals, setNewArrivals] = useState([]);
  // Use local state that syncs with context
  const [topPicks, setTopPicks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Format the last refreshed time
  const formattedLastRefreshed = lastRefreshed 
    ? formatDistanceToNow(new Date(lastRefreshed), { addSuffix: true }) 
    : 'never';

  useEffect(() => {
    console.log("Home component mounted");
    console.log("Top picks from context:", contextTopPicks);
    console.log("Recommendations loading:", recommendationsLoading);
    console.log("User authentication status:", localStorage.getItem('token') ? "Logged in" : "Not logged in");
    console.log("Recommendations personalized:", isPersonalized);
    
    if (!api) return;
    const intervalId = setInterval(() => {
      api.scrollNext();
    }, 5000);
    return () => clearInterval(intervalId);
  }, [api, isPersonalized]);

  // Fetch books from the database
  useEffect(() => {
    const controller = new AbortController();
    
    const fetchBooks = async () => {
      setIsLoading(true);
      try {
        // Fetch new arrivals
        const newArrivalsResponse = await axios.get('/api/books/new-arrivals', {
          signal: controller.signal
        });
        setNewArrivals(newArrivalsResponse.data);
        console.log("New arrivals fetched:", newArrivalsResponse.data);
        
        // Check authentication status
        const token = localStorage.getItem('token');
        
        // Always fetch fresh recommendations if user is logged in
        if (token) {
          console.log("User is logged in, fetching personalized recommendations");
          await fetchRecommendations({ 
            force: true,  // Force refresh for logged-in users
            useCache: false,  // Don't use cache for logged-in users
            signal: controller.signal 
          });
        } else if (contextTopPicks.length > 0) {
          // Use existing recommendations from context if user is not logged in
          setTopPicks(contextTopPicks);
          console.log("User not logged in, using cached recommendations:", contextTopPicks);
        } else {
          // If no recommendations in context, fetch them
          await fetchRecommendations({ signal: controller.signal });
        }
        
        setIsLoading(false);
      } catch (err) {
        if (err.name !== 'CanceledError' && err.name !== 'AbortError') {
          console.error("Error fetching books:", err);
          setError("Failed to load books. Please try again later.");
          setIsLoading(false);
        }
      }
    };

    fetchBooks();
    
    return () => {
      controller.abort(); // Cleanup on unmount
    };
  }, [fetchRecommendations, contextTopPicks]);

  // Update local state when context changes
  useEffect(() => {
    if (contextTopPicks.length > 0) {
      setTopPicks(contextTopPicks);
    }
  }, [contextTopPicks]);

  // Handle manual recommendation refresh
  const handleRefreshRecommendations = useCallback(async () => {
    setRefreshing(true);
    try {
      // Check if user is logged in
      const token = localStorage.getItem('token');
      if (!token) {
        setAlertMessage('Login required for personalized recommendations');
        setShowAlert(true);
        
        // Still fetch recommendations, but they won't be personalized
        await fetchRecommendations({ force: true });
        return;
      }
      
      await triggerRecommendationRefresh();
    } catch (error) {
      console.error("Failed to refresh recommendations:", error);
      setAlertMessage('Failed to refresh recommendations. Please try again.');
      setShowAlert(true);
    } finally {
      setRefreshing(false);
    }
  }, [triggerRecommendationRefresh, fetchRecommendations]);

  const handleAddToCart = (book) => {
    addToCart(book);
    setAlertMessage('Item has been added to your cart successfully.');
    setShowAlert(true);
    setTimeout(() => {
      setShowAlert(false);
      navigate('/BookList');
    }, 1500);
  };

  const handleRentBook = (book) => {
    try {
      // Add book to cart as rental
      addToCart({
        ...book,
        isRental: true,
        rentalPrice: book.price * 0.3, // 30% of purchase price
        rentalDuration: '14 days'
      });
      
      setAlertMessage('Book rental added to cart! Redirecting to checkout...');
      setShowAlert(true);
      
      // Navigate directly to checkout after a short delay
      setTimeout(() => {
        setShowAlert(false);
        navigate('/checkout'); // Navigate to checkout instead of BookList
      }, 1500);
    } catch (err) {
      console.error('Error adding rental to cart:', err);
      setAlertMessage('Error adding rental to cart. Please try again.');
      setShowAlert(true);
    }
  };

  const carouselItems = [
    {
      image: "/Carouselimage/carousel1.jpg",
      title: "Explore Our Book Collection",
      subtitle: "Vast Collection of Books",
      description:
        "Dive into an extensive library of books across diverse genres, including fiction, non-fiction, academic resources, self-help, and much more. Whether you're a casual reader or a dedicated book lover, there's something for everyone.",
      bgColor: "bg-[#f5f0e8]",
      textColor: "text-gray-800",
      buttonVariant: "default",
      buttonText: "Browse Books",
      buttonLink: "/BookList",
    },
    {
      image: "/Carouselimage/carousel5.jpg",
      title: "Flexible Rental Periods",
      subtitle: "Rent on Your Schedule",
      description:
        "Enjoy the freedom to choose rental periods that suit your lifestyle and schedule. Whether you need a book for a week, a month, or longer, our flexible plans ensure you get exactly what you need without any hassle.",
      bgColor: "bg-white",
      textColor: "text-gray-800",
      buttonVariant: "default",
      buttonText: "Browse Books",
      buttonLink: "/BookList",
    },
    {
      image: "/Carouselimage/carousel2.jpg",
      title: "Affordable Pricing",
      subtitle: "Budget-Friendly Options",
      description:
        "Save money with our budget-friendly rental options, offering books at a fraction of the cost of purchasing. No hidden charges or surprises—just transparent, affordable pricing for every reader.",
      bgColor: "bg-[#e6f4f9]",
      textColor: "text-gray-800",
      buttonVariant: "default",
      buttonText: "Browse Books",
      buttonLink: "/BookList",
    },
    {
      image: "/Carouselimage/carousel3.jpg",
      title: "Book Club Membership",
      subtitle: "Exclusive Deals for Members",
      description:
        "Join our book club to get special discounts, early access to new releases, and exclusive member-only events. Connect with fellow readers and enjoy premium benefits that enhance your reading experience.",
      bgColor: "bg-[#e6ffe4]",
      textColor: "text-gray-800",
      buttonVariant: "default",
      buttonText: "Become a Member",
      buttonLink: "/MembershipPage",
    },
    {
      image: "/Carouselimage/carousel4.jpg",
      title: "Special Offers",
      subtitle: "Up to 50% Off Rentals",
      description:
        "Take advantage of our limited-time offers on select titles across various genres. Whether you're a student, professional, or casual reader, find amazing deals that make reading more accessible.",
      bgColor: "bg-[#ffe4e1]",
      textColor: "text-gray-800",
      buttonVariant: "default",
      buttonText: "Browse Books",
      buttonLink: "/BookList",
    },
  ];

  // Updated BookSection component with personalization indicator for Top Picks
  const BookSection = ({ 
    title, 
    books: sectionBooks, 
    icon: Icon, 
    isLoading, 
    showBrowseMore = false,
    showRefresh = false,
    onRefresh = null,
    refreshing = false,
    lastRefreshed = null
  }) => {
    const [showDebug, setShowDebug] = useState(false);
    
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Icon className="h-6 w-6 text-indigo-600 mr-2" />
            <h2 className="text-2xl font-bold">{title}</h2>
            
            {/* Add personalization indicator for Top Picks */}
            {title === "Top Picks" && (
              <span className={`ml-2 text-xs px-2 py-1 rounded-full ${
                isPersonalized ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {isPersonalized ? 'Personalized' : 'General'}
              </span>
            )}
            
            {/* Refresh button for recommendations */}
            {showRefresh && onRefresh && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="ml-2"
                      onClick={onRefresh}
                      disabled={refreshing}
                    >
                      <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Refresh recommendations</p>
                    {lastRefreshed && (
                      <p className="text-xs text-gray-500">Last updated: {formattedLastRefreshed}</p>
                    )}
                    {!isPersonalized && (
                      <p className="text-xs text-yellow-500">Login for personalized recommendations!</p>
                    )}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          
          {/* Debug toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDebug(!showDebug)}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              {showDebug ? 'Hide Debug' : 'Debug'}
            </button>
          </div>
        </div>
        
        {/* Show refresh status alert */}
        {refreshStatus?.isRefreshed && title === "Top Picks" && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-md flex items-center">
            <RefreshCw className="h-4 w-4 mr-2" />
            {refreshStatus.message || 'Recommendations refreshed!'}
          </div>
        )}
        
        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : error ? (
          <div className="text-center text-red-500 py-8">{error}</div>
        ) : sectionBooks.length === 0 ? (
          <div className="text-center text-gray-500 py-8">No books available at the moment.</div>
        ) : (
          <>
            {/* Books grid with highlight animation on refresh */}
            <div 
              className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 transition-all duration-500 ${
                title === "Top Picks" && refreshStatus?.isRefreshed ? 'bg-green-50 p-4 rounded-lg' : ''
              }`}
            >
              {sectionBooks.map((book) => (
                <div
                  key={book._id || book.id}
                  className="bg-white rounded-lg shadow-lg overflow-hidden transition-transform hover:scale-105"
                >
                  <div className="relative">
                    <img
                      src={book.imageUrl}
                      alt={book.title}
                      className="w-full h-48 object-cover"
                      onError={(e) => {
                        e.target.src = '/api/placeholder/200/300';
                      }}
                    />
                    
                    {/* Language Badge */}
                    {book.language && (
                      <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                        <Globe size={12} />
                        <span>{book.language}</span>
                      </div>
                    )}
                    
                    {/* Genre Badge */}
                    {book.genre && (
                      <div className="absolute top-2 right-2 bg-purple-500 text-white text-xs px-2 py-1 rounded-full">
                        {book.genre}
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4">
                    <h3 className="text-lg font-semibold mb-2 truncate">
                      {book.title}
                    </h3>
                    <p className="text-gray-600 mb-2 text-sm truncate">{book.author}</p>
                    
                    {/* Language and Genre Info */}
                    {(book.language || book.genre) && (
                      <div className="flex flex-wrap mb-2 gap-x-3 text-xs text-gray-500">
                        {book.language && (
                          <div className="flex items-center">
                            <Globe size={12} className="mr-1" />
                            {book.language}
                          </div>
                        )}
                        {book.genre && (
                          <div className="flex items-center">
                            <BookOpen size={12} className="mr-1" />
                            {book.genre}
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-blue-500 font-bold">Rs.{book.price}</span>
                      <div className="flex items-center">
                        <span className="text-yellow-400">★</span>
                        <span className="ml-1 text-gray-600">{book.rating}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="default"
                        className="w-full text-white"
                        onClick={() => handleAddToCart(book)}
                        disabled={book.stockQuantity <= 0}
                      >
                        {book.stockQuantity > 0 ? 'Add to Cart' : 'Out of Stock'}
                      </Button>
                      <Button
                        variant="secondary"
                        className="w-full text-gray-800"
                        onClick={() => handleRentBook(book)}
                        disabled={book.stockQuantity <= 0}
                      >
                        Rent Now
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Debug Panel */}
            {showDebug && (
              <div className="mt-8 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <h3 className="font-bold mb-2">Debug Information</h3>
                <p className="mb-2">Book count: {sectionBooks.length}</p>
                {title === "Top Picks" && (
                  <>
                    <p className="mb-2">Last refreshed: {formattedLastRefreshed}</p>
                    <p className="mb-2">Personalized: {isPersonalized ? 'Yes' : 'No'}</p>
                  </>
                )}
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="p-2 text-left">Title</th>
                        <th className="p-2 text-left">Language</th>
                        <th className="p-2 text-left">Genre</th>
                        <th className="p-2 text-left">Rating</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sectionBooks.map((book, index) => (
                        <tr key={book._id || book.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="p-2">{book.title}</td>
                          <td className="p-2">{book.language || 'N/A'}</td>
                          <td className="p-2">{book.genre || 'N/A'}</td>
                          <td className="p-2">{book.rating || 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {/* Browse More button */}
            {showBrowseMore && (
              <div className="flex justify-center mt-10">
                <Link to="/BookList">
                  <Button variant="outline" className="px-8 py-2 font-medium flex items-center gap-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50">
                    Browse More
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen">
      <div className="w-full relative">
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          setApi={setApi}
          className="w-full"
        >
          <CarouselContent>
            {carouselItems.map((item, index) => (
              <CarouselItem key={index}>
                <div className={`${item.bgColor} w-full`}>
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="py-8">
                      <div className="flex items-center justify-between h-[350px]">
                        <div className="w-1/2 pr-8">
                          <h3 className={`text-xl font-normal mb-2 ${item.textColor}`}>
                            {item.subtitle}
                          </h3>
                          <h2 className={`text-4xl font-bold mb-4 ${item.textColor}`}>
                            {item.title}
                          </h2>
                          {item.description && (
                            <p className="text-gray-600 mb-4 leading-relaxed">
                              {item.description}
                            </p>
                          )}
                          <Link to={item.buttonLink}>
                            <Button variant={item.buttonVariant} className="mt-4">
                              {item.buttonText}
                              <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                        <div className="w-[400px] h-[400px] rounded-lg overflow-hidden">
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2" />
          <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2" />
        </Carousel>
      </div>

      {/* New Arrivals - fetched from database - with Browse More button */}
      <BookSection 
        title="New Arrivals" 
        books={newArrivals} 
        icon={Sparkles} 
        isLoading={isLoading}
        showBrowseMore={true} 
      />
      
      {/* Top Picks with refresh button and personalization indicator */}
      <BookSection 
        title="Top Picks" 
        books={topPicks} 
        icon={TrendingUp} 
        isLoading={isLoading || recommendationsLoading}
        showRefresh={true}
        onRefresh={handleRefreshRecommendations}
        refreshing={refreshing}
        lastRefreshed={lastRefreshed}
      />

      <div className="w-full bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-3 italic">About Us</h2>
          </div>

          <Card className="shadow-lg">
            <CardContent className="p-8">
              <div className="space-y-6">
                <p className="text-lg text-gray-700 leading-relaxed italic">
                  Welcome to BookHub, your premier destination for book rentals. We offer a diverse collection spanning fiction, non-fiction, academic texts, and self-help books. Our mission is simple: make reading accessible and affordable for everyone through competitive rental prices.
                </p>
                
                <div className="grid md:grid-cols-3 gap-8 mt-12">
                  <div className="text-center p-4">
                    <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <BookOpen className="w-8 h-8 text-indigo-600" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Vast Collection</h3>
                    <p className="text-gray-600">Access thousands of books across multiple genres</p>
                  </div>

                  <div className="text-center p-4">
                    <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Coins className="w-8 h-8 text-indigo-600" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Affordable Prices</h3>
                    <p className="text-gray-600">Competitive rental rates for every budget</p>
                  </div>

                  <div className="text-center p-4">
                    <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="w-8 h-8 text-indigo-600" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Community Focus</h3>
                    <p className="text-gray-600">Join readers who share your passion for books</p>
                  </div>
                </div>

                <div className="text-center mt-12">
                  <p className="text-lg text-gray-700 italic">
                    Join our community and discover the joy of reading without commitment.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog open={showAlert} onOpenChange={setShowAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Success!</AlertDialogTitle>
            <AlertDialogDescription>
              {alertMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Home;