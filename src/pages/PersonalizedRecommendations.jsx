"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const ProfilePreferencesForm = () => {
  const { userPreferences, updatePreferences, refreshUserData } = useAuth()
  const [formData, setFormData] = useState({
    age: "",
    gender: "",
    location: "",
    preferredLanguages: [],
    favoriteGenres: [],
    preferredBookFormat: "physical",
    rentalPreferences: {
      booksPerMonth: 1,
      prefersTrending: false,
      openToRecommendations: true,
    },
  })
  const [status, setStatus] = useState({ type: "", message: "" })
  const [loading, setLoading] = useState(false)

  // Available options for genres and languages
  const genreOptions = [
    "Fiction",
    "Non-Fiction",
    "Mystery",
    "Science Fiction",
    "Fantasy",
    "Romance",
    "Thriller",
    "Horror",
    "Biography",
    "History",
    "Self-Help",
    "Business",
    "Science",
    "Poetry",
    "Children",
  ]

  const languageOptions = [
    "English",
    "Spanish",
    "French",
    "German",
    "Italian",
    "Portuguese",
    "Russian",
    "Chinese",
    "Japanese",
    "Hindi",
    "Arabic",
  ]

  // Initialize form with user preferences
  useEffect(() => {
    if (userPreferences) {
      setFormData({
        age: userPreferences.age || "",
        gender: userPreferences.gender || "",
        location: userPreferences.location || "",
        preferredLanguages: userPreferences.preferredLanguages || [],
        favoriteGenres: userPreferences.favoriteGenres || [],
        preferredBookFormat: userPreferences.preferredBookFormat || "physical",
        rentalPreferences: userPreferences.rentalPreferences || {
          booksPerMonth: 1,
          prefersTrending: false,
          openToRecommendations: true,
        },
      })
    }
  }, [userPreferences])

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Handle checkbox changes for genres and languages
  const handleCheckboxChange = (category, value) => {
    setFormData((prev) => {
      const currentValues = prev[category] || []
      const newValues = currentValues.includes(value)
        ? currentValues.filter((item) => item !== value)
        : [...currentValues, value]

      return {
        ...prev,
        [category]: newValues,
      }
    })
  }

  // Handle rental preferences changes
  const handleRentalPreferenceChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      rentalPreferences: {
        ...prev.rentalPreferences,
        [name]: value,
      },
    }))
  }

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setStatus({ type: "", message: "" })

    try {
      const result = await updatePreferences(formData)

      if (result.success) {
        setStatus({
          type: "success",
          message: "Your preferences have been updated successfully!",
        })

        // Refresh user data to update recommendations
        await refreshUserData()
      } else {
        setStatus({
          type: "error",
          message: result.error || "Failed to update preferences. Please try again.",
        })
      }
    } catch (error) {
      console.error("Error updating preferences:", error)
      setStatus({
        type: "error",
        message: "An unexpected error occurred. Please try again later.",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Reading Preferences</CardTitle>
        <CardDescription>Update your reading preferences to get personalized book recommendations</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          {/* Status Alert */}
          {status.message && (
            <Alert
              className={`mb-6 ${status.type === "success" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}
            >
              {status.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertTitle>{status.type === "success" ? "Success" : "Error"}</AlertTitle>
              <AlertDescription>{status.message}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    name="age"
                    type="number"
                    value={formData.age}
                    onChange={handleInputChange}
                    placeholder="Your age"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, gender: value }))}
                  >
                    <SelectTrigger id="gender">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="non-binary">Non-binary</SelectItem>
                      <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="City, Country"
                  />
                </div>
              </div>
            </div>

            {/* Favorite Genres */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Favorite Genres</h3>
              <p className="text-sm text-gray-500">Select genres you enjoy reading</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {genreOptions.map((genre) => (
                  <div key={genre} className="flex items-center space-x-2">
                    <Checkbox
                      id={`genre-${genre}`}
                      checked={formData.favoriteGenres.includes(genre)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          handleCheckboxChange("favoriteGenres", genre)
                        } else {
                          handleCheckboxChange("favoriteGenres", genre)
                        }
                      }}
                    />
                    <Label htmlFor={`genre-${genre}`} className="text-sm">
                      {genre}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Preferred Languages */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Preferred Languages</h3>
              <p className="text-sm text-gray-500">Select languages you prefer to read in</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {languageOptions.map((language) => (
                  <div key={language} className="flex items-center space-x-2">
                    <Checkbox
                      id={`language-${language}`}
                      checked={formData.preferredLanguages.includes(language)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          handleCheckboxChange("preferredLanguages", language)
                        } else {
                          handleCheckboxChange("preferredLanguages", language)
                        }
                      }}
                    />
                    <Label htmlFor={`language-${language}`} className="text-sm">
                      {language}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Book Format Preference */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Book Format Preference</h3>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="physical"
                    name="preferredBookFormat"
                    value="physical"
                    checked={formData.preferredBookFormat === "physical"}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-indigo-600"
                  />
                  <Label htmlFor="physical">Physical Books</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="ebook"
                    name="preferredBookFormat"
                    value="ebook"
                    checked={formData.preferredBookFormat === "ebook"}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-indigo-600"
                  />
                  <Label htmlFor="ebook">E-Books</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="audiobook"
                    name="preferredBookFormat"
                    value="audiobook"
                    checked={formData.preferredBookFormat === "audiobook"}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-indigo-600"
                  />
                  <Label htmlFor="audiobook">Audiobooks</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="no-preference"
                    name="preferredBookFormat"
                    value="no-preference"
                    checked={formData.preferredBookFormat === "no-preference"}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-indigo-600"
                  />
                  <Label htmlFor="no-preference">No Preference</Label>
                </div>
              </div>
            </div>

            {/* Rental Preferences */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Rental Preferences</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="booksPerMonth">Books per month</Label>
                  <Select
                    value={formData.rentalPreferences.booksPerMonth.toString()}
                    onValueChange={(value) => handleRentalPreferenceChange("booksPerMonth", Number.parseInt(value))}
                  >
                    <SelectTrigger id="booksPerMonth">
                      <SelectValue placeholder="Select number of books" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 book</SelectItem>
                      <SelectItem value="2">2 books</SelectItem>
                      <SelectItem value="3">3 books</SelectItem>
                      <SelectItem value="4">4 books</SelectItem>
                      <SelectItem value="5">5+ books</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="prefersTrending"
                    checked={formData.rentalPreferences.prefersTrending}
                    onCheckedChange={(checked) => handleRentalPreferenceChange("prefersTrending", checked)}
                  />
                  <Label htmlFor="prefersTrending">I prefer trending and popular books</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="openToRecommendations"
                    checked={formData.rentalPreferences.openToRecommendations}
                    onCheckedChange={(checked) => handleRentalPreferenceChange("openToRecommendations", checked)}
                  />
                  <Label htmlFor="openToRecommendations">I'm open to personalized recommendations</Label>
                </div>
              </div>
            </div>
          </div>

          <CardFooter className="flex justify-end pt-6 px-0">
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Preferences"}
            </Button>
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  )
}

export default ProfilePreferencesForm
