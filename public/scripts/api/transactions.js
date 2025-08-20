const BASE_URL = 'https://fluffnstuff-pos.onrender.com/api/v1/refunds';

export const searchReceipt = async receiptNum => {
  const res = await fetch(`${BASE_URL}/${receiptNum}/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Receipt search failed');
  }
  return res.json();
};

export const fetchProducts = async receiptNum => {
  const res = await fetch(`${BASE_URL}/${receiptNum}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Fetching products failed');
  }
  return res.json();
};

export const refundProduct = async payload => {
  const res = await fetch(`${BASE_URL}/${payload.receiptNum}/refund`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Refund failed');
  return data;
};

// api/transactionAPI.js

const API_URL = 'https://fluffnstuff-pos.onrender.com/api/v1';

export const fetchTransactionHistory = async (filters = {}) => {
  try {
    const params = new URLSearchParams(filters);
    const res = await fetch(
      `${API_URL}/transactions/history?${params.toString()}`
    );
    if (!res.ok) throw new Error('Failed to fetch transactions');
    const data = await res.json();
    return data.data || [];
  } catch (err) {
    console.error(err);
    return [];
  }
};

export const fetchUserHistory = async (filters = {}) => {
  try {
    const params = new URLSearchParams(filters);
    const res = await fetch(
      `${API_URL}/transactions/user?${params.toString()}`
    );
    if (!res.ok) throw new Error('Failed to fetch transactions');
    const data = await res.json();
    return data.data || [];
  } catch (err) {
    console.error(err);
    return [];
  }
};

export const deleteTransaction = async id => {
  try {
    const res = await fetch(`${API_URL}/transactions/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete transaction');
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
};
