// api/logsAPI.js

const API_BASE = import.meta.env.ALLOWED_ORIGINS + '/api/v1';
export const getAllLogs = async (filters = {}, page = 1, limit = 10) => {
  const params = new URLSearchParams();

  // add filters if they exist
  if (filters.search) params.append('search', filters.search);
  if (filters.role) params.append('role', filters.role);
  if (filters.actions && filters.actions.length > 0) {
    filters.actions.forEach(action => params.append('actions', action));
  }
  if (filters.startDate) params.append('startDate', filters.startDate);

  // pagination
  params.append('page', page);
  params.append('limit', limit);

  const res = await fetch(`${API_BASE}/user-actions?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch logs');

  const data = await res.json();
  return {
    logs: data.data,
    total: data.total,
    page: data.page,
    totalPages: data.totalPages,
  };
};

export const getAllActions = async () => {
  const res = await fetch(`${API_BASE}/user-actions/actions`);
  if (!res.ok) throw new Error('Failed to fetch actions');
  const data = await res.json();
  return data; // { status, data: [...] }
};
