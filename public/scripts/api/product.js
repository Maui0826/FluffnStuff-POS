const API_BASE = '/api/v1/inventory';

async function getAllProductsAPI(params = {}) {
  try {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${API_BASE}?${query}` : API_BASE;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Error fetching products: ${res.statusText}`);
    const json = await res.json();

    // Ensure we return both items and totalCount
    return {
      items: Array.isArray(json.data) ? json.data : [],
      totalCount: json.totalCount || 0,
    };
  } catch (error) {
    console.error(error);
    return { items: [], totalCount: 0 };
  }
}

async function createProductAPI(formData) {
  const res = await fetch(`${API_BASE}/new-product`, {
    method: 'POST',
    body: formData, // FormData required for image upload
  });
  if (!res.ok) throw new Error(`Error creating product: ${res.statusText}`);
  return res.json();
}

async function updateProductAPI(productId, data) {
  const options = { method: 'PATCH' };

  if (data instanceof FormData) {
    options.body = data; // Browser sets Content-Type automatically for FormData
  } else {
    options.headers = { 'Content-Type': 'application/json' };
    options.body = JSON.stringify(data);
  }

  const res = await fetch(`${API_BASE}/${productId}/update`, options);
  if (!res.ok) throw new Error(`Error updating product: ${res.statusText}`);
  return res.json();
}

async function deleteProductAPI(productId) {
  const res = await fetch(`${API_BASE}/${productId}/delete`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(`Error deleting product: ${res.statusText}`);
  return res.json();
}

async function orderStockAPI(orderData) {
  try {
    const res = await fetch(`${API_BASE}/order/`, {
      // endpoint without productId
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData), // expects { supplierName, deliveryDate, products: [...] }
    });

    if (!res.ok) {
      let errorMsg;
      try {
        const error = await res.json();
        errorMsg = error.message || 'Failed to place order';
      } catch {
        errorMsg = `HTTP ${res.status} - ${res.statusText}`;
      }
      throw new Error(errorMsg);
    }

    return await res.json();
  } catch (err) {
    console.error('API orderStockAPI error:', err);
    throw err;
  }
}

export default {
  getAllProductsAPI,
  createProductAPI,
  updateProductAPI,
  deleteProductAPI,
  orderStockAPI,
};
