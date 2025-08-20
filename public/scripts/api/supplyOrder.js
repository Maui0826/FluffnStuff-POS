// scripts/api/orderAPI.js
const API_BASE = 'https://fluffnstuff-pos.onrender.com/api/v1/supplies'; // adjust if your endpoint is different

const orderAPI = {
  // Fetch all stock orders with optional filters
  getAllOrders: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      for (const key in filters) {
        if (filters[key]) params.append(key, filters[key]);
      }

      const res = await fetch(`${API_BASE}/orders?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch orders');

      // Return the full response, not just data.data
      return data; // contains { status, count, total, data }
    } catch (err) {
      console.error('getAllOrders error:', err);
      throw err;
    }
  },

  // Update stock status (delivered or cancelled)
  updateStatus: async (id, status, deliveredQuantity) => {
    try {
      const body = { status };
      if (status === 'delivered') body.deliveredQuantity = deliveredQuantity;

      const res = await fetch(`${API_BASE}/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update status');
      return data.data;
    } catch (err) {
      console.error('updateStatus error:', err);
      throw err;
    }
  },
};

export default orderAPI;
