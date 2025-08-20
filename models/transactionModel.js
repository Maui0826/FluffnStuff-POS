import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  receiptNum: { type: String, required: true, unique: true },
  totalQty: { type: Number, required: true }, // ✅ new
  grossAmount: { type: mongoose.Schema.Types.Decimal128, required: true },
  vatableAmount: { type: mongoose.Schema.Types.Decimal128, default: 0.0 },
  vatExemptSales: { type: mongoose.Schema.Types.Decimal128, default: 0.0 },
  vatZeroRatedSales: { type: mongoose.Schema.Types.Decimal128, default: 0.0 },
  vatAmount: { type: mongoose.Schema.Types.Decimal128, default: 0.0 }, // ✅ 12% VAT
  totalAmount: { type: mongoose.Schema.Types.Decimal128, required: true }, // Bill amount
  totalDiscount: { type: mongoose.Schema.Types.Decimal128, default: 0.0 },
  discountType: {
    type: String,
    enum: ['none', 'senior', 'pwd'],
    default: 'none',
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'ewallet', 'bankTransfer'],
    default: 'cash',
  },
  cash: { type: mongoose.Schema.Types.Decimal128, default: 0.0 },
  referenceNumber: { type: String, default: null },
  pwdId: { type: String, default: null },
  seniorId: { type: String, default: null },
  change: { type: mongoose.Schema.Types.Decimal128, default: 0.0 },
  cashier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  isDeleted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Transaction', transactionSchema);
