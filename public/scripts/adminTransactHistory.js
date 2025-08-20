import {
  fetchTransactionHistory,
  deleteTransaction,
} from '../scripts/api/transactions.js';

document.addEventListener('DOMContentLoaded', () => {
  const transactionTable = document.querySelector('#transaction-table tbody');
  const filterDateInput = document.getElementById('filter-date');
  const filterUserInput = document.getElementById('filter-user');
  const applyFilterBtn = document.getElementById('apply-filters');
  const resetFilterBtn = document.getElementById('reset-filters');

  async function renderTransactions(filters = {}) {
    const transactions = await fetchTransactionHistory(filters);
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
        <td>${tx.addedBy}</td>
        <td>₱${parseFloat(tx.price).toFixed(2)}</td>
        <td>${tx.quantity}</td>
        <td>
          <button class="delete-btn" data-id="${tx._id}" title="Delete">
            <i class="fa-solid fa-trash"></i>
          </button>
        </td>
      `;
      transactionTable.appendChild(row);
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const confirmDelete = confirm('Delete this transaction?');
        if (!confirmDelete) return;

        const success = await deleteTransaction(id);
        if (success) {
          alert('Transaction deleted successfully');
          renderTransactions(filters);
        } else {
          alert('Error deleting transaction');
        }
      });
    });
  }

  function applyFilters() {
    const filters = {};
    if (filterDateInput.value) filters.date = filterDateInput.value;
    if (filterUserInput.value) filters.user = filterUserInput.value;
    renderTransactions(filters);
  }

  applyFilterBtn.addEventListener('click', applyFilters);
  resetFilterBtn.addEventListener('click', () => {
    filterDateInput.value = '';
    filterUserInput.value = '';
    renderTransactions();
  });

  renderTransactions();
});
