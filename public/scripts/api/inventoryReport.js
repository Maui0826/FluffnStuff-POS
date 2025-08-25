// API service for inventory

const BASE_URL = '/api/v1/inventory';
export async function fetchInventorySummary(startDate, endDate) {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);

  const res = await fetch(`${BASE_URL}/summary?${params.toString()}`);
  const data = await res.json();
  return data.summary || [];
}

export async function fetchInventoryReport(from, to) {
  const res = await fetch(`${BASE_URL}/reports?from=${from}&to=${to}`);
  if (!res.ok) throw new Error('Failed to fetch inventory report');
  return res.json();
}

export async function fetchInventoryDetails(productId, startDate, endDate) {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);

  const res = await fetch(
    `${BASE_URL}/details/${productId}?${params.toString()}`
  );
  const data = await res.json();
  return data.details || {};
}
