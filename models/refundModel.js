import mongoose from 'mongoose';

const refundSchema = new mongoose.Schema({
  transactionItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TransactionItem',
    required: true,
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Refund quantity must be at least 1'],
  },
  refundPrice: {
    type: mongoose.Schema.Types.Decimal128,
    required: true,
  },
  refundedAt: {
    type: Date,
    default: Date.now,
  },
  reason: {
    type: String,
    enum: [
      'damaged',
      'wrong item',
      'shrinkage',
      'customer request',
      'expired',
      'overcharge',
    ],
    default: 'customer request',
  },
  note: {
    type: String,
    default: '',
    trim: true,
  },
  isDeleted: { type: Boolean, default: false },
  isDiscounted: { type: Boolean, default: false },
});

export default mongoose.model('Refund', refundSchema);
