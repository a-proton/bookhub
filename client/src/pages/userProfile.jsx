"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
// Import RentalHistory component
import RentalHistory from "./RentalHistory";
// Shadcn UI Components
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/components/ui/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

// Icons
import {
  User,
  Edit,
  Mail,
  Phone,
  BookOpen,
  Globe,
  Loader2,
  BookMarked,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";

const Profile = () => {
  const {
    currentUser,
    userPreferences,
    updateUserProfile,
    fetchUserData,
    API_URL,
  } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("details");
  const [rentalKey, setRentalKey] = useState(Date.now());
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [dataFetched, setDataFetched] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    age: "",
    gender: "",
    location: "",
    preferredLanguages: [],
    favoriteGenres: [],
  });

  // Debug logging to identify state changes
  useEffect(() => {
    console.group("Profile Component Data");
    console.log("currentUser:", currentUser);
    console.log("userPreferences:", userPreferences);
    console.log("dataLoading:", dataLoading);
    console.log("dataFetched:", dataFetched);
    console.groupEnd();
  }, [currentUser, userPreferences, dataLoading, dataFetched]);

  // Check for activeTab in navigation state
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state]);

  // Define API_URL with fallback
  const VITE_API_BASE_URL = API_URL || "http://localhost:3000/api";

  // Separate function to fetch user preferences
  const fetchUserPreferences = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found");
        return;
      }

      console.log(
        "Fetching user preferences from:",
        `${VITE_API_BASE_URL}/users/validate-token`
      );
      const response = await fetch(
        `${VITE_API_BASE_URL}/users/validate-token`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("Fetched user data with preferences:", data);
        // The user data should include preferences from your backend
      } else {
        console.error("Failed to fetch user data:", response.status);
      }
    } catch (error) {
      console.error("Error fetching user preferences:", error);
    }
  }, [VITE_API_BASE_URL]);

  // Improved loadUserData function
  const loadUserData = useCallback(async () => {
    if (dataFetched && retryCount === 0) return; // Skip if data has already been fetched and not retrying

    setDataLoading(true);
    try {
      console.log("Starting to load user data...");

      // Fetch user data if the function exists
      if (typeof fetchUserData === "function") {
        console.log("Calling fetchUserData...");
        await fetchUserData();
        console.log("User data after fetch:", currentUser);
      }

      // Also try to fetch preferences separately
      await fetchUserPreferences();

      setDataFetched(true); // Mark data as fetched
      setRetryCount(0); // Reset retry count on success
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast({
        title: "Error",
        description: "Failed to load your profile data. Please try refreshing.",
        variant: "destructive",
      });
    } finally {
      setDataLoading(false);
    }
  }, [
    fetchUserData,
    fetchUserPreferences,
    currentUser,
    toast,
    dataFetched,
    retryCount,
  ]);

  // Retry function for manual refresh
  const retryFetchUserData = useCallback(() => {
    setDataFetched(false);
    setRetryCount((prev) => prev + 1);
    loadUserData();
  }, [loadUserData]);

  // Use the memoized function in useEffect
  useEffect(() => {
    loadUserData();

    // Reset rental component key when user changes
    setRentalKey(Date.now());
  }, [loadUserData]);

  // Force reload of rental history when switching to rentals tab
  useEffect(() => {
    if (activeTab === "rentals") {
      setRentalKey(Date.now());
    }
  }, [activeTab]);

  // Update form data when user data or preferences change
  useEffect(() => {
    console.log(
      "Updating form data - currentUser:",
      currentUser,
      "userPreferences:",
      userPreferences
    );

    // Only update form data when we actually have user data
    if (currentUser || userPreferences) {
      console.log("Updating form data from user/preferences");

      // Helper function to ensure value is an array
      const ensureArray = (value) => {
        if (Array.isArray(value)) return value;
        if (typeof value === "string") {
          // Handle both comma-separated and JSON string formats
          try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed)) return parsed;
          } catch (e) {
            // If JSON parsing fails, try comma separation
            return value
              .split(",")
              .map((item) => item.trim())
              .filter((item) => item !== "");
          }
        }
        return [];
      };

      const newFormData = {
        fullName: currentUser?.fullName || "",
        email: currentUser?.email || "",
        phone: currentUser?.phone || "",
        age: userPreferences?.age || currentUser?.age || "",
        gender: userPreferences?.gender || currentUser?.gender || "",
        location: userPreferences?.location || currentUser?.location || "",
        preferredLanguages: ensureArray(
          userPreferences?.preferredLanguages || currentUser?.preferredLanguages
        ),
        favoriteGenres: ensureArray(
          userPreferences?.favoriteGenres || currentUser?.favoriteGenres
        ),
      };

      console.log("New form data:", newFormData);
      setFormData(newFormData);
    }
  }, [currentUser, userPreferences]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Improved handleArrayChange function that properly handles arrays
  const handleArrayChange = (e) => {
    const { name, value } = e.target;

    // Always convert to array, properly split by commas
    const arrayValue = value
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item !== "");

    console.log(`${name} before:`, formData[name]);
    console.log(`${name} updated to:`, arrayValue);

    setFormData((prev) => ({
      ...prev,
      [name]: arrayValue,
    }));
  };

  const handleTabChange = (value) => {
    setActiveTab(value);
  };

  // Improved handleSubmit function that ensures arrays are properly sent
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    console.log("Submitting form data:", formData);

    try {
      const token = localStorage.getItem("token");
      console.log(
        "Updating profile with API URL:",
        `${VITE_API_BASE_URL}/auth/update-profile`
      );

      // Update user profile
      const response = await fetch(`${VITE_API_BASE_URL}/auth/update-profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          phone: formData.phone,
          age: formData.age,
          gender: formData.gender,
          location: formData.location,
          // Make sure these are arrays
          preferredLanguages: Array.isArray(formData.preferredLanguages)
            ? formData.preferredLanguages
            : [],
          favoriteGenres: Array.isArray(formData.favoriteGenres)
            ? formData.favoriteGenres
            : [],
        }),
      });

      let result;
      try {
        result = await response.json();
      } catch (jsonError) {
        console.error("JSON parsing error:", jsonError);
        result = { message: "Invalid server response" };
      }

      if (response.ok) {
        // After successful profile update, refresh recommendations
        try {
          await fetch(`${VITE_API_BASE_URL}/books/refresh-recommendations`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          console.log("Recommendations refresh triggered");
        } catch (refreshErr) {
          console.error("Failed to refresh recommendations:", refreshErr);
          // Continue with profile update flow even if recommendation refresh fails
        }

        toast({
          title: "Profile Updated",
          description:
            "Your profile information has been updated successfully. Book recommendations will be refreshed on your next visit to the home page.",
        });
        setIsEditing(false);
        // Refresh user data
        setDataFetched(false); // Force refetch
        await loadUserData();
      } else {
        toast({
          title: "Update Failed",
          description: result.message || "Failed to update profile",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Profile update error:", err);
      toast({
        title: "Update Failed",
        description: "There was a problem updating your profile.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (dataLoading) {
    return (
      <div className="container mx-auto p-4 mt-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
            <p className="text-gray-500">Loading your profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="container mx-auto p-4 mt-8">
        <div className="flex justify-center items-center h-64 flex-col">
          <p className="text-red-500 mb-4">Unable to load profile data</p>
          <Button onClick={() => navigate("/login")}>Return to Login</Button>
          <Button
            onClick={retryFetchUserData}
            variant="outline"
            className="mt-4"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Profile Data
          </Button>
        </div>
      </div>
    );
  }

  // Get user initial for avatar - with safer access patterns
  const userInitial = currentUser?.fullName
    ? currentUser.fullName.charAt(0).toUpperCase()
    : currentUser?.email
    ? currentUser.email.charAt(0).toUpperCase()
    : "U";

  // Helper function to safely get array data for display
  const getArrayData = (preferenceField, userField) => {
    const ensureArray = (value) => {
      if (Array.isArray(value)) return value;
      if (typeof value === "string") {
        try {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed)) return parsed;
        } catch (e) {
          return value
            .split(",")
            .map((item) => item.trim())
            .filter((item) => item !== "");
        }
      }
      return [];
    };

    const prefData = ensureArray(userPreferences?.[preferenceField]);
    const userData = ensureArray(currentUser?.[userField]);

    return prefData.length > 0 ? prefData : userData;
  };

  const displayLanguages = getArrayData(
    "preferredLanguages",
    "preferredLanguages"
  );
  const displayGenres = getArrayData("favoriteGenres", "favoriteGenres");

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
            <h1 className="text-3xl font-bold">
              {currentUser?.fullName || "BookHub User"}
            </h1>
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              {currentUser?.email && (
                <div className="flex items-center gap-1 text-purple-200">
                  <Mail className="h-4 w-4" />
                  <span className="text-sm">{currentUser.email}</span>
                </div>
              )}
              {currentUser?.phone && (
                <div className="flex items-center gap-1 text-purple-200">
                  <Phone className="h-4 w-4" />
                  <span className="text-sm">{currentUser.phone}</span>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              {currentUser?.hasMembership === true ? (
                <Badge
                  variant="secondary"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <ShieldCheck className="h-3 w-3 mr-1" /> Premium Member
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
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

      <Tabs
        defaultValue="details"
        value={activeTab}
        onValueChange={handleTabChange}
        className="bg-white rounded-b-lg shadow-lg"
      >
        <TabsList className="grid grid-cols-4 rounded-none border-b">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="preferences">Reading Preferences</TabsTrigger>
          <TabsTrigger value="rentals">My Rentals</TabsTrigger>
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
                  <div className="font-medium">
                    {currentUser?.fullName || "Not provided"}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-gray-500">Email Address</Label>
                  <div className="font-medium">
                    {currentUser?.email || "Not provided"}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-gray-500">Phone Number</Label>
                  <div className="font-medium">
                    {currentUser?.phone || "Not provided"}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-gray-500">Age</Label>
                  <div className="font-medium">
                    {userPreferences?.age || currentUser?.age || "Not provided"}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-gray-500">Gender</Label>
                  <div className="font-medium capitalize">
                    {userPreferences?.gender ||
                      currentUser?.gender ||
                      "Not provided"}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-gray-500">Location</Label>
                  <div className="font-medium">
                    {userPreferences?.location ||
                      currentUser?.location ||
                      "Not provided"}
                  </div>
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
                  <Label className="text-sm text-gray-500">
                    Preferred Languages
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {displayLanguages.length > 0 ? (
                      displayLanguages.map((lang) => (
                        <Badge
                          key={lang}
                          variant="outline"
                          className="bg-purple-50"
                        >
                          <Globe className="h-3 w-3 mr-1 text-purple-600" />{" "}
                          {lang}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-gray-500 italic">
                        No languages specified
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-gray-500">
                    Favorite Genres
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {displayGenres.length > 0 ? (
                      displayGenres.map((genre) => (
                        <Badge
                          key={genre}
                          variant="outline"
                          className="bg-purple-50"
                        >
                          <BookMarked className="h-3 w-3 mr-1 text-purple-600" />{" "}
                          {genre}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-gray-500 italic">
                        No genres specified
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Updated Rentals Tab - Now using the RentalHistory component */}
        <TabsContent value="rentals" className="p-6">
          <RentalHistory key={rentalKey} />
        </TabsContent>

        <TabsContent value="membership" className="p-6">
          <div className="text-center p-8">
            <ShieldCheck className="h-12 w-12 text-purple-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium mb-2">Membership Details</h3>
            <p className="text-gray-500 mb-6">
              You don't have an active membership.
            </p>
            <Button onClick={() => navigate("/MembershipPage")}>
              View Membership Plans
            </Button>
          </div>
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
                  onValueChange={(value) => handleSelectChange("gender", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="prefer_not_to_say">
                      Prefer not to say
                    </SelectItem>
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
                  value={
                    Array.isArray(formData.preferredLanguages)
                      ? formData.preferredLanguages.join(", ")
                      : ""
                  }
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
                  value={
                    Array.isArray(formData.favoriteGenres)
                      ? formData.favoriteGenres.join(", ")
                      : ""
                  }
                  onChange={handleArrayChange}
                  placeholder="Fiction, Mystery, Biography, etc."
                />
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditing(false)}
              >
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
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {process.env.NODE_ENV !== "production" && (
        <div className="fixed bottom-4 right-4 z-50">
          <Button
            variant="outline"
            size="sm"
            className="bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200"
            onClick={() => {
              console.log("Current API URL:", VITE_API_BASE_URL);
              console.log("Auth Context API_URL:", API_URL || "Not available");
              console.log("Current user state:", currentUser);
              console.log("User preferences:", userPreferences);
              console.log("Form data:", formData);
              console.log("Display languages:", displayLanguages);
              console.log("Display genres:", displayGenres);
              console.log("Auth context values:", {
                currentUser,
                userPreferences,
                API_URL,
              });

              toast({
                title: "Debug Info",
                description: "Check the console for debug information",
              });
            }}
          >
            Debug
          </Button>
        </div>
      )}
      <Toaster />
    </div>
  );
};

export default Profile;
