// models/StockAdjustment.js
import mongoose from 'mongoose';

const stockAdjustmentSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  previousQuantity: { type: Number, required: true },
  adjustedQuantity: { type: Number, required: true },
  change: { type: mongoose.Schema.Types.Decimal128, required: true }, // e.g. +5, -3
  reason: {
    type: String,
    enum: ['restocked', 'damaged', 'expired', 'correction', 'shrinkage'],
    required: true,
  },
  note: { type: String }, // optional remarks
  adjustedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('StockAdjustment', stockAdjustmentSchema);
