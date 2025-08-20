import { fetchUserHistory } from '../scripts/api/transactions.js';

document.addEventListener('DOMContentLoaded', () => {
  const transactionTable = document.querySelector('#transaction-table tbody');
  const filterDateInput = document.getElementById('filter-date');
  const applyFilterBtn = document.getElementById('apply-filters');
  const resetFilterBtn = document.getElementById('reset-filters');

  async function renderTransactions(filters = {}) {
    const transactions = await fetchUserHistory(filters);
    transactionTable.innerHTML = '';

    if (transactions.length === 0) {
      const row = document.createElement('tr');
      row.innerHTML = `<td colspan="6" style="text-align:center;">No transactions found.</td>`;
      transactionTable.appendChild(row);
      return;
    }

    transactions.forEach(tx => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${new Date(tx.dateTime).toLocaleString()}</td>
        <td>${tx.product}</td>
        <td>₱${parseFloat(tx.price).toFixed(2)}</td>
        <td>${tx.quantity}</td>
      `;
      transactionTable.appendChild(row);
    });
  }

  function applyFilters() {
    const filters = {};
    if (filterDateInput.value) filters.date = filterDateInput.value;
    renderTransactions(filters);
  }

  applyFilterBtn.addEventListener('click', applyFilters);
  resetFilterBtn.addEventListener('click', () => {
    filterDateInput.value = '';
    renderTransactions();
  });

  renderTransactions();
});
