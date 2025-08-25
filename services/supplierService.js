import Supplier from '../models/supplierModel.js';
import AppError from '../utils/AppError.js';

const findSupplierByName = async name => {
  name = name.trim(); // remove leading/trailing spaces

  const supplier = await Supplier.findOne({
    supplierName: { $regex: `^${name}$`, $options: 'i' }, // case-insensitive
  });

  return supplier; // returns null if not found
};
const findSupplierById = async id => {
  const supplier = await Supplier.findById(id);
  return supplier;
};

const createSupplier = async name => {
  const supplier = await Supplier.create({
    supplierName: name.toLowerCase().trim(),
  });
  return supplier;
};

export default {
  createSupplier,
  findSupplierByName,
  findSupplierById,
};
