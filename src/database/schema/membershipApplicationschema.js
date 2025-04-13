// models/MembershipApplication.js
import mongoose from 'mongoose';

const membershipApplicationSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  membershipPlan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MembershipPlan',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  appliedDate: {
    type: Date,
    default: Date.now
  },
  reviewDate: {
    type: Date
  },
  reviewedBy: {
    type: String, // ✅ new if you're just storing "admin"
  },
  
  notes: {
    type: String
  }
});

const MembershipApplication = mongoose.models.MembershipApplication || mongoose.model('MembershipApplication', membershipApplicationSchema);
export default MembershipApplication;
