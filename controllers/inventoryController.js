import CategoryService from '../services/categoryService.js';
import ProductService from '../services/productService.js';
import InventoryService from '../services/inventoryService.js';
import StockAdjustment from '../services/stockAdjustmentService.js';
import StockService from '../services/stockService.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import path from 'path';
import mongoose from 'mongoose';
import LogService from '../services/actionLogService.js';

/**
 * Get all products with populated product and category info
 */
export const getAllProducts = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 10 } = req.query;
  const { products, totalCount } = await ProductService.getAllProducts({
    page: Number(page),
    limit: Number(limit),
  });

  res.status(200).json({
    status: 'success',
    results: products.length,
    totalCount,
    data: products,
  });
});

export const createProduct = catchAsync(async (req, res, next) => {
  const {
    sku,
    productName,
    categoryId,
    quantity,
    description,
    imageUrl,
    price,
    acquisition,
    lowStockThreshold,
  } = req.body;
  const uploadedFile = req.file;

  // Validate required fields
  if (!sku || !productName || !categoryId || !quantity || !price) {
    return next(new AppError('Missing required fields', 400));
  }

  // Convert numeric fields
  const numericPrice = parseFloat(price);
  const numericQuantity = parseInt(quantity);
  const numericAcquisition = parseFloat(acquisition || 0);
  const numericLowThreshold = parseInt(lowStockThreshold || 5);

  if (isNaN(numericPrice) || numericPrice < 0)
    return next(new AppError('Price must be a valid non-negative number', 400));

  if (isNaN(numericQuantity) || numericQuantity < 0)
    return next(
      new AppError('Quantity must be a valid non-negative number', 400)
    );

  if (isNaN(numericAcquisition) || numericAcquisition < 0)
    return next(
      new AppError('Acquisition price must be a valid non-negative number', 400)
    );

  // 1. Create or get existing category
  const category = await CategoryService.categoryById(categoryId);
  if (!category)
    return next(
      new AppError('Category does not exist. Please create the category', 404)
    );

  // 2. Check for existing SKU
  const existing = await ProductService.getProductBySKU(sku);
  if (existing) return next(new AppError('SKU already exists', 409));

  // 3. Handle image path
  const finalImageUrl = uploadedFile
    ? path.join('Images', uploadedFile.filename)
    : imageUrl || '../Images/noimage.png';

  // 4. Create product
  const prod = {
    name: productName,
    sku,
    categoryId: category._id,
    price: mongoose.Types.Decimal128.fromString(numericPrice.toString()), // <-- Fix here
    lowStockThreshold: numericLowThreshold,
    imageUrl: finalImageUrl,
    description,
  };

  const newProduct = await ProductService.createProduct(prod);
  if (!newProduct) return next(new AppError('Product creation failed.', 500));

  // 5. Create inventory
  const inventoryData = {
    productId: newProduct._id,
    quantity: numericQuantity,
    acquisitionPrice: numericAcquisition,
  };
  const inventory = await InventoryService.createInventory(inventoryData);
  if (!inventory) return next(new AppError('Inventory creation failed', 500));

  // 6. Create action log
  const descriptionLog = `Created Product "${productName}" (SKU: ${sku}), Initial Quantity: ${numericQuantity}, Price: ₱${numericPrice.toFixed(
    2
  )}`;
  await LogService.createActionLog({
    user: req.currentUser._id,
    action: 'Create Product',
    target: 'Product',
    description: descriptionLog,
  });

  res.status(201).json({
    status: 'success',
    data: {
      product: newProduct,
      inventory,
    },
  });
});

export const updateProduct = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!id) return next(new AppError('Product ID is required', 400));

  const product = await ProductService.getProductById(id);
  if (!product) return next(new AppError('Product not found', 404));

  const inventory = await InventoryService.getInventoryByProductId(id);
  if (!inventory) return next(new AppError('Inventory record not found', 404));

  const uploadedFile = req.file;
  const {
    sku,
    productName,
    price,
    acquisitionPrice,
    quantity,
    reason,
    note,
    imageUrl,
    description,
    lowStockThreshold,
    categoryId,
    categoryName,
  } = req.body || {};

  // Handle image
  const finalImageUrl = uploadedFile
    ? path.join('Images', uploadedFile.filename)
    : imageUrl || product.imageUrl;

  // Handle category mapping
  let finalCategoryId = categoryId || product.categoryId;
  let finalCategoryName = product.categoryName || '';
  if (categoryName && !categoryId) {
    const category = await CategoryService.categoryByName(categoryName);
    if (category) {
      finalCategoryId = category._id;
      finalCategoryName = category.name;
    }
  }

  // Parse numeric fields
  const numericPrice =
    price !== undefined ? parseFloat(price) : parseFloat(product.price || 0);
  const numericAcquisition =
    acquisitionPrice !== undefined
      ? parseFloat(acquisitionPrice)
      : parseFloat(inventory.acquisitionPrice || 0);
  const numericLowThreshold =
    lowStockThreshold !== undefined
      ? parseInt(lowStockThreshold)
      : product.lowStockThreshold;
  const numericQuantity =
    quantity !== undefined ? parseInt(quantity) : undefined;

  // Validate numbers
  if (isNaN(numericPrice))
    return next(new AppError('Price must be a valid number', 400));
  if (isNaN(numericAcquisition))
    return next(new AppError('Acquisition price must be a valid number', 400));
  if (numericQuantity !== undefined && isNaN(numericQuantity))
    return next(new AppError('Quantity must be a valid number', 400));

  // Build product update object
  const updateData = {};
  if (sku) updateData.sku = sku;
  if (productName) updateData.name = productName;
  if (finalImageUrl) updateData.imageUrl = finalImageUrl;
  if (description) updateData.description = description;
  if (numericLowThreshold !== undefined)
    updateData.lowStockThreshold = numericLowThreshold;
  if (finalCategoryId) updateData.categoryId = finalCategoryId;
  if (numericPrice !== undefined) updateData.price = numericPrice;

  // Update product
  const updatedProduct = await ProductService.updateProduct(id, updateData);

  // Update inventory if quantity or acquisitionPrice changed
  if (
    (numericQuantity !== undefined && numericQuantity !== inventory.quantity) ||
    numericAcquisition !== parseFloat(inventory.acquisitionPrice || 0)
  ) {
    if (numericQuantity !== undefined && !reason)
      return next(new AppError('Stock adjustment reason is required', 400));

    if (numericQuantity !== undefined) {
      // Log the manual stock adjustment
      await StockAdjustment.createAdjustStock({
        product: updatedProduct._id,
        previousQuantity: inventory.quantity,
        adjustedQuantity: numericQuantity,
        previousAcquisition: parseFloat(inventory.acquisitionPrice || 0),
        newAcquisition: numericAcquisition,
        change: numericQuantity - inventory.quantity,
        reason,
        note,
        adjustedBy: req.currentUser?.id || 'system',
      });
    }

    // Update inventory
    await InventoryService.updateInventory({
      productId: updatedProduct._id,
      quantity: numericQuantity,
      acquisitionPrice: numericAcquisition,
    });
  }

  // --- Action Log ---
  const logChanges = [];
  if (sku && sku !== product.sku)
    logChanges.push(`SKU: ${product.sku} → ${sku}`);
  if (productName && productName !== product.name)
    logChanges.push(`Name: ${product.name} → ${productName}`);
  if (numericPrice !== parseFloat(product.price || 0))
    logChanges.push(
      `Price: ₱${parseFloat(product.price || 0).toFixed(
        2
      )} → ₱${numericPrice.toFixed(2)}`
    );
  if (numericLowThreshold !== product.lowStockThreshold)
    logChanges.push(
      `LowStockThreshold: ${product.lowStockThreshold} → ${numericLowThreshold}`
    );
  if (finalCategoryId !== product.categoryId)
    logChanges.push(
      `Category: ${product.categoryName || 'N/A'} → ${finalCategoryName}`
    );
  if (numericQuantity !== undefined && numericQuantity !== inventory.quantity)
    logChanges.push(`Quantity: ${inventory.quantity} → ${numericQuantity}`);
  if (numericAcquisition !== parseFloat(inventory.acquisitionPrice || 0))
    logChanges.push(
      `AcquisitionPrice: ₱${parseFloat(inventory.acquisitionPrice || 0).toFixed(
        2
      )} → ₱${numericAcquisition.toFixed(2)}`
    );

  if (logChanges.length) {
    await LogService.createActionLog({
      user: req.currentUser?.id || 'system',
      action: 'Update Product',
      target: 'Product',
      description: `Updated Product "${product.name}" (SKU: ${
        product.sku
      }): ${logChanges.join('; ')}`,
    });
  }

  // Format response to match GET structure
  const responseProduct = {
    _id: updatedProduct._id,
    sku: updatedProduct.sku,
    name: updatedProduct.name,
    imageUrl: updatedProduct.imageUrl,
    categoryName: finalCategoryName,
    categoryId: finalCategoryId,
    price: numericPrice,
    acquisitionPrice: numericAcquisition,
    quantity:
      numericQuantity !== undefined ? numericQuantity : inventory.quantity,
    lowStockThreshold: updatedProduct.lowStockThreshold,
    description: updatedProduct.description,
    actions: '',
  };

  res.status(200).json({
    status: 'success',
    message: 'Product updated successfully',
    data: responseProduct,
  });
});

export const deleteProduct = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!id) return next(new AppError('Invalid empty field', 400));

  const prod = await ProductService.deleteProduct(id);
  if (!prod) return next(new AppError('Deletion of product failed.', 404));

  // Create action log
  await LogService.createActionLog({
    user: req.currentUser?.id || 'system',
    action: 'Delete Product',
    target: 'Product',
    description: `Deleted Product "${product.name}" (SKU: ${product.sku})`,
  });

  res.status(200).json({
    status: 'success',
    message: 'Product deleted successfully',
  });
});

export const orderStock = catchAsync(async (req, res, next) => {
  const { productId } = req.params;
  const { supplierName, deliveryDate, acquisitionPrice, orderQuantity } =
    req.body;

  // 1. Validate required fields
  if (
    !productId ||
    !supplierName ||
    !deliveryDate ||
    !acquisitionPrice ||
    !orderQuantity
  ) {
    return next(new AppError('All fields are required.', 400));
  }

  // 2. Check if product exists
  const product = await ProductService.getProductById(productId);
  if (!product || product.status === 'deleted') {
    return next(new AppError('Product not found or deleted.', 404));
  }

  // 3. Parse numeric values safely
  const parsedQuantity = parseInt(orderQuantity, 10);
  const parsedPrice = parseFloat(acquisitionPrice);

  if (isNaN(parsedQuantity) || isNaN(parsedPrice)) {
    return next(new AppError('Quantity and price must be valid numbers.', 400));
  }

  const stockData = {
    productId,
    supplierName: supplierName.trim(),
    orderQuantity: parsedQuantity,
    deliveryDate: new Date(deliveryDate),
    acquisitionPrice: parsedPrice,
    status: 'pending',
  };

  // 4. Create stock order record
  const stockOrder = await StockService.createStock(stockData);
  if (!stockOrder) return next(new AppError('Restock operation failed', 500));

  // 5. Create action log
  await LogService.createActionLog({
    user: req.currentUser?.id || 'system',
    action: 'Order Stock',
    target: 'Product',
    description: `Ordered ${parsedQuantity} units of "${product.name}" from supplier "${supplierName}" at price ${parsedPrice}`,
  });

  // 5. Respond
  res.status(201).json({
    status: 'success',
    message: 'Stock order placed successfully.',
    results: 1,
    data: [stockOrder],
  });
});

export const updateCategory = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  let { name, description } = req.body;

  // Ensure name is a string
  name = name ? String(name) : '';
  description = description ? String(description) : '';

  if (!id || name.trim() === '') {
    return next(new AppError('Category ID and name are required', 400));
  }

  const categoryData = {
    name: name.trim(),
    description: description.trim() || 'No description', // default if empty
  };

  const updatedCategory = await CategoryService.updateCategory(
    id,
    categoryData
  );

  if (!updatedCategory) {
    return next(new AppError('Category not found or update failed', 404));
  }

  // Prepare action log description
  const descriptionLog = `Category updated: ${categoryData.name}. Description: ${categoryData.description}`;

  // Create action log
  await LogService.createActionLog({
    user: req.currentUser?.id,
    action: 'Update Category',
    target: 'Category',
    description: descriptionLog,
  });

  res.status(200).json({
    status: 'success',
    message: 'Category updated successfully',
    data: updatedCategory,
  });
});

export const deleteCategory = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!id) return next(new AppError('Invalid empty field', 400));

  // 1. Get the category
  const category = await CategoryService.categoryById(id);
  if (!category) return next(new AppError('Category not found.', 404));

  // 2. Fetch all active products under this category
  const products = await ProductService.getAllProductsByCategoryId(id);

  // 3. Delete all products (mark as 'deleted')
  const productDeleteResult = await ProductService.deleteAllProductByCategoryId(
    id
  );
  if (!productDeleteResult)
    return next(new AppError('Error deleting products', 400));

  // 4. Delete the category
  const deletedCategory = await CategoryService.deleteCategory(id);
  if (!deletedCategory)
    return next(new AppError('Error deleting category', 400));

  // 5. Optional: Create an action log for each deleted product
  for (const prod of products) {
    await LogService.createActionLog({
      user: req.currentUser?.id,
      action: 'Delete Product',
      target: 'Product',
      description: `Deleted product: ${prod.name} (SKU: ${prod.sku}) under category: ${category.name}`,
    });
  }

  // 6. Action log for category deletion
  await LogService.createActionLog({
    user: req.currentUser?.id,
    action: 'Delete Category',
    target: 'Category',
    description: `Deleted category: ${category.name} and all its ${products.length} products`,
  });

  res.status(200).json({
    status: 'success',
    message: `Category "${category.name}" and its ${products.length} products successfully deleted`,
  });
});

export const createCategory = catchAsync(async (req, res, next) => {
  const { name, description } = req.body;
  if (!name) return next(new AppError('Invalid empty fields', 400));
  const data = {
    name: name,
    description: description,
  };
  const category = await CategoryService.createCategory(data);
  if (!category) return next(new AppError('Category creation failed.', 404));

  // Action log
  await LogService.createActionLog({
    user: req.currentUser?.id,
    action: 'Create Category',
    target: 'Category',
    description: `Created category: ${data.name}. Description: ${data.description}`,
  });

  res.status(201).json({ status: 'success', category });
});

export const getCategoriesController = catchAsync(async (req, res) => {
  // Get query params from request
  const { page = 1, limit = 5, sort = 'asc' } = req.query;

  // Fetch paginated and sorted categories
  const result = await CategoryService.getAllCategories({ page, limit, sort });

  // Return structured response
  res.status(200).json({
    message: 'Categories fetched successfully',
    data: result.categories,
    page: result.page,
    totalPages: result.totalPages,
    totalItems: result.totalItems,
  });
});

export const loadCategory = catchAsync(async (req, res, next) => {
  const category = await CategoryService.loadCategories();

  res.status(200).json({ status: 'success', data: category });
});
