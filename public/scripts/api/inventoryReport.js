// API service for inventory
export async function fetchInventorySummary(startDate, endDate) {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);

  const res = await fetch(`/api/v1/inventory/summary?${params.toString()}`);
  const data = await res.json();
  return data.summary || [];
}

export async function fetchInventoryDetails(productId, startDate, endDate) {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);

  const res = await fetch(
    `/api/v1/inventory/details/${productId}?${params.toString()}`
  );
  const data = await res.json();
  return data.details || {};
}
