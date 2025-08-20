import Inventory from '../models/inventoryModel.js';
import Product from '../models/productModel.js';
import Stock from '../models/stockModel.js';

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

export default {
  createInventory,
  getInventoryById,
  updateQuantity,
  deleteInventory,
  getInventoryByProductId,
  updateInventory,
  stockStatus,
  getOrderSummary,
};
