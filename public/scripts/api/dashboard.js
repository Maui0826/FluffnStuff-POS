const API_BASE = 'https://fluffnstuff-pos.onrender.com/api/v1';

export const fetchDashboard = async () => {
  try {
    const res = await fetch(`${API_BASE}/dashboard`);
    if (!res.ok) {
      throw new Error(
        `Failed to fetch dashboard data: ${res.status} ${res.statusText}`
      );
    }
    const data = await res.json();
    if (!data.data) throw new Error('No data returned from API');
    return data.data;
  } catch (err) {
    console.error('Error in fetchDashboard:', err);
    throw err; // re-throw so frontend can handle it
  }
};
