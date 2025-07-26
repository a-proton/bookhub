"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext"; // Use your auth context
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
  const { api, currentUser, isAuthenticated, logout } = useAuth();

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

  // Navigation function
  const handleBackToDashboard = () => {
    window.location.href = "/admin/dashboard";
  };

  // Check authentication on component mount
  useEffect(() => {
    if (!isAuthenticated || !currentUser) {
      setError("Please log in to access this page.");
      return;
    }

    if (currentUser.role !== "admin") {
      setError("Admin access required.");
      return;
    }

    fetchBooks();
  }, [isAuthenticated, currentUser]);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("Fetching books...");
      const response = await api.get("/admin/books");

      if (response.data) {
        console.log("Books fetched successfully:", response.data);
        setBooks(Array.isArray(response.data) ? response.data : []);
      } else {
        setBooks([]);
      }
    } catch (err) {
      console.error("Error fetching books:", err);

      if (err.response?.status === 401) {
        setError("Your session has expired. Please log in again.");
        toast({
          title: "Session Expired",
          description: "Please log in again.",
          variant: "destructive",
        });
        setTimeout(() => logout(), 2000);
      } else if (err.response?.status === 403) {
        setError("You don't have permission to access this resource.");
      } else {
        const errorMessage =
          err.response?.data?.message ||
          "Failed to load books. Please try again.";
        setError(errorMessage);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

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

    if (!isAuthenticated || !currentUser) {
      toast({
        title: "Authentication Error",
        description: "Please log in again.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      console.log(`${isEditing ? "Updating" : "Adding"} book:`, formData);

      let response;
      if (isEditing) {
        response = await api.put(`/admin/books/${editBookId}`, formData);
        toast({
          title: "Success",
          description: "Book updated successfully!",
          variant: "default",
        });
      } else {
        response = await api.post("/admin/books", formData);
        toast({
          title: "Success",
          description: "Book added successfully!",
          variant: "default",
        });
      }

      console.log(
        `Book ${isEditing ? "updated" : "added"} successfully:`,
        response.data
      );

      // Reset form and refresh the book list
      resetForm();
      fetchBooks();
    } catch (err) {
      console.error(`Error ${isEditing ? "updating" : "adding"} book:`, err);

      let errorMessage = `Failed to ${isEditing ? "update" : "add"} book.`;

      if (err.response?.status === 401) {
        errorMessage = "Your session has expired. Please log in again.";
        setTimeout(() => logout(), 2000);
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }

      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (book) => {
    setFormData({
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      genre: book.genre,
      language: book.language || "English",
      publicationYear: book.publicationYear,
      publisher: book.publisher,
      description: book.description,
      price: book.price,
      imageUrl: book.imageUrl,
      stockQuantity: book.stockQuantity,
    });

    setIsEditing(true);
    setEditBookId(book._id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    resetForm();
  };

  const handleDelete = async (bookId) => {
    if (!window.confirm("Are you sure you want to delete this book?")) {
      return;
    }

    try {
      setLoading(true);
      console.log("Deleting book with ID:", bookId);

      await api.delete(`/admin/books/${bookId}`);

      console.log("Book deleted successfully");
      toast({
        title: "Success",
        description: "Book deleted successfully!",
        variant: "default",
      });

      fetchBooks();
    } catch (err) {
      console.error("Error deleting book:", err);

      let errorMessage = "Failed to delete book.";

      if (err.response?.status === 401) {
        errorMessage = "Your session has expired. Please log in again.";
        setTimeout(() => logout(), 2000);
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Show loading screen while checking authentication
  if (loading && !books.length) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg font-medium text-muted-foreground">
            Loading book management...
          </p>
        </div>
      </div>
    );
  }

  // Show authentication error
  if (!isAuthenticated || !currentUser) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              Please log in to access the book management system.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => (window.location.href = "/admin/login")}
              className="w-full"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
                  disabled={isEditing}
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
