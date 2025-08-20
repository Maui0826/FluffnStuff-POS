import Transaction from '../models/transactionModel.js';
import TransactionItem from '../models/transactionItem.js';
import Product from '../models/productModel.js';
import Category from '../models/categoryModel.js';

export const getSalesReportService = async (fromDate, toDate) => {
  const start = new Date(fromDate);
  const end = new Date(toDate);

  // 1️⃣ Fetch transactions in date range
  const transactions = await Transaction.find({
    createdAt: { $gte: start, $lte: end },
    isDeleted: false,
  }).lean();

  if (!transactions.length) {
    return {
      volume: 0,
      grossSales: 0,
      netProfit: 0,
      totalRevenue: 0,
      totalVAT: 0,
      totalDiscount: 0,
      topSellingBySKU: [],
      topSellingByCategory: [],
    };
  }

  const transactionIds = transactions.map(t => t._id);

  // 2️⃣ Fetch transaction items
  const transactionItems = await TransactionItem.find({
    transactionId: { $in: transactionIds },
    isDeleted: false,
    isRefunded: false,
  }).lean();

  // 3️⃣ Map products
  const productIds = [
    ...new Set(transactionItems.map(item => item.productId.toString())),
  ];
  const products = await Product.find({ _id: { $in: productIds } }).lean();
  const productMap = {};
  products.forEach(p => {
    productMap[p._id.toString()] = p;
  });

  // 4️⃣ Map categories
  const categoryIds = [
    ...new Set(products.map(p => p.categoryId).filter(Boolean)),
  ];
  const categories = await Category.find({
    _id: { $in: categoryIds },
    isDeleted: false,
  }).lean();
  const categoryMap = {};
  categories.forEach(c => {
    categoryMap[c._id.toString()] = c.name;
  });

  // 5️⃣ Initialize totals
  let grossSales = 0;
  let netProfit = 0;
  let totalRevenue = 0;
  let totalVAT = 0;
  let totalDiscount = 0;

  const skuMap = {};
  const categoryStatMap = {};

  transactions.forEach(t => {
    const tTotalAmount = Number(t.totalAmount || 0);
    const tDiscount = Number(t.totalDiscount || 0);

    grossSales += tTotalAmount;
    totalRevenue += tTotalAmount;
    totalDiscount += tDiscount;

    const items = transactionItems.filter(
      item => item.transactionId.toString() === t._id.toString()
    );

    items.forEach(item => {
      const product = productMap[item.productId.toString()];
      if (!product) return;

      const acquisitionPrice = Number(product.acquisitionPrice || 0);
      const netAmount = Number(item.netAmount || 0);
      const quantity = Number(item.quantity || 0);
      const profit = netAmount - acquisitionPrice * quantity;

      netProfit += profit;

      // ✅ Compute total VAT from item
      totalVAT += Number(item.vatAmount || 0);

      // SKU stats
      const sku = product.sku || 'UNKNOWN';
      if (!skuMap[sku])
        skuMap[sku] = {
          name: product.name || 'Unknown',
          quantity: 0,
          netProfit: 0,
        };
      skuMap[sku].quantity += quantity;
      skuMap[sku].netProfit += profit;

      // Category stats
      const categoryName = categoryMap[product.categoryId] || 'Uncategorized';
      if (!categoryStatMap[categoryName])
        categoryStatMap[categoryName] = { quantity: 0, netProfit: 0 };
      categoryStatMap[categoryName].quantity += quantity;
      categoryStatMap[categoryName].netProfit += profit;
    });
  });

  const topSellingBySKU = Object.entries(skuMap)
    .map(([sku, data]) => ({ sku, ...data }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);

  const topSellingByCategory = Object.entries(categoryStatMap)
    .map(([category, data]) => ({ category, ...data }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);

  return {
    volume: transactions.length,
    grossSales,
    netProfit,
    totalRevenue,
    totalVAT, // correctly computed from transaction items
    totalDiscount,
    topSellingBySKU,
    topSellingByCategory,
  };
};
