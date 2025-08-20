import Stock from '../models/stockAdjustment.js';

const createAdjustStock = async data => {
  const adjusted = await StockAdjustment.create({
    product: data.product,
    previousQuantity: data.previousQuantity,
    adjustedQuantity: data.adjustedQuantity,
    change: data.change,
    reason: data.reason,
    note: data.note,
    adjustedBy: data.adjustedBy,
  });
  return adjusted;
};

const getAllAdjusted = async ({
  search,
  filter,
  sortBy,
  sortOrder,
  limit,
  page,
}) => {
  const query = {};

  // 🔍 Search by product name or reason or note
  if (search) {
    query.$or = [
      { reason: { $regex: search, $options: 'i' } },
      { note: { $regex: search, $options: 'i' } },
    ];
  }

  // 🎯 Filtering by reason
  if (filter?.reason) {
    query.reason = filter.reason;
  }

  // 🎯 Filtering by date range
  if (filter?.startDate && filter?.endDate) {
    query.date = {
      $gte: new Date(filter.startDate),
      $lte: new Date(filter.endDate),
    };
  }

  // 🗂️ Sorting
  const sortField = sortBy || 'date';
  const sortDirection = sortOrder === 'asc' ? 1 : -1;

  // 📄 Pagination
  const pageNumber = parseInt(page, 10) || 1;
  const pageSize = parseInt(limit, 10) || 10;
  const skip = (pageNumber - 1) * pageSize;

  // 📦 Query execution
  const adjusted = await Stock.find(query)
    .populate('product', 'name sku')
    .populate('adjustedBy', 'name email')
    .sort({ [sortField]: sortDirection })
    .skip(skip)
    .limit(pageSize);

  const total = await Stock.countDocuments(query);

  return {
    total,
    page: pageNumber,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
    data: adjusted,
  };
};

export default { createAdjustStock, getAllAdjusted };
