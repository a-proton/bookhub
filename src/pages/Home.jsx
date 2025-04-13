import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronRight, TrendingUp, Sparkles, BookOpen, Coins, Users } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { books } from '/src/data/books';

const Home = () => {
  const navigate = useNavigate();
  const [api, setApi] = useState();
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    if (!api) return;
    const intervalId = setInterval(() => {
      api.scrollNext();
    }, 5000);
    return () => clearInterval(intervalId);
  }, [api]);

  const handleAddToCart = (book) => {
    setShowAlert(true);
    setTimeout(() => {
      setShowAlert(false);
      navigate('/BookList');
    }, 1500);
  };

  const handleRentBook = (book) => {
    console.log('Renting book:', book.title);
  };

  const getTopBooks = (booksList, count = 5) => {
    return [...booksList].sort((a, b) => b.rating - a.rating).slice(0, count);
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

  const newArrivals = books.filter((book) => book.category === "Fiction").slice(0, 5);
  const topRatedBooks = getTopBooks(books, 5);

  const BookSection = ({ title, books: sectionBooks, icon: Icon }) => (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center mb-6">
        <Icon className="h-6 w-6 text-indigo-600 mr-2" />
        <h2 className="text-2xl font-bold">{title}</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {sectionBooks.map((book) => (
          <div
            key={book.id}
            className="bg-white rounded-lg shadow-lg overflow-hidden transition-transform hover:scale-105"
          >
            <img
              src={book.imageUrl}
              alt={book.title}
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-2 truncate">
                {book.title}
              </h3>
              <p className="text-gray-600 mb-2 text-sm truncate">{book.author}</p>
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
                >
                  Add to Cart
                </Button>
                <Button
                  variant="secondary"
                  className="w-full text-gray-800"
                  onClick={() => handleRentBook(book)}
                >
                  Rent Now
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

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

      <BookSection title="New Arrivals" books={newArrivals} icon={Sparkles} />
      <BookSection title="Top Picks" books={topRatedBooks} icon={TrendingUp} />

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
              Item has been added to your cart successfully.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>Continue Shopping</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Home;