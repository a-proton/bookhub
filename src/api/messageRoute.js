// src/api/messageRoute.js
import express from "express";
import Message from "../database/schema/messageSchema.js"; // Adjust path as needed
import { isAdmin, isAuthenticated } from "../middleware/authMiddleware.js";

const router = express.Router();

// --- PUBLIC ROUTES ---

// Submit a new message (contact form)
router.post("/submit", async (req, res) => {
  try {
    const { fullName, email, subject, message } = req.body;

    // Basic validation
    if (!fullName || !email || !message) {
      return res.status(400).json({
        message: "Full name, email, and message are required",
      });
    }

    const newMessage = new Message({
      fullName,
      email,
      subject: subject || "No Subject",
      message,
      isRead: false,
      createdAt: new Date(),
    });

    await newMessage.save();

    res.status(201).json({
      message: "Message sent successfully",
      messageId: newMessage._id,
    });
  } catch (error) {
    console.error("Error submitting message:", error);
    res.status(500).json({ message: "Failed to send message" });
  }
});

// --- ADMIN ROUTES ---

// Get all messages for admin
router.get("/admin/all", isAdmin, async (req, res) => {
  try {
    const messages = await Message.find()
      .sort({ createdAt: -1 }) // Most recent first
      .lean(); // For better performance

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
    });
  }
});

// Mark message as read
router.put("/admin/read/:id", isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const message = await Message.findByIdAndUpdate(
      id,
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

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
    });
  }
});

// Delete a message
router.delete("/admin/delete/:id", isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const message = await Message.findByIdAndDelete(id);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    res.status(200).json({
      success: true,
      message: "Message deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete message",
    });
  }
});

// Get message statistics for admin dashboard
router.get("/admin/stats", isAdmin, async (req, res) => {
  try {
    const totalMessages = await Message.countDocuments();
    const unreadMessages = await Message.countDocuments({ isRead: false });
    const todayMessages = await Message.countDocuments({
      createdAt: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
      },
    });

    res.status(200).json({
      success: true,
      stats: {
        total: totalMessages,
        unread: unreadMessages,
        today: todayMessages,
      },
    });
  } catch (error) {
    console.error("Error fetching message stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch message statistics",
    });
  }
});

export default router;
