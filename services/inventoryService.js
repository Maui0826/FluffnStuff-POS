import Inventory from '../models/inventoryModel.js';
import Product from '../models/productModel.js';
import Stock from '../models/stockModel.js';
import transactionModel from '../models/transactionModel.js';
import refund from '../models/refundModel.js';
import transactionItem from '../models/transactionItem.js';

const createInventory = async data => {
  const inventory = await Inventory.create({
    productId: data.productId,
    quantity: data.quantity,
    acquisitionPrice: data.acquisitionPrice || 0, // <- Add this line
  });

  return inventory;
};

const getInventoryById = async id => {
  const inventory = await Inventory.findOne({ _id: id, status: 'active' });
  return inventory;
};

const getInventoryByProductId = async productId => {
  return Inventory.findOne({ productId, status: 'active' });
};

// Update inventory quantity for a product
const updateQuantity = async (productId, quantity) => {
  const inventory = await Inventory.findOneAndUpdate(
    { productId: productId, status: 'active' },
    { quantity: quantity, updatedAt: Date.now() },
    { new: true }
  );

  return inventory;
};

const updateInventory = async ({ productId, quantity }) => {
  return await Inventory.findOneAndUpdate(
    { productId },
    { $set: { quantity } },
    { new: true, upsert: true }
  );
};

const deleteInventory = async id => {
  const inventory = await Inventory.findOneAndUpdate({
    productId: id,
    status: 'deleted',
  });
};

const stockStatus = async () => {
  const stock = await Inventory.aggregate([
    {
      $lookup: {
        from: 'products', // collection name in MongoDB (lowercase plural)
        localField: 'productId',
        foreignField: '_id',
        as: 'product',
      },
    },
    { $unwind: '$product' },
    {
      $project: {
        _id: 0,
        name: '$product.name',
        sku: '$product.sku',
        quantity: 1,
        lowStockThreshold: '$product.lowStockThreshold',
        status: {
          $switch: {
            branches: [
              {
                case: { $lte: ['$quantity', '$product.lowStockThreshold'] },
                then: 'Low Stock',
              },
              {
                case: { $eq: ['$quantity', 0] },
                then: 'Out of Stock',
              },
            ],
            default: 'In Stock',
          },
        },
      },
    },
  ]);

  return { stock }; // labeled as 'stock'
};

const getOrderSummary = async () => {
  const summary = await Stock.aggregate([
    { $match: { isDeleted: false } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalOrdered: { $sum: '$orderQuantity' },
        totalDelivered: { $sum: '$deliveredQuantity' },
      },
    },
  ]);

  const result = {
    pending: { count: 0, totalOrdered: 0, totalDelivered: 0 },
    delivered: { count: 0, totalOrdered: 0, totalDelivered: 0 },
    cancelled: { count: 0, totalOrdered: 0, totalDelivered: 0 },
  };

  summary.forEach(item => {
    result[item._id] = {
      count: item.count,
      totalOrdered: item.totalOrdered,
      totalDelivered: item.totalDelivered,
    };
  });

  return result;
};

// ✅ Inventory Summary
const getInventorySummary = async (startDate, endDate) => {
  const dateFilter = {};
  if (startDate || endDate) {
    dateFilter.$and = [];
    if (startDate)
      dateFilter.$and.push({ dateRecorded: { $gte: new Date(startDate) } });
    if (endDate)
      dateFilter.$and.push({ dateRecorded: { $lte: new Date(endDate) } });
  }

  const products = await Product.find({ status: 'active' });

  const summary = await Promise.all(
    products.map(async p => {
      // Total received
      const receivedAgg = await Inventory.aggregate([
        {
          $match: {
            productId: p._id,
            ...(dateFilter.$and?.length
              ? {
                  dateRecorded: {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate),
                  },
                }
              : {}),
          },
        },
        { $group: { _id: null, total: { $sum: '$quantity' } } },
      ]);
      const qtyReceived = receivedAgg[0]?.total || 0;

      // Total sold
      const soldAgg = await transactionItem.aggregate([
        {
          $match: {
            productId: p._id,
            isDeleted: false,
            ...(dateFilter.$and?.length
              ? {
                  createdAt: {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate),
                  },
                }
              : {}),
          },
        },
        { $group: { _id: null, total: { $sum: '$quantity' } } },
      ]);
      const qtySold = soldAgg[0]?.total || 0;

      // Total damaged/refunded
      const refundAgg = await refund.aggregate([
        {
          $match: {
            productId: p._id,
            isDeleted: false,
            ...(dateFilter.$and?.length
              ? {
                  refundedAt: {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate),
                  },
                }
              : {}),
          },
        },
        { $group: { _id: null, total: { $sum: '$quantity' } } },
      ]);
      const qtyDamaged = refundAgg[0]?.total || 0;

      // On hand = current stock (real-time)
      const inventory = await Inventory.findOne({ productId: p._id });
      const qtyOnHand = inventory ? inventory.quantity : 0;

      // Acquisition price from inventory
      const acquisitionPrice = inventory ? inventory.acquisitionPrice || 0 : 0;

      return {
        productId: p._id,
        productName: p.name,
        qtyReceived,
        qtySold,
        qtyDamaged,
        qtyOnHand,
        acquisitionPrice, // <-- added here
      };
    })
  );

  return summary;
};

// DETAILS: full history for one product
// ✅ Inventory Details
const getInventoryDetails = async (productId, startDate, endDate) => {
  const product = await Product.findById(productId);
  if (!product) return null;

  const dateFilter = {};
  if (startDate || endDate) {
    dateFilter.$and = [];
    if (startDate)
      dateFilter.$and.push({ dateRecorded: { $gte: new Date(startDate) } });
    if (endDate)
      dateFilter.$and.push({ dateRecorded: { $lte: new Date(endDate) } });
  }

  // Receives
  const receives = await Inventory.find({
    productId,
    ...(dateFilter.$and?.length
      ? { dateRecorded: { $gte: new Date(startDate), $lte: new Date(endDate) } }
      : {}),
  })
    .sort({ dateRecorded: 1 })
    .lean();

  // Solds
  const solds = await transactionItem
    .find({
      productId,
      isDeleted: false,
      ...(dateFilter.$and?.length
        ? { createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) } }
        : {}),
    })
    .populate('transactionId', 'createdAt totalAmount')
    .lean();

  // Refunds
  const refunds = await refund
    .find({
      productId,
      isDeleted: false,
      ...(dateFilter.$and?.length
        ? { refundedAt: { $gte: new Date(startDate), $lte: new Date(endDate) } }
        : {}),
    })
    .lean();

  return {
    productName: product.name,
    receives: receives.map(r => ({
      product: product.name,
      dateReceived: r.dateRecorded,
      qtyReceived: r.quantity,
    })),
    solds: solds.map(s => ({
      dateSold: s.transactionId?.createdAt,
      qtySold: s.quantity,
      totalAmount: Number(s.totalAmount),
    })),
    refunds: refunds.map(r => ({
      product: product.name,
      dateReturned: r.refundedAt,
      qtyReturned: r.quantity,
      reason: r.reason,
    })),
  };
};

export default {
  createInventory,
  getInventoryById,
  updateQuantity,
  deleteInventory,
  getInventoryByProductId,
  updateInventory,
  stockStatus,
  getInventoryDetails,
  getInventorySummary,
  getOrderSummary,
};
