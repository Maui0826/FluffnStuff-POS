// models/ActionLog.js
import mongoose from 'mongoose';

const actionLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true },
  target: { type: String }, // e.g. "Product", "Inventory", etc.
  description: { type: String, trim: true },
  timestamp: { type: Date, default: Date.now },
});

export default mongoose.model('ActionLog', actionLogSchema);
