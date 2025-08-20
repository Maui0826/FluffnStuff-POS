// models/Inventory.js
import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  quantity: { type: Number, required: true, default: 0 },
  updatedAt: { type: Date, default: Date.now },
  acquisitionPrice: {
    type: mongoose.Schema.Types.Decimal128,
    default: 0.0,
  },
  status: { type: String, enum: ['active', 'deleted'], default: 'active' },
});

export default mongoose.model('Inventory', inventorySchema);
