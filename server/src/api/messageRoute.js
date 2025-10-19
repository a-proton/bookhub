// src/api/messageRoute.js
import express from "express";
import Message from "../database/schema/messageSchema.js"; // Adjust path as needed
import { isAdmin, isAuthenticated } from "../middleware/authMiddleware.js";

const router = express.Router();

// --- PUBLIC ROUTES ---

// Submit a new message (contact form)
router.post("/submit", async (req, res) => {
  try {
    console.log("Received message submission:", req.body);

    const { fullName, email, subject, message, phone } = req.body;

    // Basic validation
    if (!fullName || !email || !message) {
      return res.status(400).json({
        success: false,
        message: "Full name, email, and message are required",
      });
    }

    const newMessage = new Message({
      fullName,
      email,
      phone: phone || null,
      subject: subject || "No Subject",
      message,
      isRead: false,
      createdAt: new Date(),
    });

    await newMessage.save();
    console.log("Message saved successfully:", newMessage._id);

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      messageId: newMessage._id,
    });
  } catch (error) {
    console.error("Error submitting message:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send message",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// --- ADMIN ROUTES ---

// Get all messages for admin
router.get("/admin/all", isAdmin, async (req, res) => {
  try {
    console.log("Admin requesting all messages");

    const messages = await Message.find()
      .sort({ createdAt: -1 }) // Most recent first
      .lean(); // For better performance

    console.log(`Found ${messages.length} messages`);

    res.status(200).json({
      success: true,
      messages,
      count: messages.length,
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch messages",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Mark message as read
router.put("/admin/read/:id", isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Marking message as read:", id);

    const message = await Message.findByIdAndUpdate(
      id,
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    console.log("Message marked as read successfully");

    res.status(200).json({
      success: true,
      message: "Message marked as read",
      data: message,
    });
  } catch (error) {
    console.error("Error marking message as read:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark message as read",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Delete a message
router.delete("/admin/delete/:id", isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Deleting message:", id);

    const message = await Message.findByIdAndDelete(id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    console.log("Message deleted successfully");

    res.status(200).json({
      success: true,
      message: "Message deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete message",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Get message statistics for admin dashboard
router.get("/admin/stats", isAdmin, async (req, res) => {
  try {
    console.log("Admin requesting message stats");

    const totalMessages = await Message.countDocuments();
    const unreadMessages = await Message.countDocuments({ isRead: false });
    const todayMessages = await Message.countDocuments({
      createdAt: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
      },
    });

    const stats = {
      total: totalMessages,
      unread: unreadMessages,
      today: todayMessages,
    };

    console.log("Message stats:", stats);

    res.status(200).json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("Error fetching message stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch message statistics",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

export default router;
