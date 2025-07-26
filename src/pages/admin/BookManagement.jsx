"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2, Pencil, ChevronLeft } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const BookManagement = () => {
  const { toast } = useToast();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editBookId, setEditBookId] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    isbn: "",
    genre: "",
    language: "English",
    publicationYear: "",
    publisher: "",
    description: "",
    price: "",
    imageUrl: "",
    stockQuantity: 1,
  });

  // Common languages for books
  const commonLanguages = [
    "English",
    "Spanish",
    "French",
    "Nepali",
    "Chinese",
    "Japanese",
    "Russian",
    "Arabic",
    "Hindi",
    "Portuguese",
    "Italian",
    "Other",
  ];

  // Get the correct API base URL
  const API_BASE_URL = "http://localhost:5173";

  // Navigation function
  const handleBackToDashboard = () => {
    // Option 1: If you're using Next.js router
    // router.push('/admin/dashboard');

    // Option 2: If you're using React Router
    // navigate('/admin/dashboard');

    // Option 3: Simple window location (replace with your actual dashboard URL)
    window.location.href = "/admin/dashboard";
  };

  // Get auth token on component load and whenever needed
  const getAuthToken = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Authentication token not found. Please log in again.");
      return null;
    }
    console.log("Token found:", token.substring(0, 10) + "..."); // Log part of the token for debugging
    return token;
  };

  // Create axios instance with auth headers
  const authAxios = () => {
    const token = getAuthToken();
    if (!token) return null;

    // Create and return axios instance with proper headers
    return axios.create({
      baseURL: API_BASE_URL,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // Ensure proper format with space after Bearer
      },
      withCredentials: true, // Include cookies if your API uses them
    });
  };

  // Add this function to check and refresh token if needed
  const checkTokenValidity = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Authentication token not found. Please log in again.");
        return false;
      }

      // For debugging purposes - log the token format
      console.log("Token format check:", {
        token: token.substring(0, 10) + "...",
        length: token.length,
        hasBearerPrefix: token.startsWith("Bearer "),
      });

      // If your token starts with "Bearer ", remove it from storage and keep only the token part
      if (token.startsWith("Bearer ")) {
        const actualToken = token.replace("Bearer ", "");
        localStorage.setItem("token", actualToken);
        console.log("Fixed token format in localStorage");
      }

      return true;
    } catch (err) {
      console.error("Token validation error:", err);
      setError("Session expired. Please log in again.");
      return false;
    }
  };

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const axiosInstance = authAxios();
      if (!axiosInstance) {
        setLoading(false);
        return;
      }

      console.log("Fetching books from:", `${API_BASE_URL}/api/admin/books`);
      const response = await axiosInstance.get("/api/admin/books");
      console.log("Books response:", response.data);
      setBooks(response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching books:", err);

      // Log full error details for debugging
      if (err.response) {
        console.error("Error response details:", {
          status: err.response.status,
          statusText: err.response.statusText,
          headers: err.response.headers,
          data: err.response.data,
        });
      }

      // Handle auth errors specifically
      if (err.response && err.response.status === 401) {
        setError("Authentication failed. Please log in again.");
        // Optionally redirect to login page
        // window.location.href = '/login';
      } else if (err.response) {
        console.error(
          "Error response:",
          err.response.status,
          err.response.data
        );
        setError(
          `Failed to load books (${err.response.status}): ${
            err.response.data.message || "Please try again."
          }`
        );
      } else if (err.request) {
        console.error("No response received:", err.request);
        setError(
          "Server not responding. Please check your connection and try again."
        );
      } else {
        setError("Failed to load books: " + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Modify your useEffect to include token validation
  useEffect(() => {
    const validateAndFetch = async () => {
      const isValid = await checkTokenValidity();
      if (isValid) {
        fetchBooks();
      } else {
        // Redirect to login page
        // window.location.href = '/admin/login';
      }
    };

    validateAndFetch();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Handle select change for language dropdown
  const handleSelectChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const resetForm = () => {
    setFormData({
      title: "",
      author: "",
      isbn: "",
      genre: "",
      language: "English",
      publicationYear: "",
      publisher: "",
      description: "",
      price: "",
      imageUrl: "",
      stockQuantity: 1,
    });
    setIsEditing(false);
    setEditBookId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);

      const axiosInstance = authAxios();
      if (!axiosInstance) {
        setSubmitting(false);
        return;
      }

      let response;

      if (isEditing) {
        // Update existing book
        console.log("Updating book data:", formData);
        response = await axiosInstance.put(
          `/api/admin/books/${editBookId}`,
          formData
        );
        console.log("Book updated successfully:", response.data);
        toast({
          title: "Success",
          description: "Book updated successfully!",
          variant: "default",
        });
      } else {
        // Add new book
        console.log("Submitting new book data:", formData);
        response = await axiosInstance.post("/api/admin/books", formData);
        console.log("Book added successfully:", response.data);
        toast({
          title: "Success",
          description: "Book added successfully!",
          variant: "default",
        });
      }

      // Reset form and refresh the book list
      resetForm();
      fetchBooks();
    } catch (err) {
      console.error(`Error ${isEditing ? "updating" : "adding"} book:`, err);

      // Handle auth errors specifically
      if (err.response && err.response.status === 401) {
        toast({
          title: "Authentication Error",
          description: "Your session has expired. Please log in again.",
          variant: "destructive",
        });
      } else if (err.response) {
        console.error(
          "Error response:",
          err.response.status,
          err.response.data
        );
        setError(
          `Failed to ${isEditing ? "update" : "add"} book (${
            err.response.status
          }): ${err.response.data.message || "Please try again."}`
        );
        toast({
          title: "Error",
          description: `Failed to ${isEditing ? "update" : "add"} book. ${
            err.response?.data?.message || "Please try again."
          }`,
          variant: "destructive",
        });
      } else if (err.request) {
        setError(
          "Server not responding. Please check your connection and try again."
        );
        toast({
          title: "Error",
          description: "Server not responding. Please try again later.",
          variant: "destructive",
        });
      } else {
        setError(
          `Failed to ${isEditing ? "update" : "add"} book: ` + err.message
        );
        toast({
          title: "Error",
          description: `Failed to ${
            isEditing ? "update" : "add"
          } book. Please try again.`,
          variant: "destructive",
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (book) => {
    // Set form data with book details
    setFormData({
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      genre: book.genre,
      language: book.language || "English", // Handle books without language field
      publicationYear: book.publicationYear,
      publisher: book.publisher,
      description: book.description,
      price: book.price,
      imageUrl: book.imageUrl,
      stockQuantity: book.stockQuantity,
    });

    // Set editing state
    setIsEditing(true);
    setEditBookId(book._id);

    // Scroll to form
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    resetForm();
  };

  const handleDelete = async (bookId) => {
    if (window.confirm("Are you sure you want to delete this book?")) {
      try {
        setLoading(true);

        const axiosInstance = authAxios();
        if (!axiosInstance) {
          setLoading(false);
          return;
        }

        console.log("Deleting book with ID:", bookId);
        await axiosInstance.delete(`/api/admin/books/${bookId}`);

        console.log("Book deleted successfully");
        fetchBooks();

        toast({
          title: "Success",
          description: "Book deleted successfully!",
          variant: "default",
        });
      } catch (err) {
        console.error("Error deleting book:", err);

        // Handle auth errors specifically
        if (err.response && err.response.status === 401) {
          setError("Authentication failed. Please log in again.");
          toast({
            title: "Authentication Error",
            description: "Your session has expired. Please log in again.",
            variant: "destructive",
          });
          // Optionally redirect to login
          // window.location.href = '/login';
        } else if (err.response) {
          toast({
            title: "Error",
            description: `Failed to delete book (${err.response.status}): ${
              err.response.data.message || "Please try again."
            }`,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to delete book. Please try again.",
            variant: "destructive",
          });
        }
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-8">
      {/* Navigation Button */}
      <div className="mb-4">
        <Button
          variant="outline"
          onClick={handleBackToDashboard}
          className="flex items-center gap-2 hover:bg-gray-50"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>

      <h1 className="text-3xl font-bold tracking-tight">Book Management</h1>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? "Edit Book" : "Add New Book"}</CardTitle>
          <CardDescription>
            {isEditing
              ? "Edit the details of the selected book."
              : "Enter the details of the book you want to add to your inventory."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="author">Author</Label>
                <Input
                  id="author"
                  name="author"
                  value={formData.author}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="isbn">ISBN</Label>
                <Input
                  id="isbn"
                  name="isbn"
                  value={formData.isbn}
                  onChange={handleChange}
                  required
                  disabled={isEditing} // Disable ISBN editing to prevent conflicts
                />
                {isEditing && (
                  <p className="text-xs text-muted-foreground">
                    ISBN cannot be changed after creation.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="genre">Genre</Label>
                <Input
                  id="genre"
                  name="genre"
                  value={formData.genre}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select
                  name="language"
                  value={formData.language}
                  onValueChange={(value) =>
                    handleSelectChange("language", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Language" />
                  </SelectTrigger>
                  <SelectContent>
                    {commonLanguages.map((lang) => (
                      <SelectItem key={lang} value={lang}>
                        {lang}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="publicationYear">Publication Year</Label>
                <Input
                  id="publicationYear"
                  name="publicationYear"
                  type="number"
                  value={formData.publicationYear}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="publisher">Publisher</Label>
                <Input
                  id="publisher"
                  name="publisher"
                  value={formData.publisher}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price (Rs.)</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stockQuantity">Stock Quantity</Label>
                <Input
                  id="stockQuantity"
                  name="stockQuantity"
                  type="number"
                  min="0"
                  value={formData.stockQuantity}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="imageUrl">Image URL</Label>
                <Input
                  id="imageUrl"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                required
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditing ? "Updating Book..." : "Adding Book..."}
                  </>
                ) : isEditing ? (
                  "Update Book"
                ) : (
                  "Add Book"
                )}
              </Button>

              {isEditing && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelEdit}
                >
                  Cancel Edit
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Book Inventory</CardTitle>
          <CardDescription>Manage your current book inventory.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading books...</span>
            </div>
          ) : books.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              No books found in inventory. Add your first book above.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>ISBN</TableHead>
                    <TableHead>Language</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {books.map((book) => (
                    <TableRow key={book._id}>
                      <TableCell className="font-medium">
                        {book.title}
                      </TableCell>
                      <TableCell>{book.author}</TableCell>
                      <TableCell>{book.isbn}</TableCell>
                      <TableCell>{book.language || "English"}</TableCell>
                      <TableCell>
                        Rs.{parseFloat(book.price).toFixed(2)}
                      </TableCell>
                      <TableCell>{book.stockQuantity}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(book)}
                          className="mr-2"
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(book._id)}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BookManagement;
