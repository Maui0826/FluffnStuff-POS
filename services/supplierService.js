import Supplier from '../models/supplierModel.js';
import AppError from '../utils/AppError.js';

const findSupplierByName = async name => {
  name = name.trim(); // remove leading/trailing spaces

  const supplier = await Supplier.findOne({
    supplierName: { $regex: `^${name}$`, $options: 'i' }, // case-insensitive
  });

  return supplier; // returns null if not found
};

const createSupplier = async (id, name) => {
  const supplier = await Supplier.create({
    productId: id,
    supplierName: name,
  });
  return supplier;
};

export default {
  createSupplier,
  findSupplierByName,
};
