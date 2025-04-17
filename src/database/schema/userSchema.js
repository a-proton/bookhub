import mongoose from "mongoose"

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  age: {
    type: Number,
  },
  gender: {
    type: String,
    enum: ["male", "female", "non-binary", "prefer not to say", "other"],
  },
  location: {
    type: String,
    trim: true,
  },
  preferredLanguages: {
    type: [String],
    default: [],
  },
  favoriteGenres: {
    type: [String],
    default: [],
  },
  preferredBookFormat: {
    type: String,
    enum: ["hardcover", "paperback", "e-book", "audiobook", "any"],
  },
  rentalPreferences: {
    booksPerMonth: {
      type: Number,
      default: 1,
    },
    prefersTrending: {
      type: Boolean,
      default: true,
    },
    openToRecommendations: {
      type: Boolean,
      default: true,
    }
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  
  picture: {
    type: String,
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  hasMembership: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
})

// Update the 'updatedAt' field before saving
userSchema.pre("save", function (next) {
  this.updatedAt = Date.now()
  next()
})

export default mongoose.model("User", userSchema)