// scripts/api/posAPI.js

const BASE_URL = import.meta.env.ALLOWED_ORIGINS + '/api/v1';
/**
 * Search products by SKU or name
 */
export async function searchProduct(query) {
  if (!query || !query.trim()) return [];

  try {
    const res = await fetch(`${BASE_URL}/point-of-sale/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ search: query }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Search failed');

    return data.data;
  } catch (err) {
    console.error(err);
    return [];
  }
}

/**
 * Create a transaction
 */
export async function createTransaction(transactionData) {
  try {
    const res = await fetch(`${BASE_URL}/point-of-sale/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transactionData),
    });
    if (!res.ok) throw new Error('Transaction failed');
    return await res.json();
  } catch (err) {
    console.error(err);
    return null;
  }
}
/**
 * Refund a product
 */
export async function refundProduct(refundData) {
  try {
    const res = await fetch(`${BASE_URL}/point-of-sale/refund`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(refundData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Refund failed');
    return data.data;
  } catch (err) {
    console.error(err);
    return null;
  }
}
