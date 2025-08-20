import Transaction from '../models/transactionModel.js';

export const generateReceiptNum = async () => {
  const today = new Date();
  const datePart = today.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD

  // Count today's transactions
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const endOfDay = new Date(today.setHours(23, 59, 59, 999));

  const count = await Transaction.countDocuments({
    createdAt: { $gte: startOfDay, $lte: endOfDay },
  });

  const sequence = String(count + 1).padStart(6, '0'); // e.g., 000001
  return `RCPT-${datePart}-${sequence}`;
};
