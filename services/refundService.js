import Refund from '../models/refundModel.js';
import Transaction from '../models/transactionModel.js';
import TransactItem from '../models/transactionItem.js';

// Soft-delete related Refunds
const deleteRefund = async ids => {
  const refund = await Refund.updateMany(
    { transactItemId: { $in: ids }, isDeleted: false },
    { isDeleted: true }
  );

  return refund;
};

const createRefund = async data => {
  const refund = await Refund.create({
    transactionItemId: data.transactionItemId,
    productId: data.productId,
    quantity: data.quantity,
    refundPrice: data.refundPrice,
    reason: data.reason,
    note: data.note,
    isDiscounted: data.isDiscounted,
  });

  return refund;
};

const getAllRefund = async () => {
  const refunds = await Refund.findMany({
    isDeleted: false,
  });

  return refunds;
};

const searchReceipt = async receiptNum => {
  return await Transaction.findOne({
    receiptNum: receiptNum,
    isDeleted: false,
  });
};

const searchAllProduct = async transactionId => {
  return await TransactItem.find({ transactionId, isDeleted: false }).populate(
    'productId'
  );
};

const refundLoginService = async (email, password) => {
  if (!email || !password) {
    throw new AppError('Provide email and password for login', 400);
  }

  const user = await usersModel.findOne({ email }).select('+password');
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    throw new AppError('Incorrect Email or Password', 401);
  }

  // Only allow certain roles to access refund
  if (!['admin', 'owner'].includes(user.role)) {
    throw new AppError('Unauthorized to access refund', 403);
  }

  // Generate token valid for refund session
  const token = jwt.generateToken(
    { email, role: user.role },
    process.env.REFUND_SESSION_EXP * 60 * 60 // in seconds
  );

  return { token, user };
};

export default {
  deleteRefund,
  searchReceipt,
  searchAllProduct,
  createRefund,
  refundLoginService,
};
