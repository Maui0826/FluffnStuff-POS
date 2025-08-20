// Create a user

const API_BASE = import.meta.env.ALLOWED_ORIGINS + '/api/v1/manage-users';

export async function createUserAPI(userData) {
  try {
    const res = await fetch('/api/v1/manage-users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to create user');

    return data;
  } catch (err) {
    console.error('Create user API error:', err);
    throw err;
  }
}

// Get all users with defaults
export async function getAllUsersAPI({
  search = '',
  role = 'all',
  sortBy = 'name',
  sortOrder = 'asc',
  page = 1,
  limit = 10,
} = {}) {
  const params = new URLSearchParams({
    search,
    sortBy,
    sortOrder,
    page,
    limit,
  });

  if (role && role !== 'all') {
    params.append('role', role);
  }

  const res = await fetch(`${API_BASE}?${params.toString()}`, {
    method: 'GET',
    credentials: 'include',
  });
  const data = await res.json();

  if (!res.ok) throw new Error(data.message || 'Failed to fetch users');

  // Return total, totalPages, and users
  return {
    users: data.data || [],
    total: data.total || 0,
    totalPages: data.totalPages || 1,
  };
}

// Suspend a user
export async function suspendUserAPI(userId) {
  const res = await fetch(`${API_BASE}/${userId}/suspend`, {
    method: 'POST',
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to suspend user');
  return data;
}

// Ban a user
export async function banUserAPI(userId) {
  const res = await fetch(`${API_BASE}/${userId}/ban`, {
    method: 'POST',
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to ban user');
  return data;
}

// Unban a user
export async function unbanUserAPI(userId) {
  const res = await fetch(`${API_BASE}/${userId}/unban`, {
    method: 'POST',
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to unban user');
  return data;
}

export const updateUserAPI = async (userId, data) => {
  try {
    const res = await axios.put(`${API_BASE}/${userId}`, data, {
      headers: { 'Content-Type': 'application/json' },
    });
    return res.data.user;
  } catch (err) {
    throw new Error(err.response?.data?.error || 'Failed to update user');
  }
};
