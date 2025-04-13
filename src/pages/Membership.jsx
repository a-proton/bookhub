import React, { useState, useEffect } from "react";
import { MapPin, User, Mail, Phone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

// Make sure this matches your backend URL exactly
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const MembershipForm = () => {
  const navigate = useNavigate();
  const { currentUser: user, isAuthenticated } = useAuth();
  const [membershipPlans, setMembershipPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    membershipPlan: ""
  });

  // Pre-fill form data if user is authenticated
  useEffect(() => {
    if (user) {
      setFormData(prevData => ({
        ...prevData,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.phone || ""
      }));
    }
  }, [user]);

  // Fetch membership plans
  useEffect(() => {
    const fetchMembershipPlans = async () => {
      try {
        setIsLoading(true);
        // Make sure this endpoint is correct
        const response = await axios.get(`${API_URL}/memberships/plans`);
        setMembershipPlans(response.data);
      } catch (error) {
        console.error("Failed to fetch membership plans:", error);
        setAlertMessage("Unable to load membership plans. Please try again later.");
        setIsSuccess(false);
        setShowAlert(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMembershipPlans();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (value) => {
    setFormData({ ...formData, membershipPlan: value });
  };

  const validateForm = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!formData.firstName) {
      setAlertMessage("Please enter your first name");
      return false;
    }
    if (!formData.lastName) {
      setAlertMessage("Please enter your last name");
      return false;
    }
    if (!formData.email || !emailRegex.test(formData.email)) {
      setAlertMessage("Please enter a valid email address");
      return false;
    }
    if (!formData.phone) {
      setAlertMessage("Please enter your phone number");
      return false;
    }
    if (!formData.address) {
      setAlertMessage("Please enter your address");
      return false;
    }
    if (!formData.membershipPlan) {
      setAlertMessage("Please select a membership plan");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setIsSuccess(false);
      setShowAlert(true);
      return;
    }

    // Check if user is logged in first
    if (!isAuthenticated) {
      setAlertMessage("You need to be logged in to apply for membership.");
      setIsSuccess(false);
      setShowAlert(true);
      setTimeout(() => {
        navigate("/login");
      }, 2000);
      return;
    }

    setIsLoading(true);
    
    try {
      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error("Authentication token not found");
      }
      
      // Debug token (remove in production)
      console.log("Using token (first 10 chars):", token.substring(0, 10) + "...");
      
      // Log token payload for debugging
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log("Token payload:", payload);
      } catch (e) {
        console.error("Failed to decode token:", e);
      }
      
      // Send request with token in Authorization header - FIXED ENDPOINT
      const response = await axios.post(
        `${API_URL}/memberships/apply`, 
        formData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      setIsSuccess(true);
      setAlertMessage("Your membership application has been submitted successfully! We'll review it and get back to you soon.");
      setShowAlert(true);
      
      // Reset form after successful submission
      setFormData({
        firstName: user?.firstName || "",
        lastName: user?.lastName || "",
        email: user?.email || "",
        phone: user?.phone || "",
        address: "",
        membershipPlan: ""
      });

      // Redirect after alert is closed
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
      
    } catch (error) {
      setIsSuccess(false);
      console.error("Error submitting membership:", error);
      
      if (error.response && error.response.data && error.response.data.message) {
        setAlertMessage(error.response.data.message);
      } else if (error.message === "Authentication token not found") {
        setAlertMessage("Your session has expired. Please log in again.");
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        setAlertMessage("Server error. Please try again later.");
      }
      setShowAlert(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Authentication state:', { isAuthenticated, token: localStorage.getItem('token') });
    }
  }, [isAuthenticated]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f0e8] p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-2 pt-8 pb-6">
          <CardTitle className="text-3xl text-center text-purple-900">
            Become a Member
          </CardTitle>
          <p className="text-center text-purple-900">
            Join our book lovers' community and get access to exclusive benefits.
          </p>
        </CardHeader>
        <CardContent className="pb-8">
          {!isAuthenticated ? (
            <div className="text-center p-6">
              <h3 className="text-xl text-purple-900 mb-4">You need to log in first</h3>
              <p className="mb-6">Please log in to your account to apply for membership.</p>
              <div className="flex justify-center gap-4">
                <Button 
                  onClick={() => navigate("/login")}
                  className="bg-purple-900 hover:bg-purple-800"
                >
                  Log In
                </Button>
                <Button 
                  onClick={() => navigate("/signup")}
                  variant="outline"
                  className="border-purple-900 text-purple-900 hover:bg-purple-100"
                >
                  Sign Up
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-purple-900">
                    First Name *
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="firstName"
                      name="firstName"
                      type="text"
                      placeholder="Enter your first name"
                      value={formData.firstName}
                      onChange={handleChange}
                      className="pl-10 h-12"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-purple-900">
                    Last Name *
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="lastName"
                      name="lastName"
                      type="text"
                      placeholder="Enter your last name"
                      value={formData.lastName}
                      onChange={handleChange}
                      className="pl-10 h-12"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-purple-900">
                  Email *
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-10 h-12"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-purple-900">
                  Phone Number *
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="Enter your phone number"
                    value={formData.phone}
                    onChange={handleChange}
                    className="pl-10 h-12"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-purple-900">
                  Address *
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="address"
                    name="address"
                    type="text"
                    placeholder="Enter your address"
                    value={formData.address}
                    onChange={handleChange}
                    className="pl-10 h-12"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="membershipPlan" className="text-purple-900">
                  Membership Plan *
                </Label>
                <Select 
                  onValueChange={handleSelectChange} 
                  value={formData.membershipPlan}
                  disabled={isLoading || membershipPlans.length === 0}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select a membership plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {membershipPlans.map((plan) => (
                      <SelectItem key={plan._id} value={plan._id}>
                        {plan.name} - {plan.currency}{plan.pricePerMonth}/month
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {membershipPlans.length > 0 && (
                  <div className="mt-2">
                    {formData.membershipPlan && membershipPlans.map(plan => {
                      if (plan._id === formData.membershipPlan) {
                        return (
                          <div key={plan._id} className="p-3 bg-purple-50 rounded-md">
                            <h4 className="font-medium text-purple-900">{plan.name}</h4>
                            <p className="text-sm mt-1">{plan.description}</p>
                            {plan.benefits && plan.benefits.length > 0 && (
                              <ul className="list-disc list-inside text-sm mt-2">
                                {plan.benefits.map((benefit, index) => (
                                  <li key={index}>{benefit}</li>
                                ))}
                              </ul>
                            )}
                            <p className="text-sm mt-2">
                              <span className="font-medium">Maximum books per month:</span> {plan.maxBooksPerMonth}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                )}
              </div>

              <p className="text-sm text-gray-500">* Required fields</p>

              <Button
                type="submit"
                className="w-full bg-purple-900 hover:bg-purple-800 h-12 text-base"
                disabled={isLoading || membershipPlans.length === 0}
              >
                {isLoading ? "Submitting Application..." : "Submit Membership Application"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showAlert} onOpenChange={setShowAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-purple-900">
              {isSuccess ? "Application Submitted" : "Form Validation Error"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-purple-900">
              {alertMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => setShowAlert(false)}
              className="bg-purple-900 hover:bg-purple-800 text-white"
            >
              {isSuccess ? "Great!" : "Ok"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MembershipForm;