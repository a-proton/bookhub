import mongoose from 'mongoose';

const rentalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true
  },
  startDate: {
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
  rentalPrice: {
    type: Number,
    required: true
  },
  isReturned: {
    type: Boolean,
    default: false
  },
  lateFee: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

const Rental = mongoose.model('Rental', rentalSchema);

export default Rental;