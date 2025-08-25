import mongoose from 'mongoose';

const transactionItemSchema = new mongoose.Schema(
  {
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    quantity: { type: Number, required: true },
    price: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
      min: [0, 'Price must be positive'],
    },
    totalAmount: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
      min: [0, 'Total must be positive'],
    },

    vatType: {
      type: String,
      enum: ['vatable', 'exempt', 'zero-rated'],
      default: 'vatable',
    },
    vatAmount: { type: mongoose.Schema.Types.Decimal128, default: 0.0 },
    netAmount: { type: mongoose.Schema.Types.Decimal128, default: 0.0 },

    isDeleted: { type: Boolean, default: false },
    isRefunded: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Recompute dependent fields
function recalcAmounts(docOrUpdate, price, quantity, vatType = 'vatable') {
  const qtyNum = Number(quantity);
  const priceNum = Number(price);

  const totalAmount = priceNum * qtyNum;
  let vatAmount = 0;
  let netAmount = totalAmount;

  if (vatType === 'vatable') vatAmount = totalAmount - totalAmount / 1.12;
  else if (vatType === 'exempt' || vatType === 'zero-rated') vatAmount = 0;

  netAmount = totalAmount - vatAmount;

  docOrUpdate.totalAmount = mongoose.Types.Decimal128.fromString(
    totalAmount.toFixed(2)
  );
  docOrUpdate.vatAmount = mongoose.Types.Decimal128.fromString(
    vatAmount.toFixed(2)
  );
  docOrUpdate.netAmount = mongoose.Types.Decimal128.fromString(
    netAmount.toFixed(2)
  );
}

// utils/discount.js
export function computeLineAmounts({
  price,
  quantity,
  vatType,
  discountRatio,
  discountType,
}) {
  const qtyNum = Number(quantity);
  const priceNum = Number(price);
  const lineGross = priceNum * qtyNum;

  // apply discount scaling (ratio = totalNet / totalGross)
  const lineNet = lineGross * discountRatio;

  let vatAmount = 0;
  let finalVatType = vatType || 'vatable';

  if (discountType === 'senior' || discountType === 'pwd') {
    // force VAT exempt
    finalVatType = 'exempt';
    vatAmount = 0;
  } else if (finalVatType === 'vatable') {
    vatAmount = lineNet - lineNet / 1.12;
  }

  return {
    totalAmount: lineGross.toFixed(2), // gross line
    netAmount: lineNet.toFixed(2), // after discount
    vatAmount: vatAmount.toFixed(2),
    vatType: finalVatType,
  };
}

// Pre-save hook
// Pre-save hook with discount logic
transactionItemSchema.pre('save', async function (next) {
  const parentTx = await mongoose
    .model('Transaction')
    .findById(this.transactionId);

  const discountType = parentTx?.discountType || 'none';
  const gross = Number(this.price) * Number(this.quantity);

  // compute ratio (transaction total / gross) only if discount applies
  let discountRatio = 1;
  if (discountType !== 'none' && Number(parentTx.grossAmount) > 0) {
    discountRatio = Number(parentTx.totalAmount) / Number(parentTx.grossAmount);
  }

  const { totalAmount, netAmount, vatAmount, vatType } = computeLineAmounts({
    price: this.price,
    quantity: this.quantity,
    vatType: this.vatType,
    discountRatio,
    discountType,
  });

  this.totalAmount = mongoose.Types.Decimal128.fromString(totalAmount);
  this.netAmount = mongoose.Types.Decimal128.fromString(netAmount);
  this.vatAmount = mongoose.Types.Decimal128.fromString(vatAmount);
  this.vatType = vatType;

  next();
});

// Pre-update hooks
transactionItemSchema.pre(
  ['findOneAndUpdate', 'updateOne'],
  async function (next) {
    const update = this.getUpdate();
    const existingDoc = await this.model
      .findOne(this.getQuery())
      .select('price quantity vatType');

    if (!existingDoc) return next();

    const price = update.price ?? existingDoc.price;
    const quantity = update.quantity ?? existingDoc.quantity;
    const vatType = update.vatType ?? existingDoc.vatType;

    recalcAmounts(update, price, quantity, vatType);
    this.setUpdate(update);
    next();
  }
);

export default mongoose.model('TransactionItem', transactionItemSchema);
