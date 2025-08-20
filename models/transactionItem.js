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

// Pre-save hook
transactionItemSchema.pre('save', function (next) {
  if (
    this.isModified('price') ||
    this.isModified('quantity') ||
    this.isModified('vatType')
  ) {
    recalcAmounts(this, this.price, this.quantity, this.vatType);
  }
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
