import stockModel from '../models/stockModel.js';
import Product from '../models/productModel.js';
const createStock = async data => {
  const newStock = await stockModel.create(data);
  return newStock;
};

const deleteStockByProduct = async id => {
  const stocks = await stockModel.updateMany(
    {
      productId: id,
      status: ['pending', 'delivered', 'cancelled'],
      isDeleted: false,
    },
    { isDeleted: true },
    { new: true }
  );
};

// const getAllStock = async ({
//   filters = {},
//   limit = 10,
//   page = 1,
//   sortBy = 'deliveryDate',
//   sortOrder = 'asc',
// }) => {
//   const query = { isDeleted: false, ...filters };
//   const skip = (page - 1) * limit;

//   const ordersPromise = stockModel
//     .find(query)
//     .populate('productId')
//     .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
//     .skip(skip)
//     .limit(limit)
//     .lean();

//   const countPromise = stockModel.countDocuments(query);

//   const [orders, total] = await Promise.all([ordersPromise, countPromise]);

//   return { orders, total };
// };

const getAllStock = async ({
  filters = {},
  limit = 10,
  page = 1,
  sortBy = 'deliveryDate',
  sortOrder = 'asc',
}) => {
  const query = { isDeleted: false };

  // ✅ Apply only the filters given
  if (filters.supplierName) query.supplierName = filters.supplierName;
  if (filters.status) query.status = filters.status;
  if (filters.productId) query.productId = filters.productId;
  if (filters.deliveryDate) query.deliveryDate = filters.deliveryDate;

  // ✅ Range filters (only if explicitly present)
  if (filters.fromDate || filters.toDate) {
    query.deliveryDate = {};
    if (filters.fromDate) query.deliveryDate.$gte = new Date(filters.fromDate);
    if (filters.toDate) query.deliveryDate.$lte = new Date(filters.toDate);
  }

  if (filters.minQty || filters.maxQty) {
    query.quantity = {};
    if (filters.minQty) query.quantity.$gte = Number(filters.minQty);
    if (filters.maxQty) query.quantity.$lte = Number(filters.maxQty);
  }

  const skip = (page - 1) * limit;

  const ordersPromise = stockModel
    .find(query)
    .populate({
      path: 'productId',
      match: filters['productId.categoryId']
        ? { categoryId: filters['productId.categoryId'] }
        : {},
    })
    .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const countPromise = stockModel.countDocuments(query);

  let [orders, total] = await Promise.all([ordersPromise, countPromise]);

  if (filters['productId.categoryId']) {
    orders = orders.filter(order => order.productId);
  }

  return { orders, total, page, limit };
};

const getStockById = async id => {
  const stock = await stockModel.findById(id);

  return stock;
};

const updateStatus = async (id, status) => {
  return await stockModel.findByIdAndUpdate(
    id,
    { $set: { status } },
    { new: true }
  );
};

const updateDeliveredStock = async (id, status, deliveredQuantity) => {
  return await stockModel.findByIdAndUpdate(
    id,
    {
      $set: {
        status,
        deliveredQuantity,
        deliveredDate: new Date(),
      },
    },
    { new: true }
  );
};

const getOrderSummary = async () => {
  const orders = await stockModel.aggregate([
    {
      $match: {
        status: { $in: ['pending', 'delivered', 'cancelled'] },
        isDeleted: false,
      },
    },
    {
      $lookup: {
        from: 'products', // MongoDB collection name for Product
        localField: 'productId',
        foreignField: '_id',
        as: 'product',
      },
    },
    { $unwind: '$product' },
    {
      $project: {
        _id: 0,
        productName: '$product.name',
        orderQuantity: 1,
        status: 1,
      },
    },
  ]);

  return { orders };
};

const stockStatus = async () => {
  const stockData = await stockModel.aggregate([
    { $match: { isDeleted: false } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  const result = { pending: 0, delivered: 0, cancelled: 0 };
  stockData.forEach(item => {
    result[item._id] = item.count;
  });

  return result;
};

export default {
  createStock,
  stockStatus,
  deleteStockByProduct,
  updateStatus,
  getAllStock,
  getStockById,
  updateDeliveredStock,
  getOrderSummary,
};
