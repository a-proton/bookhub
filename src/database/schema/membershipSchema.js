// models/Membership.js
import mongoose from 'mongoose';

const membershipSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  membershipPlan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MembershipPlan',
    required: true
  },
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MembershipApplication'
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  renewalCount: {
    type: Number,
    default: 0
  },
  booksRentedThisMonth: {
    type: Number,
    default: 0
  },
  lastResetDate: {
    type: Date,
    default: Date.now
  },
  paymentHistory: [{
    date: Date,
    amount: Number,
    transactionId: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the 'updatedAt' field before saving
membershipSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to check if membership is expired
membershipSchema.methods.isExpired = function() {
  return new Date() > this.endDate;
};

// Method to reset monthly book counter
membershipSchema.methods.resetMonthlyBookCount = function() {
  const currentDate = new Date();
  const lastResetDate = new Date(this.lastResetDate);
  
  // Check if it's been a month since the last reset
  if (currentDate.getMonth() !== lastResetDate.getMonth() || 
      currentDate.getFullYear() !== lastResetDate.getFullYear()) {
    this.booksRentedThisMonth = 0;
    this.lastResetDate = currentDate;
    return true;
  }
  return false;
};

const Membership = mongoose.model('Membership', membershipSchema);

export default Membership;