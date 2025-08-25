import TransactItem from '../services/transactItemService.js';
import TransactionService from '../services/transactionService.js';
import ProductService from '../services/productService.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import RefundService from '../services/refundService.js';
import LogService from '../services/actionLogService.js';

export const refundProduct = catchAsync(async (req, res, next) => {
  const { receiptNum, sku, quantity, reason, note } = req.body;

  if (!receiptNum || !sku || !reason || !quantity) {
    return next(new AppError('Invalid empty fields', 400));
  }

  // 1. Get parent transaction
  const transact = await TransactionService.getTransactById(receiptNum);
  if (!transact)
    return next(new AppError('Transaction receipt not found!', 404));

  // 2. Get product
  const prod = await ProductService.getProductBySKU(sku);
  if (!prod) return next(new AppError('Product not found.', 404));

  // 3. Refund transaction item
  const transItemData = {
    transactionId: transact._id,
    productId: prod._id,
    quantity: Number(quantity),
  };
  const transItem = await TransactItem.refundItem(transItemData, reason);

  if (!transItem)
    return next(new AppError('Transaction item refund failed.', 404));
  const unitNet =
    Number(transItem.netAmount.toString()) / Number(transItem.quantity);
  // 4. Create refund record
  const refundData = {
    transactionItemId: transItem._id,
    productId: prod._id,
    quantity: Number(quantity),
    refundPrice: unitNet * Number(quantity),
    reason,
    note,
    isDiscounted: transact.discountType !== 'none',
  };
  const refund = await RefundService.createRefund(refundData);
  if (!refund) return next(new AppError('Refund process failed.', 404));

  // 5. Recompute parent transaction totals
  const updatedTransaction = await TransactionService.refundUpdate(
    transact._id
  );
  if (!updatedTransaction)
    return next(new AppError('Transaction update failed.', 404));

  // --- 6. Create Action Log for refund ---
  const description = `Refund processed. Product: ${
    prod.name
  }, Quantity: ${quantity}, Reason: ${reason}${note ? ', Note: ' + note : ''}`;

  await LogService.createActionLog({
    user: req.currentUser._id,
    action: 'Refund Product',
    target: 'Transaction',
    description,
  });

  res.status(200).json({
    status: 'success',
    data: {
      totalRefundedPrice: refund.refundPrice,
      refundedItem: {
        _id: transItem._id,
        productId: prod._id,
        sku,
        name: prod.name,
        quantity: transItem.quantity,
        price: transItem.price,
        totalAmount: transItem.totalAmount,
        vatAmount: transItem.vatAmount,
        netAmount: transItem.netAmount,
        isRefunded: transItem.isRefunded,
      },
      updatedTransaction: {
        _id: updatedTransaction._id,
        totalQty: updatedTransaction.totalQty,
        grossAmount: updatedTransaction.grossAmount,
        vatableAmount: updatedTransaction.vatableAmount,
        vatExemptSales: updatedTransaction.vatExemptSales,
        vatZeroRatedSales: updatedTransaction.vatZeroRatedSales,
        vatAmount: updatedTransaction.vatAmount,
        totalDiscount: updatedTransaction.totalDiscount,
        totalAmount: updatedTransaction.totalAmount,
        change: updatedTransaction.change,
      },
    },
  });
});

export const searchReceipt = catchAsync(async (req, res, next) => {
  const { receiptNum } = req.params;

  if (!receiptNum) return next(new AppError('Receipt ID is required', 400));

  const receipt = await RefundService.searchReceipt(receiptNum);

  if (!receipt) return next(new AppError('Receipt not found', 404));

  res.status(200).json({
    status: 'success',
    data: receipt,
  });
});

export const fetchProduct = catchAsync(async (req, res, next) => {
  const { receiptNum } = req.params;

  if (!receiptNum) return next(new AppError('Receipt ID is required', 400));

  const products = await RefundService.searchAllProduct(receiptNum);

  if (!products || products.length === 0)
    return next(new AppError('No products found for this receipt', 404));

  // Map product details to send to frontend
  const productData = products.map(item => ({
    sku: item.productId.sku,
    name: item.productId.name,
    quantity: item.quantity,
    price: parseFloat(item.price).toFixed(2),
  }));

  res.status(200).json({
    status: 'success',
    transactionItems: productData,
  });
});
