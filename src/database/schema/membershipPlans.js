// database/schema/membershipPlans.js
import mongoose from 'mongoose';

const membershipPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  pricePerMonth: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'Rs'
  },
  benefits: [{
    type: String,
    trim: true
  }],
  maxBooksPerMonth: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  durationDays: {
    type: Number,
    required: true,
    min: 1,
    default: 14
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const MembershipPlan = mongoose.model('MembershipPlan', membershipPlanSchema);

export default MembershipPlan;