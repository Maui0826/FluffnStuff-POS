const API_BASE = '/api/v1/inventory';

// Fetch categories with pagination and sorting
export async function getCategoriesAPI({
  page = 1,
  limit = 5,
  sort = 'asc',
} = {}) {
  try {
    const params = new URLSearchParams({ page, limit, sort });
    const res = await fetch(`${API_BASE}/category?${params.toString()}`, {
      method: 'GET',
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch categories');

    return {
      categories: data.data || [],
      page: data.page || 1,
      totalPages: data.totalPages || 1,
      totalItems: data.totalItems || 0,
    };
  } catch (err) {
    throw err;
  }
}

// addCategoryAPI
export const addCategoryAPI = async ({ name, description }) => {
  const res = await fetch(`${API_BASE}/category`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description }), // make sure both are top-level
  });
  if (!res.ok) throw new Error('Failed to add category');
  return res.json();
};

// Update category by ID
export async function updateCategoryAPI(id, { name, description }) {
  try {
    const res = await fetch(`${API_BASE}/category/${id}/update`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description }), // send both fields
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to update category');
    return data;
  } catch (err) {
    throw err;
  }
}

export async function loadCategoriesAPI() {
  try {
    const res = await fetch(`${API_BASE}/load-category`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      throw new Error(
        `Failed to fetch categories: ${res.status} ${res.statusText}`
      );
    }

    const { data } = await res.json(); // assuming your API returns { data: [...] }
    return data || [];
  } catch (err) {
    console.error('Error loading categories:', err);
    return [];
  }
}

// Delete category by ID
export async function deleteCategoryAPI(id) {
  try {
    const res = await fetch(`${API_BASE}/category/${id}/delete`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to delete category');
    return data;
  } catch (err) {
    throw err;
  }
}
