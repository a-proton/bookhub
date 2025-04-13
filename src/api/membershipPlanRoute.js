// src/api/membershipPlanRoute.js
import express from "express";
import MembershipPlan from '../database/schema/membershipPlans.js';
import Membership from '../database/schema/membershipSchema.js';
import MembershipApplication from '../database/schema/membershipApplicationSchema.js'; // Add this line
import auth from '../middleware/auth.js';

const router = express.Router();

// Get all active membership plans (public)
router.get('/plans', async (req, res) => {
  try {
    const plans = await MembershipPlan.find({ isActive: true });
    res.json(plans);
  } catch (error) {
    console.error('Error fetching membership plans:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Submit membership application - protected with auth middleware
router.post('/apply', auth.isAuthenticated, async (req, res) => {
  try {
    const { firstName, lastName, email, phone, address, membershipPlan } = req.body;
    
    // Check if req.user exists and has userId property
    if (!req.user || !req.user.userId) {
      console.log('User authentication issue - missing userId:', req.user);
      return res.status(401).json({ message: 'Authentication required or user ID not found' });
    }
    
    // Verify the user ID matches the authenticated user (if userId is provided in request)
    if (req.body.userId && req.user.userId.toString() !== req.body.userId) {
      return res.status(403).json({ message: 'User ID mismatch. Permission denied.' });
    }
    
    // Check if user already has a pending application
    const existingApplication = await MembershipApplication.findOne({
      userId: req.user.userId,
      status: 'pending'
    });
    
    if (existingApplication) {
      return res.status(400).json({ message: 'You already have a pending membership application' });
    }
    
    // Create new application
    const application = new MembershipApplication({
      firstName,
      lastName,
      email,
      phone,
      address,
      membershipPlan,
      userId: req.user.userId,  // Using the userId from req.user
      status: 'pending',
      appliedDate: new Date()
    });
    
    await application.save();
    
    res.status(201).json({
      message: 'Membership application submitted successfully',
      applicationId: application._id
    });
  } catch (error) {
    console.warn('Error submitting membership application:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ADMIN ROUTES

// Get all membership plans (including inactive) - Admin only
router.get('/admin/plans', auth.isAdmin, async (req, res) => {
  try {
    const plans = await MembershipPlan.find().sort({ createdAt: -1 });
    res.json(plans);
  } catch (error) {
    console.error('Error fetching all membership plans:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new membership plan - Admin only
router.post('/admin/plans', auth.isAdmin, async (req, res) => {
  try {
    const { 
      name, 
      description, 
      pricePerMonth, 
      currency, 
      benefits, 
      maxBooksPerMonth, 
      durationDays,
      isActive 
    } = req.body;
    
    // Basic validation
    if (!name || !description || !pricePerMonth || pricePerMonth <= 0) {
      return res.status(400).json({ message: 'Please provide all required fields with valid values' });
    }
    
    // Check if plan name already exists
    const existingPlan = await MembershipPlan.findOne({ name });
    if (existingPlan) {
      return res.status(400).json({ message: 'A plan with this name already exists' });
    }
    
    const newPlan = new MembershipPlan({
      name,
      description,
      pricePerMonth,
      currency: currency || 'Rs',
      benefits: benefits || [],
      maxBooksPerMonth: maxBooksPerMonth || 1,
      durationDays: durationDays || 14,
      isActive: isActive !== undefined ? isActive : true,
    });
    
    await newPlan.save();
    
    res.status(201).json({
      message: 'Membership plan created successfully',
      plan: newPlan
    });
  } catch (error) {
    console.error('Error creating membership plan:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update membership plan - Admin only
router.put('/admin/plans/:id', auth.isAdmin, async (req, res) => {
  try {
    const planId = req.params.id;
    const { 
      name, 
      description, 
      pricePerMonth, 
      currency, 
      benefits, 
      maxBooksPerMonth, 
      durationDays,
      isActive 
    } = req.body;
    
    // Find the plan
    const plan = await MembershipPlan.findById(planId);
    if (!plan) {
      return res.status(404).json({ message: 'Membership plan not found' });
    }
    
    // Check if updated name already exists (skip if name hasn't changed)
    if (name !== plan.name) {
      const existingPlan = await MembershipPlan.findOne({ name });
      if (existingPlan) {
        return res.status(400).json({ message: 'A plan with this name already exists' });
      }
    }
    
    // Update fields
    plan.name = name || plan.name;
    plan.description = description || plan.description;
    plan.pricePerMonth = pricePerMonth !== undefined ? pricePerMonth : plan.pricePerMonth;
    plan.currency = currency || plan.currency;
    plan.benefits = benefits || plan.benefits;
    plan.maxBooksPerMonth = maxBooksPerMonth !== undefined ? maxBooksPerMonth : plan.maxBooksPerMonth;
    plan.durationDays = durationDays !== undefined ? durationDays : plan.durationDays;
    plan.isActive = isActive !== undefined ? isActive : plan.isActive;
    plan.updatedAt = Date.now();
    
    await plan.save();
    
    res.json({
      message: 'Membership plan updated successfully',
      plan
    });
  } catch (error) {
    console.error('Error updating membership plan:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete membership plan - Admin only
router.delete('/admin/plans/:id', auth.isAdmin, async (req, res) => {
  try {
    const planId = req.params.id;
    
    // Check if the plan exists
    const plan = await MembershipPlan.findById(planId);
    if (!plan) {
      return res.status(404).json({ message: 'Membership plan not found' });
    }
    
    // Check if the plan is in use by any active memberships
    const activeMemberships = await Membership.find({ membershipPlan: planId, isActive: true });
    if (activeMemberships.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete plan that is in use by active memberships. Consider deactivating it instead.' 
      });
    }
    
    // Check if the plan is in use by any pending applications
    const pendingApplications = await MembershipApplication.find({ membershipPlan: planId, status: 'pending' });
    if (pendingApplications.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete plan that has pending applications. Process or reject them first.' 
      });
    }
    
    // Safe to delete
    await MembershipPlan.findByIdAndDelete(planId);
    
    res.json({ message: 'Membership plan deleted successfully' });
  } catch (error) {
    console.error('Error deleting membership plan:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get membership applications - Admin only
router.get('/admin/applications', auth.isAdmin, async (req, res) => {
  try {
    const applications = await MembershipApplication.find()
      .populate('membershipPlan', 'name pricePerMonth currency')
      .populate('userId', 'username email')
      .sort({ appliedDate: -1 });
    
    res.json(applications);
  } catch (error) {
    console.error('Error fetching membership applications:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Process membership application (approve/reject) - Admin only
router.put('/admin/applications/:id', auth.isAdmin, async (req, res) => {
  try {
    const applicationId = req.params.id;
    const { status, rejectionReason } = req.body;
    
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }
    
    const application = await MembershipApplication.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    
    if (application.status !== 'pending') {
      return res.status(400).json({ message: `Application is already ${application.status}` });
    }
    
    // Update application status
    application.status = status;
    application.processedDate = new Date();
    
    if (status === 'rejected' && rejectionReason) {
      application.rejectionReason = rejectionReason;
    }
    
    await application.save();
    
    // If approved, create a membership for the user
    if (status === 'approved') {
      // Get the membership plan details
      const plan = await MembershipPlan.findById(application.membershipPlan);
      if (!plan) {
        return res.status(404).json({ message: 'Membership plan not found' });
      }
      
      // Check if user already has an active membership
      const existingMembership = await Membership.findOne({ 
        userId: application.userId,
        isActive: true
      });
      
      if (existingMembership) {
        // Update existing membership
        existingMembership.membershipPlan = plan._id;
        existingMembership.startDate = new Date();
        existingMembership.endDate = new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)); // 30 days
        existingMembership.isActive = true;
        existingMembership.renewalCount += 1;
        existingMembership.booksRentedThisMonth = 0;
        existingMembership.lastResetDate = new Date();
        existingMembership.applicationId = application._id;
        
        await existingMembership.save();
      } else {
        // Create new membership
        const newMembership = new Membership({
          userId: application.userId,
          membershipPlan: plan._id,
          applicationId: application._id,
          startDate: new Date(),
          endDate: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)), // 30 days
          isActive: true
        });
        
        await newMembership.save();
      }
    }
    
    res.json({
      message: `Application ${status} successfully`,
      application
    });
  } catch (error) {
    console.error('Error processing membership application:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;