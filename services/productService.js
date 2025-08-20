import Product from '../models/productModel.js';
import Inventory from '../models/inventoryModel.js';
import Category from '../models/categoryModel.js';
import AppError from '../utils/AppError.js';
const getAllProducts = async ({ page = 1, limit = 10 } = {}) => {
  const skip = (page - 1) * limit;

  // Fetch products with category info
  const products = await Product.find({ status: 'active' })
    .populate({
      path: 'categoryId',
      model: Category,
      match: { isDeleted: false },
      select: 'name',
    })
    .skip(skip)
    .limit(limit)
    .lean();

  // Fetch total count for pagination
  const totalCount = await Product.countDocuments({ status: 'active' });

  // Fetch inventory data for the products
  const productIds = products.map(p => p._id);
  const inventories = await Inventory.find({
    productId: { $in: productIds },
    status: 'active',
  }).lean();

  // Map inventory to product
  const inventoryMap = {};
  inventories.forEach(inv => {
    inventoryMap[inv.productId.toString()] = inv;
  });

  // Merge product and inventory data
  const result = products.map(p => {
    const inv = inventoryMap[p._id.toString()] || {};
    return {
      _id: p._id,
      imageUrl: p.imageUrl || '',
      sku: p.sku,
      name: p.name,
      categoryName: p.categoryId ? p.categoryId.name : '',
      price: p.price ? parseFloat(p.price.toString()) : 0,
      acquisitionPrice: inv.acquisitionPrice
        ? parseFloat(inv.acquisitionPrice.toString())
        : 0,
      quantity: inv.quantity || 0,
      description: p.description || '',
      actions: '',
    };
  });

  return { products: result, totalCount };
};

const searchProduct = async query => {
  if (!query || String(query).trim() === '') return [];

  const q = String(query).trim();
  const regex = new RegExp(q, 'i');

  // Fetch all matches (exact or partial)
  let products = await Product.find({
    status: 'active',
    $or: [{ sku: regex }, { name: regex }],
  }).limit(20);

  // Sort so that exact SKU or name matches come first
  products.sort((a, b) => {
    const exactA = a.sku === q || a.name === q ? 0 : 1;
    const exactB = b.sku === q || b.name === q ? 0 : 1;
    return exactA - exactB;
  });

  return products;
};

const getProductById = async id => {
  return Product.findById(id);
};

const getProductBySKU = async sku => {
  const product = await Product.findOne({ sku: sku, status: 'active' });
  return product;
};

/**
 * Create a new product
 */
const createProduct = async data => {
  const newProduct = await Product.create({
    name: data.name,
    sku: data.sku,
    categoryId: data.categoryId,
    price: data.price,
    lowStockThreshold: data.lowStockThreshold,
    imageUrl: data.imageUrl,
    description: data.description,
    status: data.status,
  });

  return newProduct;
};

/**
 * Update a product by ID
 */
const updateProduct = async (id, updateData) => {
  return Product.findByIdAndUpdate(id, updateData, { new: true });
};

/**
 * Delete a product by ID
 */
const deleteProduct = async id => {
  return await Product.findByIdAndUpdate(
    { _id: id },
    { status: 'deleted' },
    { new: true }
  );
};

const deleteAllProductByCategoryId = async id => {
  const result = await Product.updateMany(
    { categoryId: id, status: 'active' },
    { status: 'deleted' }
  );
  return result; // contains info like matchedCount, modifiedCount
};

const getAllProductsByCategoryId = async categoryId => {
  if (!categoryId) throw new Error('Category ID is required');

  // Fetch all active products under this category
  const products = await Product.find({ categoryId, status: 'active' }).select(
    '_id name sku'
  );

  return products; // returns an array of products
};

export default {
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductBySKU,
  searchProduct,
  getAllProducts,
  deleteAllProductByCategoryId,
  getAllProductsByCategoryId,
};
