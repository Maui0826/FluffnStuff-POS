// models/Product.js
import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    imageUrl: { type: String },
    name: { type: String, required: true },
    sku: { type: String, required: true, unique: true },
    categoryId: { type: String, required: true },
    price: { type: mongoose.Schema.Types.Decimal128, required: true }, // selling price
    lowStockThreshold: { type: Number, default: 5 },
    description: { type: String },
    status: { type: String, enum: ['active', 'deleted'], default: 'active' },
  },
  { timestamps: true }
);

export default mongoose.model('Product', productSchema);
