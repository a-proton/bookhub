import mongoose from 'mongoose';
const { Schema } = mongoose;

const rentalSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  book: {
    type: Schema.Types.ObjectId,
    ref: 'Book',
    required: true
  },
  issueDate: {
    type: Date,
    default: Date.now,
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  returnDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['active', 'returned', 'overdue'],
    default: 'active'
  },
  fineAmount: {
    type: Number,
    default: 0
  },
  finePaid: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Add index for easier queries
rentalSchema.index({ user: 1, status: 1 });
rentalSchema.index({ book: 1, status: 1 });

const Rental = mongoose.model('Rental', rentalSchema);

// Export the model using ES Modules syntax
export default Rental;
