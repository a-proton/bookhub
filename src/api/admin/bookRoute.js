import express from "express"
import Book from "../../database/schema/bookSchema.js"
import auth from "../../middleware/auth.js";
const { isAdmin } = auth;

const router = express.Router()

// Enhanced debugging middleware
router.use((req, res, next) => {
  console.log("Book API Request:", {
    method: req.method,
    path: req.path,
    origin: req.headers.origin,
    headers: {
      authorization: req.headers.authorization
        ? `Bearer ${req.headers.authorization.split(" ")[1].substring(0, 10)}...`
        : "None",
    },
    body: req.method === "GET" ? {} : req.body,
  })
  next()
})

// Verify middleware import
console.log("isAdmin middleware imported:", typeof isAdmin, isAdmin ? "✅" : "❌")

// Get all books
router.get("/", isAdmin, async (req, res) => {
  try {
    console.log("GET /api/admin/books route hit")
    console.log("User from request:", req.user)
    const books = await Book.find().sort({ createdAt: -1 })
    console.log(`Found ${books.length} books`)
    res.json(books)
  } catch (error) {
    console.error("Error fetching books:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Get single book
router.get("/:id", isAdmin, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id)
    if (!book) {
      return res.status(404).json({ message: "Book not found" })
    }
    res.json(book)
  } catch (error) {
    console.error("Error fetching book:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Add new book
router.post("/", isAdmin, async (req, res) => {
  try {
    console.log("POST /api/admin/books route hit")
    console.log("Request body:", req.body)

    const { 
      title, 
      author, 
      isbn, 
      genre, 
      language,
      publicationYear, 
      publisher, 
      description, 
      price, 
      imageUrl, 
      stockQuantity 
    } = req.body

    // Validate required fields
    if (!title || !author || !isbn) {
      return res.status(400).json({ message: "Title, author and ISBN are required fields" })
    }

    // Check if book with ISBN already exists
    const existingBook = await Book.findOne({ isbn })
    if (existingBook) {
      return res.status(400).json({ message: "Book with this ISBN already exists" })
    }

    const newBook = new Book({
      title,
      author,
      isbn,
      genre,
      language: language || 'English',
      publicationYear,
      publisher,
      description,
      price,
      imageUrl,
      stockQuantity,
    })

    await newBook.save()
    console.log("Book saved successfully:", newBook._id)
    res.status(201).json(newBook)
  } catch (error) {
    console.error("Error adding book:", error)
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message })
    }
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Update book
router.put("/:id", isAdmin, async (req, res) => {
  try {
    console.log("PUT /api/admin/books/:id route hit")
    console.log("Request body:", req.body)
    console.log("Book ID:", req.params.id)
    
    const { 
      title, 
      author, 
      isbn, 
      genre, 
      language,
      publicationYear, 
      publisher, 
      description, 
      price, 
      imageUrl, 
      stockQuantity 
    } = req.body

    // Check if book exists
    const book = await Book.findById(req.params.id)
    if (!book) {
      return res.status(404).json({ message: "Book not found" })
    }

    // Check if ISBN is being changed and if it already exists
    if (isbn !== book.isbn) {
      const existingBook = await Book.findOne({ isbn })
      if (existingBook) {
        return res.status(400).json({ message: "Book with this ISBN already exists" })
      }
    }

    const updatedBook = await Book.findByIdAndUpdate(
      req.params.id,
      {
        title,
        author,
        isbn,
        genre,
        language: language || 'English',
        publicationYear,
        publisher,
        description,
        price,
        imageUrl,
        stockQuantity,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true },
    )

    console.log("Book updated successfully:", updatedBook._id)
    res.json(updatedBook)
  } catch (error) {
    console.error("Error updating book:", error)
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message })
    }
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Delete book
router.delete("/:id", isAdmin, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id)
    if (!book) {
      return res.status(404).json({ message: "Book not found" })
    }

    await Book.findByIdAndDelete(req.params.id)
    res.json({ message: "Book deleted successfully" })
  } catch (error) {
    console.error("Error deleting book:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

export default router;