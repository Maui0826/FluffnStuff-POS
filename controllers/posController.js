import { generateReceiptNum } from '../utils/generateReceipt.js';
import TransactionService from '../services/transactionService.js';
import LogService from '../services/actionLogService.js';
import TransactItem from '../services/transactItemService.js';
import RefundService from '../services/refundService.js';
import { validateProducts } from '../utils/validator.js';
import ProductService from '../services/productService.js';
import catchAsync from '../utils/catchAsync.js';
import Product from '../models/productModel.js';
import AppError from '../utils/AppError.js';

// controllers/posController.js
export const createTransaction = catchAsync(async (req, res, next) => {
  const {
    items,
    cash, // amount customer paid
    discountType,
    paymentMethod,
    referenceNumber,
    seniorId,
    pwdId,
  } = req.body;

  if (!Array.isArray(items) || !items.length) {
    return next(new AppError('No items provided', 400));
  }

  // Normalize payment method
  const pm = paymentMethod === 'bank' ? 'bankTransfer' : paymentMethod;

  // Require reference number for ewallet/bank
  if ((pm === 'ewallet' || pm === 'bankTransfer') && !referenceNumber) {
    return next(
      new AppError(
        'Reference number is required for eWallet/Bank Transfer',
        400
      )
    );
  }

  // --- Fetch product names from DB ---
  const productIds = items.map(item => item.productId);
  const products = await Product.find({ _id: { $in: productIds } });

  // Map productId to name
  const productMap = {};
  products.forEach(p => {
    productMap[p._id.toString()] = p.name;
  });

  // Build item breakdown string
  const itemBreakdown = items
    .map((item, index) => {
      const name = productMap[item.productId] || 'Unknown Product';
      return `${index + 1}. ${name} - Qty: ${item.quantity}, Price: ₱${
        item.price
      }`;
    })
    .join(' | ');

  const transaction = await TransactionService.createTransaction({
    items,
    cash: Number(cash) || 0,
    discountType: discountType || 'none',
    paymentMethod: pm,
    referenceNumber: referenceNumber || null,
    seniorId: discountType === 'senior' ? seniorId || null : null,
    pwdId: discountType === 'pwd' ? pwdId || null : null,
    cashier: req.currentUser._id,
  });

  // --- Create Action Log ---
  await LogService.createActionLog({
    user: req.currentUser._id,
    action: 'Create Transaction',
    target: 'Transaction',
    description: `Transaction created. Payment: ${pm}, Discount: ${discountType}. Items: ${itemBreakdown}`,
  });

  res.status(201).json({
    status: 'success',
    message: 'Transaction saved successfully',
    data: { transaction },
  });
});

export const searchProduct = catchAsync(async (req, res) => {
  const { search } = req.body;

  if (!search || !search.trim()) {
    return res
      .status(400)
      .json({ status: 'error', message: 'Search term required' });
  }
  console.log(search);

  const products = await ProductService.searchProduct(search);

  res.status(200).json({
    status: 'success',
    data: products,
  });
});
