import categoryModel from '../models/categoryModel.js';

const createCategory = async data => {
  const category = await categoryModel.create({
    name: data.name.toLowerCase().trim(),
    description: data.description,
  });
  return category;
};

const categoryById = async id => {
  const category = await categoryModel.findById(id);
  return category;
};

const categoryByName = async name => {
  return categoryModel.findOne({ name, isDeleted: false });
};

const updateCategory = async (id, data) => {
  const category = await categoryModel.findByIdAndUpdate(
    { _id: id, isDeleted: false },
    { name: data.name, description: data.description },
    { new: true }
  );
  return category;
};

const deleteCategory = async id => {
  const category = await categoryModel.findById(id);
  if (!category) return null;

  if (category.isDeleted) return category; // Already deleted

  category.isDeleted = true;
  return category.save();
};

const getAllCategories = async ({ page = 1, limit = 5, sort = 'asc' } = {}) => {
  try {
    page = parseInt(page);
    limit = parseInt(limit);

    const sortOrder = sort === 'asc' ? 1 : -1;

    // Count total non-deleted categories
    const totalItems = await categoryModel.countDocuments({ isDeleted: false });

    // Calculate total pages
    const totalPages = Math.ceil(totalItems / limit);

    // Fetch paginated and sorted categories
    const categories = await categoryModel
      .find({ isDeleted: false })
      .sort({ name: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit);

    return {
      categories,
      page,
      totalPages,
      totalItems,
    };
  } catch (err) {
    throw new Error('Error fetching categories: ' + err.message);
  }
};

const loadCategories = async () => {
  try {
    // Only fetch categories that are not deleted, sorted by name
    const categories = await categoryModel.find({ isDeleted: false }).sort({
      name: 1,
    });
    return categories; // returns an array of category documents
  } catch (err) {
    console.error('Error fetching categories:', err);
    throw err;
  }
};

export default {
  createCategory,
  loadCategories,
  categoryByName,
  categoryById,
  updateCategory,
  getAllCategories,
  deleteCategory,
};
