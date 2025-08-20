import Inventory from '../models/inventoryModel.js';
import Product from '../models/productModel.js';
import Refund from '../models/refundModel.js';
import StockAdjustment from '../models/stockAdjustment.js';

export const getInventoryReport = async (fromDate, toDate) => {
  const from = new Date(fromDate);
  const to = new Date(toDate);

  // --- Top Selling by SKU ---
  const inventorySales = await Inventory.aggregate([
    { $match: { updatedAt: { $gte: from, $lte: to } } },
    {
      $group: {
        _id: '$productId',
        quantity: { $sum: '$quantity' },
        cogs: { $sum: { $multiply: ['$acquisitionPrice', '$quantity'] } },
      },
    },
  ]);

  const topSellingBySKU = [];
  let totalQuantitySold = 0;
  for (const item of inventorySales) {
    const product = await Product.findById(item._id);
    if (!product) continue;
    topSellingBySKU.push({
      sku: product.sku,
      name: product.name,
      quantity: item.quantity,
      cogs: Number(item.cogs),
    });
    totalQuantitySold += item.quantity;
  }

  // --- Top Selling by Category ---
  const categorySales = {};
  for (const item of topSellingBySKU) {
    const product = await Product.findOne({ sku: item.sku });
    if (!product) continue;
    const category = product.categoryId || 'Uncategorized';
    if (!categorySales[category])
      categorySales[category] = { quantity: 0, cogs: 0 };
    categorySales[category].quantity += item.quantity;
    categorySales[category].cogs += item.cogs;
  }

  const topSellingByCategory = Object.entries(categorySales).map(
    ([category, data]) => ({
      category,
      quantity: data.quantity,
      cogs: data.cogs,
    })
  );

  // --- Refunds ---
  const refundsRaw = await Refund.find({
    refundedAt: { $gte: from, $lte: to },
  }).populate('productId');
  const refunds = refundsRaw.map(r => ({
    name: r.productId.name,
    quantity: r.quantity,
    amount: Number(r.refundPrice),
    reason: r.reason,
  }));

  // --- Refund Summary by Reason ---
  const refundReasons = [
    'damaged',
    'wrong item',
    'defective',
    'customer request',
    'expired',
    'overcharge',
  ];

  const refundSummary = refundReasons.map(reason => {
    const items = refunds.filter(r => r.reason === reason);
    const totalQty = items.reduce((sum, i) => sum + i.quantity, 0);
    const totalAmount = items.reduce((sum, i) => sum + i.amount, 0);
    return { reason, totalQty, totalAmount };
  });

  // --- Damaged / Stock Adjustments ---
  const allAdjustments = await StockAdjustment.find({
    date: { $gte: from, $lte: to },
  }).populate('product');
  const damaged = allAdjustments
    .filter(a => a.reason === 'damaged')
    .map(a => ({
      name: a.product.name,
      quantity: a.adjustedQuantity,
    }));

  // --- Low Stock Duration ---
  const lowStockRaw = await Inventory.find({ quantity: { $lte: 5 } });
  const lowStock = lowStockRaw.map(item => ({
    name: item.productId.name,
    days: Math.ceil((to - item.updatedAt) / (1000 * 60 * 60 * 24)),
  }));

  // --- Summary Values ---
  const totalInventoryValue = await Inventory.aggregate([
    { $match: { updatedAt: { $gte: from, $lte: to } } },
    {
      $group: {
        _id: null,
        value: { $sum: { $multiply: ['$acquisitionPrice', '$quantity'] } },
      },
    },
  ]);

  const totalRefunds = refunds.reduce((sum, r) => sum + r.amount, 0);

  return {
    topSellingBySKU,
    topSellingByCategory,
    refunds,
    damaged,
    lowStock,
    refundSummary,
    summary: {
      totalInventoryValue: totalInventoryValue[0]?.value || 0,
      totalQuantitySold,
      totalRefunds,
    },
  };
};
