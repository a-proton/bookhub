import React, { useState } from "react";
import { Eye, EyeOff, Mail, Lock, User, Phone, MapPin } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

const SignUpPage = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Genre options
  const genreOptions = [
    "Fiction", "Mystery", "Science Fiction", "Fantasy", "Romance", 
    "Thriller", "Biography", "History", "Self-Help", "Business",
    "Poetry", "Children's Books", "Young Adult", "Comics", "Art",
    "Cooking", "Travel", "Philosophy", "Science", "Religion"
  ];

  // Language options
  const languageOptions = [
    "English", "Spanish", "French", "German", "Chinese", 
    "Japanese", "Korean", "Russian", "Arabic", "Portuguese",
    "Italian", "Hindi", "Bengali", "Turkish", "Vietnamese"
  ];

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    age: "",
    gender: "",
    location: "",
    preferredLanguages: [],
    favoriteGenres: [],
    preferredBookFormat: "",
    booksPerMonth: "1",
    prefersTrending: false,
    openToRecommendations: true,
  });

   

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData({ ...formData, [name]: checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSelectChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleMultiSelect = (item, fieldName) => {
    const current = [...formData[fieldName]];
    
    if (current.includes(item)) {
      setFormData({
        ...formData,
        [fieldName]: current.filter(i => i !== item)
      });
    } else {
      setFormData({
        ...formData,
        [fieldName]: [...current, item]
      });
    }
  };

  const validateForm = () => {
    // Basic validation
    if (!formData.fullName) {
      setAlertMessage("Please enter your full name");
      setIsSuccess(false);
      return false;
    }
    if (!formData.email) {
      setAlertMessage("Please enter your email address");
      setIsSuccess(false);
      return false;
    }
    if (!formData.phone) {
      setAlertMessage("Please enter your phone number");
      setIsSuccess(false);
      return false;
    }
    if (!formData.password) {
      setAlertMessage("Please enter a password");
      setIsSuccess(false);
      return false;
    }
    if (!formData.confirmPassword) {
      setAlertMessage("Please confirm your password");
      setIsSuccess(false);
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setAlertMessage("Passwords do not match");
      setIsSuccess(false);
      return false;
    }
    if (formData.password.length < 8) {
      setAlertMessage("Password must be at least 8 characters");
      setIsSuccess(false);
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      setShowAlert(true);
      return;
    }
  
    setIsLoading(true);
    
    try {
      // Format the data for the API
      const userData = {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        age: formData.age ? parseInt(formData.age) : undefined,
        gender: formData.gender,
        location: formData.location,
        preferredLanguages: formData.preferredLanguages,
        favoriteGenres: formData.favoriteGenres,
        preferredBookFormat: formData.preferredBookFormat,
        rentalPreferences: {
          booksPerMonth: formData.booksPerMonth ? parseInt(formData.booksPerMonth) : 1,
          prefersTrending: formData.prefersTrending,
          openToRecommendations: formData.openToRecommendations
        }
      };
      
      // Make API call to register user
      const response = await axios.post(`http://localhost:5000/api/users/signup`, userData);
      
      setIsSuccess(true);
      setAlertMessage("Account created successfully! You can now login.");
      setShowAlert(true);
      
      // Reset form after successful submission
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
        age: "",
        gender: "",
        location: "",
        preferredLanguages: [],
        favoriteGenres: [],
        preferredBookFormat: "",
        booksPerMonth: "1",
        prefersTrending: false,
        openToRecommendations: true,
      });
      
      // Redirect to login page after alert is closed
      setTimeout(() => {
        navigate("/login");
      }, 2000);
      
    } catch (error) {
      setIsSuccess(false);
      if (error.response && error.response.data && error.response.data.message) {
        setAlertMessage(error.response.data.message);
      } else {
        setAlertMessage("Failed to create account. Please try again later.");
      }
      setShowAlert(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f0e8] p-4">
      <Card className="w-full max-w-4xl">
        <CardHeader className="space-y-2 pt-8">
          <p className="text-2xl text-purple-900 text-center">Join us</p>
          <CardTitle className="text-3xl text-center text-purple-900">
            Create Your Account
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-8">
          <form onSubmit={handleSubmit}> 
            <div className="relative mb-6">
               
              
              
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column - Account Details */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-purple-900">
                    Full Name *
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="fullName"
                      name="fullName"
                      type="text"
                      placeholder="Enter your full name"
                      value={formData.fullName}
                      onChange={handleChange}
                      className="pl-10 h-12"
                      required
                      disabled={isLoading}
                    />
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
                    Phone *
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
                  <Label htmlFor="password" className="text-purple-900">
                    Password *
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a password"
                      value={formData.password}
                      onChange={handleChange}
                      className="pl-10 h-12"
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400"
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-purple-900">
                    Re-enter Password *
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="pl-10 h-12"
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3 text-gray-400"
                      disabled={isLoading}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="age" className="text-purple-900">Age</Label>
                    <Input
                      id="age"
                      name="age"
                      type="number"
                      placeholder="Your age"
                      value={formData.age}
                      onChange={handleChange}
                      className="h-12"
                      min="1"
                      max="120"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="gender" className="text-purple-900">Gender</Label>
                    <Select name="gender" value={formData.gender} onValueChange={(value) => handleSelectChange("gender", value)}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="non-binary">Non-binary</SelectItem>
                        <SelectItem value="prefer not to say">Prefer not to say</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location" className="text-purple-900">Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="location"
                      name="location"
                      type="text"
                      placeholder="Your city/country"
                      value={formData.location}
                      onChange={handleChange}
                      className="pl-10 h-12"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column - Reading Preferences */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-purple-900">Preferred Language(s)</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-4 border rounded-md max-h-32 overflow-y-auto">
                    {languageOptions.map((language) => (
                      <div key={language} className="flex items-center space-x-2">
                        <Checkbox
                          id={`language-${language}`}
                          checked={formData.preferredLanguages.includes(language)}
                          onCheckedChange={() => handleMultiSelect(language, "preferredLanguages")}
                        />
                        <label htmlFor={`language-${language}`} className="text-sm">
                          {language}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-purple-900">Favorite Genres</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-4 border rounded-md max-h-40 overflow-y-auto">
                    {genreOptions.map((genre) => (
                      <div key={genre} className="flex items-center space-x-2">
                        <Checkbox
                          id={`genre-${genre}`}
                          checked={formData.favoriteGenres.includes(genre)}
                          onCheckedChange={() => handleMultiSelect(genre, "favoriteGenres")}
                        />
                        <label htmlFor={`genre-${genre}`} className="text-sm">
                          {genre}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="preferredBookFormat" className="text-purple-900">Preferred Book Format</Label>
                  <Select 
                    value={formData.preferredBookFormat} 
                    onValueChange={(value) => handleSelectChange("preferredBookFormat", value)}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select preferred format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hardcover">Hardcover</SelectItem>
                      <SelectItem value="paperback">Paperback</SelectItem>
                      <SelectItem value="e-book">E-book</SelectItem>
                      <SelectItem value="audiobook">Audiobook</SelectItem>
                      <SelectItem value="any">Any format</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-semibold text-purple-900">Reading Preferences</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="booksPerMonth" className="text-purple-900">How many books do you want to rent per month?</Label>
                    <Select 
                      value={formData.booksPerMonth} 
                      onValueChange={(value) => handleSelectChange("booksPerMonth", value)}
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select number of books" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 book per month</SelectItem>
                        <SelectItem value="2">2 books per month</SelectItem>
                        <SelectItem value="3">3 books per month</SelectItem>
                        <SelectItem value="4">4 books per month</SelectItem>
                        <SelectItem value="5">5+ books per month</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="prefersTrending"
                      name="prefersTrending"
                      checked={formData.prefersTrending}
                      onCheckedChange={(checked) => 
                        setFormData({...formData, prefersTrending: checked})
                      }
                    />
                    <Label htmlFor="prefersTrending" className="text-sm text-purple-900">
                      I prefer trending titles over hidden gems
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="openToRecommendations"
                      name="openToRecommendations"
                      checked={formData.openToRecommendations}
                      onCheckedChange={(checked) => 
                        setFormData({...formData, openToRecommendations: checked})
                      }
                    />
                    <Label htmlFor="openToRecommendations" className="text-sm text-purple-900">
                      I am open to recommendations based on similar readers
                    </Label>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <Button
                type="submit"
                className="w-full bg-purple-900 hover:bg-purple-800 h-12 text-base"
                disabled={isLoading}
              >
                {isLoading ? "Creating Account..." : "Sign Up"}
              </Button>
              
              <div className="text-center text-sm text-purple-900">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="text-purple-900 hover:underline font-medium"
                >
                  Log in
                </Link>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <AlertDialog open={showAlert} onOpenChange={setShowAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-purple-900">
              {isSuccess ? "Success" : "Form Validation Error"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-purple-900">
              {alertMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => setShowAlert(false)}
              className="bg-purple-900 hover:bg-purple-800"
            >
              {isSuccess ? "Great!" : "Ok"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SignUpPage;