import StockService from '../services/stockService.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';
import InventoryService from '../services/inventoryService.js';
import ProductService from '../services/productService.js';
import LogService from '../services/actionLogService.js';

export const getAllOrders = catchAsync(async (req, res) => {
  const {
    deliveryDate,
    status,
    supplier,
    category,
    limit = 10,
    page = 1,
    sortBy,
    sortOrder,
  } = req.query;

  const filters = {};
  if (deliveryDate) filters.deliveryDate = new Date(deliveryDate);
  if (status) filters.status = status.toLowerCase();
  if (supplier) filters.supplierName = { $regex: supplier, $options: 'i' };
  if (category) filters['productId.categoryId'] = category;

  const { orders, total } = await StockService.getAllStock({
    filters,
    limit: Number(limit),
    page: Number(page),
    sortBy,
    sortOrder,
  });

  res.status(200).json({
    status: 'success',
    count: orders.length,
    total, // <-- total count for pagination
    data: orders,
  });
});

export const updateStatus = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { status, deliveredQuantity } = req.body;

  if (!id || !status) {
    return next(new AppError('Stock ID and status are required', 400));
  }

  const validStatuses = ['delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return next(new AppError('Invalid status value', 400));
  }

  const stock = await StockService.getStockById(id);
  if (!stock || stock.isDeleted) {
    return next(new AppError('Stock not found or already deleted', 404));
  }

  // Get product info
  const product = await ProductService.getProductById(stock.productId);
  const productName = product ? product.name : 'Unknown Product';

  let description = ''; // for action log

  if (status === 'delivered') {
    if (
      !deliveredQuantity ||
      isNaN(deliveredQuantity) ||
      deliveredQuantity <= 0
    ) {
      return next(
        new AppError(
          'Delivered quantity is required and must be greater than 0.',
          400
        )
      );
    }

    const inventory = await InventoryService.getInventoryByProductId(
      stock.productId
    );
    if (!inventory) {
      return next(new AppError('Related inventory not found.', 404));
    }

    const updatedInventory = await InventoryService.updateInventory({
      productId: stock.productId,
      quantity: inventory.quantity + parseInt(deliveredQuantity),
    });

    const updatedStock = await StockService.updateDeliveredStock(
      id,
      status,
      parseInt(deliveredQuantity)
    );

    // Prepare action log description
    description = `Stock delivered for Product Name: ${productName}. Delivered Quantity: ${deliveredQuantity}. Updated Inventory: ${updatedInventory.quantity}`;

    // Create action log
    await LogService.createActionLog({
      user: req.currentUser._id,
      action: 'Update Stock',
      target: 'Stock',
      description,
    });

    return res.status(200).json({
      status: 'success',
      message:
        'Stock marked as delivered, inventory updated, and delivered date recorded',
      data: {
        stock: updatedStock,
        inventory: updatedInventory,
      },
    });
  }

  // Prepare action log description
  description = `Stock status updated to "${status}" for Product ID: ${stock.productId}`;

  // Create action log
  await LogService.createActionLog({
    user: req.currentUser._id,
    action: 'Update Stock',
    target: 'Stock',
    description,
  });

  // Handle cancellation
  const updatedStock = await StockService.updateStatus(id, status);
  res.status(200).json({
    status: 'success',
    message: `Stock status updated to "${status}"`,
    data: updatedStock,
  });
});
