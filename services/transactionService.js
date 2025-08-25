import mongoose from 'mongoose';
import Transaction from '../models/transactionModel.js';
import TransactionItem from '../models/transactionItem.js';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import Inventory from '../models/inventoryModel.js';

dayjs.extend(utc);
dayjs.extend(timezone);

const getFilteredTransactions = async ({ date, search, user }) => {
  const filter = { isDeleted: false };

  if (date) {
    const selectedDate = new Date(date);
    const startOfDay = new Date(selectedDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(selectedDate.setHours(23, 59, 59, 999));
    filter.createdAt = { $gte: startOfDay, $lte: endOfDay };
  }

  if (search) {
    filter.receiptNum = { $regex: search, $options: 'i' };
  }

  if (user) {
    filter.cashier = user;
  }

  return await Transaction.find(filter).sort({ createdAt: -1 });
};

const deleteTransaction = async id => {
  return await Transaction.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { isDeleted: true },
    { new: true }
  );
};

// Convert number to Decimal128
const toD128 = n =>
  mongoose.Types.Decimal128.fromString(Number(n || 0).toFixed(2));

// Calculate totals
function calculateTotals(items, cash = 0, discountType = 'none') {
  const grossAmount = items.reduce(
    (sum, item) =>
      sum + (Number(item.price) || 0) * (Number(item.quantity) || 0),
    0
  );

  let totalDiscount = 0;
  let totalAmount = grossAmount;
  let vatableAmount = 0;
  let vatExemptSales = 0;
  let vatZeroRatedSales = 0;
  let vatAmount = 0;

  // --- Apply discounts ---
  if (discountType === 'senior' || discountType === 'pwd') {
    // Senior/PWD: 20% discount, VAT-exempt
    totalDiscount = grossAmount * 0.2;
    totalAmount = grossAmount - totalDiscount;

    vatExemptSales = totalAmount; // all goes to exempt
    vatableAmount = 0;
    vatAmount = 0;
  } else {
    // Normal transaction: compute VAT
    vatableAmount = grossAmount / 1.12;
    vatAmount = grossAmount - vatableAmount;
    totalAmount = grossAmount; // no discount
    vatExemptSales = 0;
  }

  const totalQty = items.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );

  const change = Math.max((Number(cash) || 0) - totalAmount, 0);

  return {
    totalQty,
    grossAmount: round2(grossAmount),
    vatableAmount: round2(vatableAmount),
    vatExemptSales: round2(vatExemptSales),
    vatZeroRatedSales: round2(vatZeroRatedSales),
    vatAmount: round2(vatAmount),
    totalDiscount: round2(totalDiscount),
    totalAmount: round2(totalAmount),
    change: round2(change),
  };
}

function round2(num) {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

const createTransaction = async ({
  items,
  cash,
  discountType,
  cashier,
  paymentMethod,
  referenceNumber,
  seniorId,
  pwdId,
}) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1) compute totals (gross, discount, net, vat, change, etc.)
    const totals = calculateTotals(items, cash, discountType);

    // 2) create transaction document
    const transactionData = {
      receiptNum: `FNS-${Date.now()}`,
      totalQty: totals.totalQty,
      grossAmount: toD128(totals.grossAmount),
      vatableAmount: toD128(totals.vatableAmount),
      vatExemptSales: toD128(totals.vatExemptSales),
      vatZeroRatedSales: toD128(totals.vatZeroRatedSales),
      vatAmount: toD128(totals.vatAmount),
      totalDiscount: toD128(totals.totalDiscount),
      totalAmount: toD128(totals.totalAmount),
      cash: toD128(cash),
      change: toD128(totals.change),
      discountType: discountType || 'none',
      paymentMethod,
      referenceNumber: pmNeedsRef(paymentMethod) ? referenceNumber : null,
      seniorId: discountType === 'senior' ? seniorId || null : null,
      pwdId: discountType === 'pwd' ? pwdId || null : null,
      cashier,
    };

    const [transaction] = await Transaction.create([transactionData], {
      session,
    });

    // 3) create transaction items
    const txItems = [];
    let discountRatio = 1;
    if (totals.grossAmount > 0) {
      discountRatio = totals.totalAmount / totals.grossAmount; // scale factor
    }

    for (const item of items) {
      const price = Number(item.price) || 0;
      const qty = Number(item.quantity) || 0;
      const lineTotal = price * qty;

      // --- gross per item ---
      const grossLine = lineTotal;

      // --- apply discount if any ---
      const discountedLine =
        discountType && discountType !== 'none'
          ? grossLine * discountRatio
          : grossLine;

      let vatType = String(item.vatType || 'vatable').toLowerCase();
      let vatAmount = 0;
      // If senior or pwd -> force exempt (VAT 0)
      if (discountType === 'senior' || discountType === 'pwd') {
        vatType = 'exempt';
        vatAmount = 0;
      } else if (vatType === 'vatable') {
        vatAmount = discountedLine - discountedLine / 1.12;
      }
      txItems.push({
        transactionId: transaction._id,
        productId: item._id || item.productId,
        quantity: qty,
        price: toD128(price),
        totalAmount: toD128(grossLine), // original line amount
        vatType,
        vatAmount: toD128(vatAmount),
        netAmount: toD128(discountedLine), // discounted (net) line amount
      });

      // --- Update inventory quantity ---
      await Inventory.findOneAndUpdate(
        { productId: item._id || item.productId, status: 'active' },
        { $inc: { quantity: -qty }, updatedAt: Date.now() },
        { session, new: true }
      );
    }

    await TransactionItem.insertMany(txItems, { session });

    await session.commitTransaction();
    session.endSession();

    return transaction;
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error creating transaction:', err);
    throw err;
  }
};

// Helper to check if payment method needs reference
const pmNeedsRef = pm => pm === 'ewallet' || pm === 'bankTransfer';

const getTransactionById = async id => {
  return await Transaction.findById(id).populate('cashier');
};

const getAllTransactions = async (filter = {}) => {
  return await Transaction.find(filter).populate('cashier');
};

const refundUpdate = async transactionId => {
  // Fetch all non-deleted transaction items
  const items = await TransactionItem.find({
    transactionId,
    isDeleted: false,
  }).lean();

  if (!items || items.length === 0) {
    throw new Error('No transaction items found');
  }

  // Fetch the parent transaction
  const transaction = await Transaction.findById(transactionId).lean();
  if (!transaction) throw new Error('Transaction not found');

  // Compute totals
  const totals = calculateTotals(
    items,
    parseFloat(transaction.cash || 0),
    transaction.discountType || 'none'
  );

  // Update transaction with recomputed totals
  const updatedTransaction = await Transaction.findOneAndUpdate(
    { _id: transactionId, isDeleted: false },
    {
      totalQty: totals.totalQty,
      grossAmount: mongoose.Types.Decimal128.fromString(
        totals.grossAmount.toFixed(2)
      ),
      vatableAmount: mongoose.Types.Decimal128.fromString(
        totals.vatableAmount.toFixed(2)
      ),
      vatExemptSales: mongoose.Types.Decimal128.fromString(
        totals.vatExemptSales.toFixed(2)
      ),
      vatZeroRatedSales: mongoose.Types.Decimal128.fromString(
        totals.vatZeroRatedSales.toFixed(2)
      ),
      vatAmount: mongoose.Types.Decimal128.fromString(
        totals.vatAmount.toFixed(2)
      ),
      totalDiscount: mongoose.Types.Decimal128.fromString(
        totals.totalDiscount.toFixed(2)
      ),
      totalAmount: mongoose.Types.Decimal128.fromString(
        totals.totalAmount.toFixed(2)
      ),
      change: mongoose.Types.Decimal128.fromString(totals.change.toFixed(2)),
    },
    { new: true }
  );

  return updatedTransaction;
};

// Weekly Sale Service
const weeklySale = async () => {
  const today = dayjs();
  const startOfWeek = today.startOf('week').add(1, 'day'); // Monday
  const endOfToday = today.endOf('day');

  const transactions = await Transaction.find({
    createdAt: { $gte: startOfWeek.toDate(), $lte: endOfToday.toDate() },
    isDeleted: false,
  });

  const days = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ];

  const totalSales = days.reduce((acc, day) => {
    acc[day] = 0;
    return acc;
  }, {});

  transactions.forEach(tx => {
    const dayName = dayjs(tx.createdAt).format('dddd').toLowerCase();
    if (days.includes(dayName)) {
      totalSales[dayName] += parseFloat(tx.totalAmount.toString());
    }
  });

  // Zero out future days
  const todayName = today.format('dddd').toLowerCase();
  const todayIndex = days.indexOf(todayName);
  for (let i = todayIndex + 1; i < days.length; i++) {
    totalSales[days[i]] = 0;
  }

  return { weekly: totalSales };
};

const getRecentTransaction = async () => {
  const recent = await Transaction.aggregate([
    { $match: { isDeleted: false } },
    { $sort: { createdAt: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: 'users', // MongoDB collection name
        localField: 'cashier', // ObjectId ref
        foreignField: '_id',
        as: 'cashier',
      },
    },
    { $unwind: '$cashier' },
    {
      $project: {
        _id: 0,
        cashierName: {
          $concat: [
            '$cashier.name.firstName',
            ' ',
            { $ifNull: ['$cashier.name.middleName', ''] },
            { $cond: [{ $eq: ['$cashier.name.middleName', null] }, '', ' '] },
            '$cashier.name.lastName',
          ],
        },
        itemQtySold: '$totalQty',
        totalAmount: 1,
      },
    },
  ]);

  return recent;
};

const getTransactById = async id => {
  return await Transaction.findOne({ receiptNum: id, isDeleted: false });
};

// Fetch transaction history with filters
const getTransactionHistory = async (filters = {}) => {
  const query = { isDeleted: false };

  // Filter by date range
  if (filters.fromDate || filters.toDate) {
    const start = filters.fromDate
      ? new Date(filters.fromDate)
      : new Date('1970-01-01');
    start.setHours(0, 0, 0, 0);

    const end = filters.toDate ? new Date(filters.toDate) : new Date();
    end.setHours(23, 59, 59, 999);

    query.createdAt = { $gte: start, $lte: end };
  }
  // Filter by userId (for cashier endpoint)
  if (filters.userId) {
    query.cashier = filters.userId;
  }

  // Fetch transactions with populated cashier
  let transactions = await Transaction.find(query)
    .sort({ createdAt: -1 })
    .populate('cashier', 'name')
    .lean();

  // Filter by user name if provided
  if (filters.user) {
    const search = filters.user.toLowerCase();
    transactions = transactions.filter(tx => {
      const fullName = `${tx.cashier.name.firstName} ${
        tx.cashier.name.middleName ?? ''
      } ${tx.cashier.name.lastName}`.toLowerCase();
      return fullName.includes(search);
    });
  }

  if (filters.receipt) {
    const search = filters.receipt.toString().toLowerCase();
    transactions = transactions.filter(tx =>
      tx.receiptNum.toString().toLowerCase().includes(search)
    );
  }

  // Fetch transaction items and product info
  const result = [];
  for (const tx of transactions) {
    const items = await TransactionItem.find({
      transactionId: tx._id,
      isDeleted: false,
    })
      .populate('productId', 'name price')
      .lean();

    items.forEach(item => {
      result.push({
        _id: item._id,
        receiptNum: tx.receiptNum, // ✅ include receipt number
        dateTime: tx.createdAt,
        product: item.productId.name,
        price: parseFloat(item.netAmount.toString()),
        quantity: item.quantity,
        addedBy: `${tx.cashier.name.firstName} ${
          tx.cashier.name.middleName ? tx.cashier.name.middleName + ' ' : ''
        }${tx.cashier.name.lastName}`,
      });
    });
  }

  return result;
};

const fetchTransactionId = async transactionId => {
  // Fetch transaction
  const transaction = await Transaction.findById(transactionId).lean();
  if (!transaction) return null;

  // Fetch transaction items
  const items = await TransactionItem.find({ transactionId })
    .populate('productId', 'name') // populate product name
    .lean();

  // Map items to include productName and formatted amounts
  const formattedItems = items.map(item => ({
    productName: item.productId.name,
    quantity: item.quantity,
    price: parseFloat(item.price.toString()),
    totalAmount: parseFloat(item.totalAmount.toString()),
    vatType: item.vatType,
    vatAmount: parseFloat(item.vatAmount.toString()),
    netAmount: parseFloat(item.netAmount.toString()),
  }));

  return {
    ...transaction,
    items: formattedItems,
  };
};

export default {
  deleteTransaction,
  getFilteredTransactions,
  createTransaction,
  getTransactionById,
  fetchTransactionId,
  refundUpdate,
  weeklySale,
  calculateTotals,
  getRecentTransaction,
  getAllTransactions,
  getTransactById,
  getTransactionHistory,
};
