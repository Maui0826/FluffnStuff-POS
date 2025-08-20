import TransactionService from '../services/transactionService.js';
import InventoryService from '../services/inventoryService.js';
import Stock from '../services/stockService.js';
import catchAsync from '../utils/catchAsync.js';

export const dashboard = catchAsync(async (req, res, next) => {
  const weeklySale = await TransactionService.weeklySale();
  const stock = await Stock.stockStatus();
  const orders = await InventoryService.getOrderSummary();
  const recent = await TransactionService.getRecentTransaction();

  res.status(200).json({
    status: 'success',
    data: {
      weeklySale,
      stock,
      orders,
      recent,
    },
  });
});
