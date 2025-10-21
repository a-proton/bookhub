// server/src/database/index.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./schema/userSchema.js";
import Book from "./schema/bookSchema.js";
import Rental from "./schema/rentalSchema.js";
import Membership from "./schema/membershipSchema.js";
import MembershipApplication from "./schema/membershipApplicationschema.js";
import Message from "./schema/messageSchema.js";
import MembershipPlan from "./schema/membershipPlans.js";

dotenv.config();

export const connectDB = async () => {
  console.log("Inside connectDB()...");
  try {
    console.log("Attempting to connect to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    console.error("Error details:", error);
    process.exit(1);
  }
};
export default User;
export {
  User,
  Book,
  Rental,
  Membership,
  MembershipPlan,
  MembershipApplication,
  Message,
};

export const models = {
  User,
  Book,
  Rental,
  Membership,
  MembershipPlan,
  MembershipApplication,
  Message,
};
