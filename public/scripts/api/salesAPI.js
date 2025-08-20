const BASE_URL = import.meta.env.ALLOWED_ORIGINS + '/api/v1/reports';
export const fetchSalesReport = async (fromDate, toDate) => {
  try {
    const response = await fetch(
      `${BASE_URL}/sales?fromDate=${fromDate}&toDate=${toDate}`
    );
    if (!response.ok) {
      throw new Error('Failed to fetch sales report');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};
