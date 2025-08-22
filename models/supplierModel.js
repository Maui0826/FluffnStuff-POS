// models/supplierModel.js
import mongoose from 'mongoose';

const supplierSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    supplierName: { type: String, required: true },
    status: { type: String, enum: ['active', 'deleted'], default: 'active' },
  },
  { timestamps: true }
);

export default mongoose.model('Supplier', supplierSchema);
