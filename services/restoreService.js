// services/restoreService.js
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

const models = {
  users: User,
  products: Product,
  categories: Category,
  inventories: Inventory,
  inventoryRecords: InventoryRecord,
  suppliers: Supplier,
  stocks: Stock,
  stockAdjustments: StockAdjustment,
  transactions: Transaction,
  transactionItems: TransactionItem,
  refunds: Refund,
  actionLogs: ActionLog,
};

export const restoreDatabase = async backupData => {
  const collections = Object.keys(models);

  for (const name of collections) {
    const Model = models[name];
    const records = backupData.data[name] || [];

    if (records.length > 0) {
      // clear existing collection before restoring
      await Model.deleteMany({});
      await Model.insertMany(records);
    }
  }

  return { status: 'success', restoredCollections: collections };
};
