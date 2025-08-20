import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import TransactionService from '../services/transactionService.js';
import TransactionItemService from '../services/transactItemService.js';
import RefundService from '../services/refundService.js';

export const getAllTransaction = catchAsync(async (req, res, next) => {
  const { date, search, user } = req.query;

  const transactions = await TransactionService.getFilteredTransactions({
    date,
    search,
    user,
  });

  if (!transactions.length) {
    return next(new AppError('No transactions found', 404));
  }

  res.status(200).json({
    status: 'success',
    count: transactions.length,
    data: transactions,
  });
});

export const deleteTransaction = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  if (!id) {
    return next(new AppError('Transaction ID is required', 400));
  }

  // 1. Soft-delete the transaction
  const transaction = await TransactionService.deleteTransaction(id);
  if (!transaction || transaction.length === 0) {
    return next(new AppError('Transaction not found or already deleted.', 404));
  }

  // 2. Soft-delete related TransactItems
  const transactItems = await TransactionItemService.deleteTransactionItem(
    transaction.receiptNum
  );

  if (!transactItems || transactItems.length === 0) {
    return next(
      new AppError('Transact items not found or failed to delete.', 404)
    );
  }
  const itemIds = transactItems.map(item => item.transactionId);

  // 3. Soft-delete related Refunds
  const refunds = await RefundService.deleteRefund(itemIds);
  if (!refunds || refunds.length === 0)
    return next(new AppError('Refunds failed to delete', 404));

  // 4. Respond
  res.status(200).json({
    status: 'success',
    message: 'Transaction and related records soft deleted successfully.',
    data: {
      transactionId: transaction._id,
      itemsDeleted: itemIds.length,
    },
  });
});

export const getTransactionHistory = catchAsync(async (req, res, next) => {
  const { date, user } = req.query;

  const history = await TransactionService.getTransactionHistory({
    date,
    user,
  });

  res.status(200).json({
    status: 'success',
    count: history.length,
    data: history,
  });
});

export const getUserHistory = catchAsync(async (req, res, next) => {
  const { date } = req.query;

  const user = req.currentUser;
  const userId = user?._id; // extract only the ID

  const history = await TransactionService.getTransactionHistory({
    date,
    userId, // pass userId instead of the whole object
  });

  res.status(200).json({
    status: 'success',
    count: history.length,
    data: history,
  });
});
