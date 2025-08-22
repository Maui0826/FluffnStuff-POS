// models/Order.js
import mongoose from 'mongoose';

const stockSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  supplierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  supplierName: { type: String, required: true },
  orderQuantity: { type: Number, required: true },
  deliveredQuantity: { type: Number, default: 0 },
  deliveryDate: { type: Date, required: true },
  deliveredDate: { type: Date },
  acquisitionPrice: {
    type: mongoose.Schema.Types.Decimal128,
    required: true,
    default: 0.0,
  },
  status: {
    type: String,
    enum: ['pending', 'delivered', 'cancelled'],
    default: 'pending',
  },
  isDeleted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Stock', stockSchema);
