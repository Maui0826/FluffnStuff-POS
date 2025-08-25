import { getAllActions, getAllLogs } from '../scripts/api/logsAPI.js';

document.addEventListener('DOMContentLoaded', async () => {
  const tbody = document.getElementById('logs-body');
  const paginationEl = document.getElementById('pagination');
  const nameInput = document.getElementById('search-name');
  const roleSelect = document.getElementById('filter-role');
  const actionSelect = document.getElementById('filter-action');
  const fromDateInput = document.getElementById('from-date');
  const toDateInput = document.getElementById('to-date');
  const filterBtn = document.getElementById('apply-filters');
  const resetBtn = document.getElementById('reset-filters');

  let currentPage = 1;
  const pageSize = 10;
  let totalLogs = 0;

  // Load Actions
  async function loadActions() {
    try {
      const response = await getAllActions();
      const actions = response.data || [];

      actionSelect.innerHTML = `<option value="">All Actions</option>`;
      actions.forEach(action => {
        const option = document.createElement('option');
        option.value = action;
        option.textContent = action;
        actionSelect.appendChild(option);
      });
    } catch (err) {
      console.error('Error fetching actions:', err);
    }
  }

  // Render Logs
  async function renderLogs(filters = {}, page = 1) {
    const response = await getAllLogs(filters, page, pageSize);
    const logs = response.logs || [];
    totalLogs = response.total || logs.length;
    currentPage = page;

    tbody.innerHTML = '';
    if (!logs.length) {
      tbody.innerHTML = `<tr><td colspan="5">No logs found</td></tr>`;
      paginationEl.innerHTML = '';
      return;
    }

    logs.forEach(log => {
      const row = document.createElement('tr');
      const userName = log.user?.name
        ? `${log.user.name.firstName} ${log.user.name.lastName}`
        : 'Unknown';

      row.innerHTML = `
        <td>${new Date(log.timestamp).toLocaleString()}</td>
        <td>${userName}</td>
        <td>${log.user?.role || 'N/A'}</td>
        <td>${log.action}</td>
        <td>${log.description || ''}</td>
      `;
      tbody.appendChild(row);
    });

    renderPagination();
  }

  // Pagination
  function renderPagination() {
    const totalPages = Math.ceil(totalLogs / pageSize);
    if (totalPages <= 1) {
      paginationEl.innerHTML = '';
      return;
    }

    paginationEl.innerHTML = '';
    const prevBtn = document.createElement('button');
    prevBtn.textContent = 'Prev';
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener('click', () => applyFilters(currentPage - 1));
    paginationEl.appendChild(prevBtn);

    const windowSize = 5;
    let start = Math.max(1, currentPage - Math.floor(windowSize / 2));
    let end = Math.min(totalPages, start + windowSize - 1);
    if (end - start < windowSize - 1) {
      start = Math.max(1, end - windowSize + 1);
    }

    for (let i = start; i <= end; i++) {
      const btn = document.createElement('button');
      btn.textContent = i;
      if (i === currentPage) btn.disabled = true;
      btn.addEventListener('click', () => applyFilters(i));
      paginationEl.appendChild(btn);
    }

    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Next';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.addEventListener('click', () => applyFilters(currentPage + 1));
    paginationEl.appendChild(nextBtn);
  }

  // Filters
  function applyFilters(page = 1) {
    const filters = {
      search: nameInput.value.trim() || '',
      role: roleSelect.value || '',
      actions: actionSelect.value ? [actionSelect.value] : [],
      startDate: fromDateInput.value || null,
      endDate: toDateInput.value || null,
    };
    renderLogs(filters, page);
  }

  // Events
  filterBtn.addEventListener('click', () => applyFilters());
  nameInput.addEventListener('input', () => applyFilters());
  roleSelect.addEventListener('change', () => applyFilters());
  actionSelect.addEventListener('change', () => applyFilters());
  fromDateInput.addEventListener('change', () => applyFilters());
  toDateInput.addEventListener('change', () => applyFilters());

  // Reset Filters
  resetBtn.addEventListener('click', () => {
    nameInput.value = '';
    roleSelect.value = '';
    actionSelect.value = '';
    fromDateInput.value = '';
    toDateInput.value = '';

    renderLogs({}, 1); // show all logs again
  });
  // Init
  await loadActions();
  renderLogs();
});
