import express from 'express';
const router = express.Router();
import { models } from '../database/index.js';

// Get all messages (admin only)
router.get('/admin/messages', async (req, res) => {
  try {
    const messages = await models.Message.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ success: false, message: 'Error fetching messages' });
  }
});

// Mark message as read
router.put('/admin/messages/:id', async (req, res) => {
  try {
    const message = await models.Message.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
    
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }
    
    res.status(200).json({ success: true, message });
  } catch (error) {
    console.error('Error updating message:', error);
    res.status(500).json({ success: false, message: 'Error updating message' });
  }
});

// Delete message
router.delete('/admin/messages/:id', async (req, res) => {
  try {
    const message = await models.Message.findByIdAndDelete(req.params.id);
    
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }
    
    res.status(200).json({ success: true, message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ success: false, message: 'Error deleting message' });
  }
});

// Submit a new message (public route)
router.post('/contact', async (req, res) => {
  try {
    const { fullName, email, subject, message } = req.body;
    
    const newMessage = new models.Message({
      fullName,
      email,
      subject,
      message
    });
    
    await newMessage.save();
    
    res.status(201).json({ success: true, message: 'Message sent successfully' });
  } catch (error) {
    console.error('Error submitting message:', error);
    res.status(500).json({ success: false, message: 'Error sending message' });
  }
});

export default router;