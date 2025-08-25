import Product from '../models/productModel.js';
import Inventory from '../models/inventoryModel.js';
import Category from '../models/categoryModel.js';
import AppError from '../utils/AppError.js';
import Supplier from '../models/supplierModel.js';

const getAllProducts = async ({
  page = 1,
  limit = 10,
  search = '',
  supplier = '',
} = {}) => {
  const skip = (page - 1) * limit;

  // Base query
  const query = { status: 'active' };

  // Search filter (name or SKU)
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { sku: { $regex: search, $options: 'i' } },
    ];
  }

  // Fetch products with category & supplier populated
  const products = await Product.find(query)
    .populate({
      path: 'categoryId',
      model: Category,
      match: { isDeleted: false },
      select: 'name',
    })
    .populate({
      path: 'supplierId',
      model: Supplier,
      select: 'supplierName',
    })
    .skip(skip)
    .limit(limit)
    .lean();

  // Count for pagination
  const totalCount = await Product.countDocuments(query);

  // Fetch inventory separately
  const productIds = products.map(p => p._id);
  const inventories = await Inventory.find({
    productId: { $in: productIds },
  }).lean();

  // Map inventory to product
  const inventoryMap = {};
  inventories.forEach(inv => {
    inventoryMap[inv.productId.toString()] = inv;
  });

  // Merge product + inventory + supplier
  let result = products.map(p => {
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
      supplierName: p.supplierId ? p.supplierId.supplierName : '',
      actions: '',
    };
  });

  // ✅ Apply supplier filter directly
  if (supplier) {
    result = result.filter(p =>
      p.supplierName.toLowerCase().includes(supplier.toLowerCase())
    );
  }

  return { products: result, totalCount };
};

const searchProduct = async query => {
  if (!query || String(query).trim() === '') return [];

  const q = String(query).trim();
  const regex = new RegExp(q, 'i');

  // Fetch all matching products
  let products = await Product.find({
    status: 'active',
    $or: [{ sku: regex }, { name: regex }],
  }).limit(20);

  // Fetch inventory quantities for these products
  const productIds = products.map(p => p._id);
  const inventories = await Inventory.find({
    productId: { $in: productIds },
  })
    .select('productId quantity')
    .lean();

  const inventoryMap = {};
  inventories.forEach(inv => {
    inventoryMap[inv.productId.toString()] = inv.quantity;
  });

  // Attach quantity to each product
  const productsWithQty = products.map(p => ({
    ...p.toObject(),
    quantity: inventoryMap[p._id.toString()] || 0, // default 0 if not found
  }));

  // Sort exact matches first
  productsWithQty.sort((a, b) => {
    const exactA = a.sku === q || a.name === q ? 0 : 1;
    const exactB = b.sku === q || b.name === q ? 0 : 1;
    return exactA - exactB;
  });

  return productsWithQty;
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
    supplierId: data.supplierId,
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

const getProducts = async () => {
  const prod = await Product.find().select('_id name');
  return prod;
};

export default {
  getProductById,
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductBySKU,
  searchProduct,
  getAllProducts,
  deleteAllProductByCategoryId,
  getAllProductsByCategoryId,
};
