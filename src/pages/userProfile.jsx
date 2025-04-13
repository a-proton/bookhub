import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Shadcn UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/components/ui/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

// Icons
import { 
  User, Edit, Mail, Phone, MapPin, Calendar, BookOpen, 
  Bookmark, Globe, CircleCheck, Loader2, BookMarked, ShieldCheck
} from "lucide-react";

const Profile = () => {
  const { currentUser, fetchUserData, userPreferences } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    age: '',
    gender: '',
    location: '',
    preferredLanguages: [],
    favoriteGenres: []
  });

  // API URL - make sure it matches your auth context
  const API_URL = process.env.REACT_APP_API_URL || 
                (process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5000/api');

  useEffect(() => {
    if (currentUser) {
      // Initialize form data with current user data
      setFormData({
        fullName: currentUser.fullName || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        age: userPreferences?.age || '',
        gender: userPreferences?.gender || '',
        location: userPreferences?.location || '',
        preferredLanguages: userPreferences?.preferredLanguages || [],
        favoriteGenres: userPreferences?.favoriteGenres || []
      });
    }
  }, [currentUser, userPreferences]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleArrayChange = (e) => {
    const { name, value } = e.target;
    // Convert comma-separated string to array
    setFormData(prev => ({
      ...prev,
      [name]: value.split(',').map(item => item.trim()).filter(item => item !== '')
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error("Not authenticated");
      }

      // Update user profile
      const response = await axios.put(
        `${API_URL}/users/profile`,
        {
          fullName: formData.fullName,
          phone: formData.phone,
          age: formData.age,
          gender: formData.gender,
          location: formData.location,
          preferredLanguages: formData.preferredLanguages,
          favoriteGenres: formData.favoriteGenres
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Profile update response:', response.data);
      
      // Refresh user data after successful update
      await fetchUserData();
      
      // Show success toast
      toast({
        title: "Profile Updated",
        description: "Your profile information has been updated successfully.",
        variant: "success",
      });
      
      setIsEditing(false);
    } catch (err) {
      console.error('Profile update error:', err);
      
      // Show error toast
      toast({
        title: "Update Failed",
        description: err.response?.data?.message || "There was a problem updating your profile.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="container mx-auto p-4 mt-8">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
        </div>
      </div>
    );
  }

  // Get user initial for avatar
  const userInitial = currentUser.fullName 
    ? currentUser.fullName.charAt(0).toUpperCase() 
    : currentUser.email.charAt(0).toUpperCase();

  return (
    <div className="container mx-auto p-4 mt-8 max-w-4xl">
      <div className="bg-gradient-to-r from-purple-700 to-purple-900 text-white p-8 rounded-t-lg shadow-lg">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <Avatar className="h-24 w-24 border-4 border-white shadow-xl">
            <AvatarFallback className="bg-white text-purple-700 text-3xl">
              {userInitial}
            </AvatarFallback>
          </Avatar>
          
          <div className="space-y-2 flex-1 text-center md:text-left">
            <h1 className="text-3xl font-bold">{currentUser.fullName || 'BookHub User'}</h1>
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              <div className="flex items-center gap-1 text-purple-200">
                <Mail className="h-4 w-4" />
                <span className="text-sm">{currentUser.email}</span>
              </div>
              {currentUser.phone && (
                <div className="flex items-center gap-1 text-purple-200">
                  <Phone className="h-4 w-4" />
                  <span className="text-sm">{currentUser.phone}</span>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              {currentUser.hasMembership ? (
                <Badge variant="secondary" className="bg-green-600 hover:bg-green-700">
                  <ShieldCheck className="h-3 w-3 mr-1" /> Premium Member
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-purple-600 hover:bg-purple-700 text-white">
                  <User className="h-3 w-3 mr-1" /> Standard Account
                </Badge>
              )}
            </div>
          </div>
          
          <Button 
            variant="secondary" 
            size="sm" 
            className="md:ml-auto" 
            onClick={() => setIsEditing(true)}
          >
            <Edit className="h-4 w-4 mr-2" /> Edit Profile
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="details" className="bg-white rounded-b-lg shadow-lg">
        <TabsList className="grid grid-cols-3 rounded-none border-b">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="preferences">Reading Preferences</TabsTrigger>
          <TabsTrigger value="membership">Membership</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium flex items-center gap-2 text-purple-800">
                <User className="h-5 w-5" /> Personal Information
              </h3>
              <Separator className="my-3" />
              
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm text-gray-500">Full Name</Label>
                  <div className="font-medium">{currentUser.fullName || 'Not provided'}</div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm text-gray-500">Email Address</Label>
                  <div className="font-medium">{currentUser.email}</div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm text-gray-500">Phone Number</Label>
                  <div className="font-medium">{currentUser.phone || 'Not provided'}</div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm text-gray-500">Age</Label>
                  <div className="font-medium">{userPreferences?.age || 'Not provided'}</div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm text-gray-500">Gender</Label>
                  <div className="font-medium capitalize">{userPreferences?.gender || 'Not provided'}</div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm text-gray-500">Location</Label>
                  <div className="font-medium">{userPreferences?.location || 'Not provided'}</div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="preferences" className="p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium flex items-center gap-2 text-purple-800">
                <BookOpen className="h-5 w-5" /> Reading Preferences
              </h3>
              <Separator className="my-3" />
              
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm text-gray-500">Preferred Languages</Label>
                  <div className="flex flex-wrap gap-2">
                    {userPreferences?.preferredLanguages?.length 
                      ? userPreferences.preferredLanguages.map(lang => (
                          <Badge key={lang} variant="outline" className="bg-purple-50">
                            <Globe className="h-3 w-3 mr-1 text-purple-600" /> {lang}
                          </Badge>
                        ))
                      : <span className="text-gray-500 italic">No languages specified</span>
                    }
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm text-gray-500">Favorite Genres</Label>
                  <div className="flex flex-wrap gap-2">
                    {userPreferences?.favoriteGenres?.length 
                      ? userPreferences.favoriteGenres.map(genre => (
                          <Badge key={genre} variant="outline" className="bg-purple-50">
                            <BookMarked className="h-3 w-3 mr-1 text-purple-600" /> {genre}
                          </Badge>
                        ))
                      : <span className="text-gray-500 italic">No genres specified</span>
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="membership" className="p-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-purple-800">Membership Status</CardTitle>
              <CardDescription>
                {currentUser.hasMembership 
                  ? "You have an active membership with premium benefits"
                  : "Upgrade to access exclusive books and premium features"}
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="rounded-lg border p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {currentUser.hasMembership 
                      ? <CircleCheck className="h-5 w-5 text-green-600" />
                      : <Bookmark className="h-5 w-5 text-gray-400" />
                    }
                    <span className="font-medium">
                      {currentUser.hasMembership ? 'Active Premium Member' : 'Standard Account'}
                    </span>
                  </div>
                  
                  <Badge variant={currentUser.hasMembership ? "success" : "outline"}>
                    {currentUser.hasMembership ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
              
              {currentUser.hasMembership && (
                <div className="space-y-2">
                  <h4 className="font-medium">Your Premium Benefits</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm pl-2">
                    <li>Access to exclusive premium books</li>
                    <li>Extended borrowing periods (21 days)</li>
                    <li>Reserve books in advance</li>
                    <li>Free home delivery of books</li>
                    <li>Priority customer support</li>
                  </ul>
                </div>
              )}
            </CardContent>
            
            <CardFooter>
              {!currentUser.hasMembership && (
                <Button 
                  className="bg-purple-600 hover:bg-purple-700 w-full"
                  onClick={() => navigate('/MembershipPage')}
                >
                  Upgrade to Premium Membership
                </Button>
              )}
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Edit Profile Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Your Profile</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Your full name"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Your contact number"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  name="age"
                  type="number"
                  value={formData.age}
                  onChange={handleChange}
                  placeholder="Your age"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="gender">Gender</Label>
                <Select 
                  name="gender" 
                  value={formData.gender} 
                  onValueChange={(value) => handleSelectChange('gender', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Your city/town"
                />
              </div>
            </div>
            
            <Separator className="my-4" />
            
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Reading Preferences</h3>
              
              <div className="grid gap-2">
                <Label htmlFor="preferredLanguages">
                  Preferred Languages (comma-separated)
                </Label>
                <Input
                  id="preferredLanguages"
                  name="preferredLanguages"
                  value={formData.preferredLanguages.join(', ')}
                  onChange={handleArrayChange}
                  placeholder="English, Hindi, Spanish, etc."
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="favoriteGenres">
                  Favorite Genres (comma-separated)
                </Label>
                <Input
                  id="favoriteGenres"
                  name="favoriteGenres"
                  value={formData.favoriteGenres.join(', ')}
                  onChange={handleArrayChange}
                  placeholder="Fiction, Mystery, Biography, etc."
                />
              </div>
            </div>
            
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-purple-600 hover:bg-purple-700"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      <Toaster />
    </div>
  );
};

export default Profile;