export const validateProducts = products => {
  const errors = [];

  if (!Array.isArray(products) || products.length === 0) {
    return { valid: false, errors: ['Products array is empty or invalid'] };
  }

  products.forEach((product, index) => {
    if (product.quantity == null || isNaN(product.quantity)) {
      errors.push(`Product at index ${index} is missing a valid quantity`);
    }
    if (product.price == null || isNaN(product.price)) {
      errors.push(`Product at index ${index} is missing a valid price`);
    }
  });

  return { valid: errors.length === 0, errors };
};
