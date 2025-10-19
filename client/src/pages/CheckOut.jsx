import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";

// Import 'useAuth' to get access to the 'api' instance and user data
import { useAuth } from "../contexts/AuthContext";

const Checkout = () => {
  const { cartItems, clearCart } = useCart();
  const { currentUser, isAuthenticated, api } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [rentalDetails, setRentalDetails] = useState(null);

  const total = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  useEffect(() => {
    if (!loading && cartItems.length === 0 && !success) {
      navigate("/BookList");
    }
    if (!isAuthenticated) {
      navigate("/login", { state: { from: "/checkout" } });
    }
  }, [cartItems, isAuthenticated, navigate, success, loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const rentalItems = cartItems.map((item) => ({
      bookId: item._id,
      quantity: item.quantity,
    }));

    console.log("Submitting rental request:", {
      items: rentalItems,
      rentalDuration: 14,
    });

    try {
      const response = await api.post("/rentals/batch", {
        items: rentalItems,
        rentalDuration: 14,
      });

      console.log("Server response:", response.data);

      if (response.data.success) {
        setSuccess(true);
        setRentalDetails(response.data);
        clearCart();

        // Redirect after showing success message
        setTimeout(() => {
          navigate("/profile", { state: { activeTab: "rentals" } });
        }, 3000);
      } else {
        throw new Error(response.data.message || "Failed to process rentals");
      }
    } catch (err) {
      console.error("Rental submission error:", err);

      // Enhanced error handling
      let errorMessage = "An unknown error occurred.";

      if (err.response) {
        // Server responded with an error status
        errorMessage =
          err.response.data?.message || `Server error: ${err.response.status}`;

        // Log additional details for debugging
        console.error("Server error details:", {
          status: err.response.status,
          data: err.response.data,
          headers: err.response.headers,
        });
      } else if (err.request) {
        // Request was made but no response received
        errorMessage =
          "No response received from server. Please check your connection.";
        console.error("No response received:", err.request);
      } else {
        // Something else happened
        errorMessage = err.message;
        console.error("Request setup error:", err.message);
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#f5f0e8] py-8 flex items-center justify-center">
        <Card className="w-full max-w-lg mx-auto">
          <CardHeader>
            <CardTitle className="text-center text-2xl text-green-600 flex items-center justify-center gap-2">
              <CheckCircle className="h-6 w-6" />
              Rental Successful!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-2">
              <p className="text-gray-700">
                Your books have been rented successfully!
              </p>
              {rentalDetails && (
                <div className="bg-green-50 p-3 rounded-md mt-4">
                  <p className="font-semibold text-green-800">
                    {rentalDetails.rentalsCreated} book(s) rented
                  </p>
                  {rentalDetails.unavailableBooks &&
                    rentalDetails.unavailableBooks.length > 0 && (
                      <p className="text-sm text-orange-600 mt-1">
                        {rentalDetails.unavailableBooks.length} book(s) were
                        unavailable
                      </p>
                    )}
                </div>
              )}
              <p className="text-sm text-gray-600 mt-2">
                A confirmation email has been sent to your email address.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button
              onClick={() =>
                navigate("/profile", { state: { activeTab: "rentals" } })
              }
            >
              View My Rentals
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f0e8] py-8">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Complete Your Rental</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <h2 className="text-lg font-medium">Order Summary</h2>
          {cartItems.map((item) => (
            <div
              key={item._id}
              className="flex justify-between items-center p-3 border-b bg-white rounded-md"
            >
              <div className="flex-1">
                <p className="font-medium">{item.title}</p>
                <p className="text-sm text-gray-600">
                  by {item.author || "Unknown Author"}
                </p>
                <p className="text-sm text-gray-600">
                  Quantity: {item.quantity}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium">
                  Rs.{(item.price * item.quantity).toFixed(2)}
                </p>
                <p className="text-sm text-gray-500">
                  Rental: Rs.{(item.price * item.quantity * 0.3).toFixed(2)}
                </p>
              </div>
            </div>
          ))}

          <div className="flex justify-between font-bold text-lg pt-4 border-t">
            <p>Purchase Total:</p>
            <p>Rs.{total.toFixed(2)}</p>
          </div>
          <div className="flex justify-between font-bold text-lg text-blue-600">
            <p>Rental Fee (30%):</p>
            <p>Rs.{(total * 0.3).toFixed(2)}</p>
          </div>

          <div className="bg-blue-50 p-4 rounded-md mt-4">
            <h3 className="font-semibold text-blue-800 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Rental Terms
            </h3>
            <ul className="text-sm mt-2 text-blue-700 space-y-1">
              <li>• Books must be returned within 14 days</li>
              <li>• Late fees: Rs.10 per day after due date</li>
              <li>• Books must be returned in good condition</li>
              <li>• Rental fee is 30% of the book's purchase price</li>
            </ul>
          </div>

          {currentUser && (
            <div className="mt-4 border-t pt-4 bg-gray-50 p-3 rounded-md">
              <h3 className="font-semibold mb-2">Rental Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p>
                    <strong>Name:</strong> {currentUser.fullName}
                  </p>
                  <p>
                    <strong>Email:</strong> {currentUser.email}
                  </p>
                </div>
                <div>
                  <p>
                    <strong>Rental Duration:</strong> 14 days
                  </p>
                  <p>
                    <strong>Due Date:</strong>{" "}
                    {new Date(
                      Date.now() + 14 * 24 * 60 * 60 * 1000
                    ).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-800 p-3 rounded-md mt-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <div>
                  <p className="font-bold">Error Processing Rental:</p>
                  <p className="text-sm mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleSubmit}
            disabled={loading || cartItems.length === 0}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing Rental...
              </>
            ) : (
              `Confirm Rental - Rs.${(total * 0.3).toFixed(2)}`
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Checkout;
