import {
  getCategoriesAPI,
  addCategoryAPI,
  updateCategoryAPI,
  deleteCategoryAPI,
} from '../scripts/api/category.js';

document.addEventListener('DOMContentLoaded', () => {
  const categoryList = document.getElementById('category-list');
  const paginationContainer = document.getElementById('pagination');

  let currentPage = 1;
  const itemsPerPage = 10;
  let totalPages = 1;
  let sortAsc = true;
  let categories = [];

  // --- Sorting ---
  document.getElementById('sort-name-btn')?.addEventListener('click', () => {
    sortAsc = !sortAsc;
    fetchCategories(1);
  });

  function sortCategories() {
    categories.sort((a, b) => {
      const nameA = a.name.toUpperCase();
      const nameB = b.name.toUpperCase();
      if (nameA < nameB) return sortAsc ? -1 : 1;
      if (nameA > nameB) return sortAsc ? 1 : -1;
      return 0;
    });
  }

  // --- Fetch categories ---
  async function fetchCategories(page = 1) {
    currentPage = page;
    try {
      const data = await getCategoriesAPI({
        page,
        limit: itemsPerPage,
        sort: sortAsc ? 'asc' : 'desc',
      });
      categories = data.categories;
      totalPages = data.totalPages || 1;
      renderCategories();
      renderPagination();
    } catch (err) {
      alert(err.message);
    }
  }

  // --- Render categories ---
  function renderCategories() {
    categoryList.innerHTML = '';
    if (!categories || categories.length === 0) {
      categoryList.innerHTML = `
        <tr>
          <td colspan="3" style="text-align:center; font-style:italic; color:#666;">
            No categories found.
          </td>
        </tr>
      `;
      return;
    }

    categories.forEach(category => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>
          <span class="category-name">${category.name}</span>
          <input class="edit-name-input" type="text" value="${
            category.name
          }" style="display:none;" />
        </td>
        <td>
          <span class="category-desc">${
            category.description || 'No description'
          }</span>
          <input class="edit-desc-input" type="text" value="${
            category.description || ''
          }" style="display:none;" />
        </td>
      `;
      categoryList.appendChild(row);
    });
  }

  // --- Pagination ---
  function renderPagination() {
    if (!paginationContainer) return;
    let html = '';

    html += `<button ${
      currentPage === 1 ? 'disabled' : ''
    } id="prev-btn">Prev</button>`;

    for (let i = 1; i <= totalPages; i++) {
      html += `<button class="page-btn" ${
        i === currentPage ? 'disabled' : ''
      } data-page="${i}">${i}</button>`;
    }

    html += `<button ${
      currentPage === totalPages ? 'disabled' : ''
    } id="next-btn">Next</button>`;

    paginationContainer.innerHTML = html;

    document.getElementById('prev-btn')?.addEventListener('click', () => {
      if (currentPage > 1) fetchCategories(currentPage - 1);
    });
    document.getElementById('next-btn')?.addEventListener('click', () => {
      if (currentPage < totalPages) fetchCategories(currentPage + 1);
    });
    document.querySelectorAll('.page-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const page = Number(btn.dataset.page);
        fetchCategories(page);
      });
    });
  }

  // --- Initial load ---
  fetchCategories();
});
