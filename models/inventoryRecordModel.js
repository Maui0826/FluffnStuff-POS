// models/InventoryRecord.js
import mongoose from 'mongoose';

const inventoryRecordSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  inventoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Inventory',
    required: true,
  },
  quantity: { type: Number, required: true },
  acquisitionPrice: { type: mongoose.Schema.Types.Decimal128, default: 0.0 },
  dateRecorded: { type: Date, default: Date.now }, // date of the snapshot
});

export default mongoose.model('InventoryRecord', inventoryRecordSchema);
