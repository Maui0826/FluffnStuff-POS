import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import TransactionService from '../services/transactionService.js';
import TransactionItemService from '../services/transactItemService.js';
import RefundService from '../services/refundService.js';

export const fetchTransactionByIdController = catchAsync(
  async (req, res, next) => {
    const { id } = req.params;
    const transact = await TransactionItemService.findTransactionByID(id);
    if (!transact) return next(new AppError('Transaction not found', 404));
    const transaction = await TransactionService.fetchTransactionId(
      transact.transactionId
    );

    if (!transaction) {
      return next(new AppError('Transaction not found', 404));
    }

    return res.status(200).json({ transaction });
  }
);

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
  const { fromDate, toDate, user, receipt } = req.query;

  const history = await TransactionService.getTransactionHistory({
    fromDate,
    toDate,
    user,
    receipt,
  });

  res.status(200).json({
    status: 'success',
    count: history.length,
    data: history,
  });
});

export const getUserHistory = catchAsync(async (req, res, next) => {
  const { fromDate, toDate, receipt } = req.query;

  const user = req.currentUser;
  if (!user?._id) {
    return res.status(401).json({
      status: 'error',
      message: 'Unauthorized or user not found',
    });
  }

  const history = await TransactionService.getTransactionHistory({
    fromDate,
    toDate,
    userId: user._id, // only return transactions for this cashier
    receipt,
  });

  res.status(200).json({
    status: 'success',
    count: history.length,
    data: history,
  });
});
