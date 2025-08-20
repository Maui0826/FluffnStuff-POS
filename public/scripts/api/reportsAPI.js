const BASE_URL = '/api/v1/reports';

export const fetchReportData = async (type, fromDate, toDate, specificDate) => {
  const params = new URLSearchParams();
  if (type) params.append('type', type);
  if (fromDate) params.append('fromDate', fromDate);
  if (toDate) params.append('toDate', toDate);
  if (specificDate) params.append('specificDate', specificDate);

  const res = await fetch(`${BASE_URL}?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch report data');
  return await res.json();
};

export const downloadReportPDF = (type, fromDate, toDate, specificDate) => {
  const params = new URLSearchParams();
  if (type) params.append('type', type);
  if (fromDate) params.append('fromDate', fromDate);
  if (toDate) params.append('toDate', toDate);
  if (specificDate) params.append('specificDate', specificDate);

  const url = `${BASE_URL}/pdf?${params.toString()}`;
  window.open(url, '_blank'); // opens the PDF in a new tab
};

export async function fetchInventoryReport(from, to) {
  const res = await fetch(`${BASE_URL}/inventory?from=${from}&to=${to}`);
  if (!res.ok) throw new Error('Failed to fetch inventory report');
  return res.json();
}

export async function getOrderReport(fromDate, toDate) {
  try {
    const response = await fetch(
      `${BASE_URL}/order?from=${fromDate}&to=${toDate}`
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (err) {
    console.error('Error fetching order report:', err);
    return null;
  }
}
