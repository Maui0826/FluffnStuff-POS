import TransactionItem from '../models/transactionItem.js';
import inventoryModel from '../models/inventoryModel.js';
import mongoose from 'mongoose';

const deleteTransactionItem = async id => {
  const transaction = await TransactionItem.updateMany(
    { transactionId: id, isDeleted: false },
    { isDeleted: true }
  );

  return transaction;
};

const createTransItem = async ({ transactId, products, paymentMethod }) => {
  try {
    // Save the transaction items
    const transItems = await TransactionItem.insertMany(
      products.map(p => ({
        transactId,
        productId: p.productId,
        quantity: p.quantity,
        price: p.price,
        paymentMethod,
      }))
    );

    // Deduct from product stock
    for (const p of products) {
      await Product.findByIdAndUpdate(
        p.productId,
        { $inc: { quantity: -p.quantity } },
        { new: true }
      );
    }

    return transItems;
  } catch (error) {
    console.error('Error creating transaction items:', error);
    return 0;
  }
};

const getItemsByTransaction = async transactId => {
  try {
    const items = await TransactionItem.find({ transactId }).populate(
      'products.productId'
    );
    return items;
  } catch (err) {
    console.error('Error fetching transaction items:', err);
    return [];
  }
};

const refundItem = async data => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Find transaction item
    const transItem = await TransactionItem.findOne({
      transactionId: data.transactionId,
      productId: data.productId,
      isDeleted: false,
      isRefunded: false,
    }).session(session);

    if (!transItem)
      throw new Error('Transaction item not found or already refunded');

    // 2. Validate refund quantity
    if (data.quantity > transItem.quantity) {
      throw new Error('Refund quantity exceeds purchased quantity');
    }

    // 3. Update transaction item quantity
    transItem.quantity -= data.quantity;
    if (transItem.quantity === 0) transItem.isRefunded = true;

    // Save will trigger pre-save to recalc totalAmount, vatAmount, netAmount
    await transItem.save({ session });

    // 4. Update inventory
    await inventoryModel.findOneAndUpdate(
      { productId: data.productId, isDeleted: false },
      { $inc: { quantity: data.quantity } },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return transItem;
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};
export default {
  deleteTransactionItem,
  createTransItem,
  getItemsByTransaction,
  refundItem,
};
