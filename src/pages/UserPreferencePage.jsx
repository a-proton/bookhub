import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  MapPin, 
  Book, 
  Languages 
} from "lucide-react";
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
  SelectValue 
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import axios from "axios";

const UserPreferencesPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  // Get token from URL if present (for Google OAuth redirects)
  const queryParams = new URLSearchParams(location.search);
  const tokenFromUrl = queryParams.get('token');
  
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

  useEffect(() => {
    // If token from URL exists, store it
    if (tokenFromUrl) {
      localStorage.setItem('token', tokenFromUrl);
    }
    
    // Get user data from API
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        
        if (!token) {
          navigate('/login');
          return;
        }
        
        const response = await axios.get('http://localhost:5000/api/users/profile', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        const userData = response.data.user;
        
        // Update form data with user preferences
        setFormData({
          age: userData.age || "",
          gender: userData.gender || "",
          location: userData.location || "",
          preferredLanguages: userData.preferredLanguages || [],
          favoriteGenres: userData.favoriteGenres || [],
          preferredBookFormat: userData.preferredBookFormat || "",
          booksPerMonth: userData.rentalPreferences?.booksPerMonth?.toString() || "1",
          prefersTrending: userData.rentalPreferences?.prefersTrending || false,
          openToRecommendations: userData.rentalPreferences?.openToRecommendations !== false,
        });
      } catch (error) {
        console.error("Error fetching user data:", error);
        if (error.response?.status === 401) {
          navigate('/login');
        }
      } finally {
        setIsLoading(false);
        setIsInitialLoad(false);
      }
    };
    
    fetchUserData();
  }, [navigate, tokenFromUrl]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      
      // Format the data for the API
      const preferencesData = {
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
      
      // Make API call to update preferences
      const response = await axios.put(
        'http://localhost:5000/api/users/preferences', 
        preferencesData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      setIsSuccess(true);
      setAlertMessage("Preferences updated successfully!");
      setShowAlert(true);
      
    } catch (error) {
      setIsSuccess(false);
      if (error.response && error.response.data && error.response.data.message) {
        setAlertMessage(error.response.data.message);
      } else {
        setAlertMessage("Failed to update preferences. Please try again later.");
      }
      setShowAlert(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state on initial load
  if (isInitialLoad) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f0e8]">
        <Card className="w-full max-w-lg p-8 text-center">
          <CardContent>
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-900"></div>
              <p className="text-purple-900 text-lg">Loading your profile...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f0e8] p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-2 pt-8 pb-8">
          <CardTitle className="text-3xl text-center text-purple-900">
            Your Reading Preferences
          </CardTitle>
          <p className="text-center text-purple-900">
            Help us personalize your book recommendations
          </p>
        </CardHeader>
        <CardContent className="pb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
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
            
            <div className="space-y-2">
              <Label className="text-purple-900">Preferred Language(s)</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-4 border rounded-md max-h-40 overflow-y-auto">
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
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-4 border rounded-md max-h-60 overflow-y-auto">
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
            
            <div className="flex space-x-4">
              <Button
                type="button"
                onClick={() => navigate('/dashboard')}
                variant="outline"
                className="w-full h-12 text-base text-purple-900"
                disabled={isLoading}
              >
                Skip for Now
              </Button>
              <Button
                type="submit"
                className="w-full bg-purple-900 hover:bg-purple-800 h-12 text-base"
                disabled={isLoading}
              >
                {isLoading ? "Saving..." : "Save Preferences"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <AlertDialog open={showAlert} onOpenChange={setShowAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-purple-900">
              {isSuccess ? "Success" : "Error"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-purple-900">
              {alertMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => {
                setShowAlert(false);
                if (isSuccess) {
                  navigate('/dashboard');
                }
              }}
              className="bg-purple-900 hover:bg-purple-800"
            >
              {isSuccess ? "Continue to Dashboard" : "Ok"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UserPreferencesPage;