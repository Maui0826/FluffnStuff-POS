// services/backupService.js
import User from '../models/userModel.js';
import Product from '../models/productModel.js';
import Category from '../models/categoryModel.js';
import Inventory from '../models/inventoryModel.js';
import InventoryRecord from '../models/inventoryRecordModel.js';
import Supplier from '../models/supplierModel.js';
import Stock from '../models/stockModel.js';
import StockAdjustment from '../models/stockAdjustment.js';
import Transaction from '../models/transactionModel.js';
import TransactionItem from '../models/transactionItem.js';
import Refund from '../models/refundModel.js';
import ActionLog from '../models/actionLogsModel.js';

export const getDatabaseBackup = async () => {
  const [
    users,
    products,
    categories,
    inventories,
    inventoryRecords,
    suppliers,
    stocks,
    stockAdjustments,
    transactions,
    transactionItems,
    refunds,
    actionLogs,
  ] = await Promise.all([
    User.find().select('+password').lean(),
    Product.find().lean(),
    Category.find().lean(),
    Inventory.find().lean(),
    InventoryRecord.find().lean(),
    Supplier.find().lean(),
    Stock.find().lean(),
    StockAdjustment.find().lean(),
    Transaction.find().lean(),
    TransactionItem.find().lean(),
    Refund.find().lean(),
    ActionLog.find().lean(),
  ]);

  return {
    meta: {
      generatedAt: new Date(),
      collections: [
        'users',
        'products',
        'categories',
        'inventories',
        'inventoryRecords',
        'suppliers',
        'stocks',
        'stockAdjustments',
        'transactions',
        'transactionItems',
        'refunds',
        'actionLogs',
      ],
    },
    data: {
      users,
      products,
      categories,
      inventories,
      inventoryRecords,
      suppliers,
      stocks,
      stockAdjustments,
      transactions,
      transactionItems,
      refunds,
      actionLogs,
    },
  };
};
