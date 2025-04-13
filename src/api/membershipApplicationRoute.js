// src/api/membershipApplicationRoute.js
import express from 'express';
import jwt from 'jsonwebtoken';
import { models } from '../database/index.js';

const router = express.Router();

// Auth middleware for protected routes
const authMiddleware = (req, res, next) => {
  // Get token from header
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  // Check if no token
  if (!token) {
    return res.status(401).json({ message: 'No authentication token found' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
    
    // Add user from payload
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Token verification error:', err.message);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Admin-only middleware
const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized as admin' });
  }
  next();
};

// Get all applications (admin only)
router.get('/admin/applications', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const applications = await models.MembershipApplication.find()
      .populate('membershipPlan', 'name price duration')
      .populate('userId', 'email name')
      .sort({ appliedDate: -1 });
    
    res.status(200).json(applications);
  } catch (error) {
    console.error('Error fetching membership applications:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get application by ID (admin or owner)
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const application = await models.MembershipApplication.findById(req.params.id)
      .populate('membershipPlan', 'name price duration')
      .populate('userId', 'email name');
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    
    // Check if the user is the owner or an admin
    if (application.userId.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view this application' });
    }
    
    res.status(200).json(application);
  } catch (error) {
    console.error('Error fetching application:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new application
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { firstName, lastName, email, phone, address, membershipPlan } = req.body;
    
    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !address || !membershipPlan) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    // Check if user already has a pending application
    const existingApplication = await models.MembershipApplication.findOne({
      userId: req.user.userId,
      status: 'pending'
    });
    
    if (existingApplication) {
      return res.status(400).json({ 
        message: 'You already have a pending application',
        applicationId: existingApplication._id
      });
    }
    
    const newApplication = new models.MembershipApplication({
      firstName,
      lastName,
      email,
      phone,
      address,
      membershipPlan,
      userId: req.user.userId,
      appliedDate: Date.now(),
      status: 'pending'
    });
    
    await newApplication.save();
    
    res.status(201).json({ 
      message: 'Application submitted successfully',
      application: newApplication
    });
  } catch (error) {
    console.error('Error creating application:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update application status (admin only)
router.put('/admin/applications/:id/:action', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id, action } = req.params;
    const { notes } = req.body;
    
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action' });
    }
    
    const application = await models.MembershipApplication.findById(id);
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    
    application.status = action === 'approve' ? 'approved' : 'rejected';
    application.reviewDate = Date.now();
    application.reviewedBy = req.user.userId;
    
    if (notes) {
      application.notes = notes;
    }
    
    await application.save();
    
    // If approved, create a membership record for the user
    if (action === 'approve') {
      // Find the user
      const user = await models.User.findById(application.userId);
      if (user) {
        // Update user membership status
        user.hasMembership = true;
        user.membershipPlan = application.membershipPlan;
        user.membershipStartDate = new Date();
        
        // Calculate end date based on plan duration
        const membershipPlan = await models.MembershipPlan.findById(application.membershipPlan);
        if (membershipPlan) {
          const durationInMonths = membershipPlan.duration || 1;
          const endDate = new Date();
          endDate.setMonth(endDate.getMonth() + durationInMonths);
          user.membershipEndDate = endDate;
        }
        
        await user.save();
      }
    }
    
    res.status(200).json({ 
      message: `Application ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      application
    });
  } catch (error) {
    console.error(`Error ${req.params.action}ing application:`, error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user's own applications
router.get('/user/my-applications', authMiddleware, async (req, res) => {
  try {
    const applications = await models.MembershipApplication.find({ userId: req.user.userId })
      .populate('membershipPlan', 'name price duration')
      .sort({ appliedDate: -1 });
    
    res.status(200).json(applications);
  } catch (error) {
    console.error('Error fetching user applications:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;