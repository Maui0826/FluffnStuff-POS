import {
  fetchUserHistory,
  fetchTransactionById,
} from '../scripts/api/transactions.js';

document.addEventListener('DOMContentLoaded', () => {
  const transactionTable = document.querySelector('#transaction-table tbody');
  const filterFromDate = document.getElementById('filter-from-date');
  const filterToDate = document.getElementById('filter-to-date');
  const filterReceiptInput = document.getElementById('filter-receipt');
  const applyFilterBtn = document.getElementById('apply-filters');
  const resetFilterBtn = document.getElementById('reset-filters');

  // Pagination
  let currentPage = 1;
  const pageSize = 10;
  let allTransactions = [];

  const paginationContainer = document.createElement('div');
  paginationContainer.classList.add('pagination-container');
  const paginationWrapper = document.createElement('div');
  paginationWrapper.classList.add('pagination');
  paginationContainer.appendChild(paginationWrapper);
  const tableWrapper = document.getElementById('transaction-table');
  tableWrapper.insertAdjacentElement('afterend', paginationContainer);

  // Set default dates to today
  const today = new Date().toISOString().split('T')[0];
  filterFromDate.value = today;
  filterToDate.value = today;

  async function renderTransactions(filters = {}) {
    allTransactions = await fetchUserHistory(filters);
    renderPage();
  }

  function renderPage() {
    transactionTable.innerHTML = '';

    if (!allTransactions.length) {
      const row = document.createElement('tr');
      row.innerHTML = `<td colspan="6" style="text-align:center;">No transactions found.</td>`;
      transactionTable.appendChild(row);
      paginationWrapper.innerHTML = '';
      return;
    }

    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    const paginatedTransactions = allTransactions.slice(start, end);

    paginatedTransactions.forEach(tx => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${new Date(tx.dateTime).toLocaleString()}</td>
        <td>${tx.receiptNum}</td>
        <td>${tx.product}</td>
        <td>₱${parseFloat(tx.price).toFixed(2)}</td>
        <td>${tx.quantity}</td>
        <td>
          <button class="print-btn" data-id="${tx._id}" title="Print Receipt">
            <i class="fa-solid fa-print"></i>
          </button>
        </td>
      `;
      transactionTable.appendChild(row);
    });

    renderPaginationControls();

    // Print button
    document.querySelectorAll('.print-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const res = await fetchTransactionById(id);
        if (!res || !res.transaction) return alert('Transaction not found');
        const tx = res.transaction;

        const itemsHTML = tx.items
          .map(
            item =>
              `${item.productName.padEnd(15)} ${item.quantity
                .toString()
                .padEnd(3)} ₱${parseFloat(item.totalAmount).toFixed(2)}`
          )
          .join('<br>');

        const receiptWindow = window.open('', '_blank', 'width=300,height=500');
        receiptWindow.document.write(`
<html>
<head>
  <title>Receipt</title>
  <style>
    body { font-family: monospace; font-size: 12px; padding: 5px; width: 58mm; }
    .center { text-align: center; }
    .line { border-bottom: 1px dashed #000; margin: 4px 0; }
    .bold { font-weight: bold; }
    .items { margin-bottom: 5px; }
  </style>
</head>
<body>
  <div class="center bold">
    DA Constance Fluff 'N Stuff<br>
    Pet Supplies Store<br>
    Address: Pasig City, Metro Manila<br>
    Business Email: srjdee@gmail.com<br>
    Transaction #: ${tx.receiptNum}<br>
    DATE: ${new Date(tx.createdAt).toLocaleString()}
  </div>

  <div class="line"></div>
  <div class="items">
    <strong>Item             QTY   TOTAL</strong><br>
    ${itemsHTML}
  </div>

  <div class="line"></div>

  <div>Total Qty:       ${tx.totalQty}</div>
  <div>Gross Amount:    ₱${parseFloat(tx.grossAmount.$numberDecimal).toFixed(
    2
  )}</div>
  <div>Vatable Amount:  ₱${parseFloat(tx.vatableAmount.$numberDecimal).toFixed(
    2
  )}</div>
  <div>VAT-Exempt Sales:₱${parseFloat(tx.vatExemptSales.$numberDecimal).toFixed(
    2
  )}</div>
  <div>VAT Zero-Rate Sales:₱0.00</div>
  <div>12% VAT:         ₱${parseFloat(tx.vatAmount.$numberDecimal).toFixed(
    2
  )}</div>

  <div class="line"></div>
  <div>Bill Amount:     ₱${parseFloat(tx.totalAmount.$numberDecimal).toFixed(
    2
  )}</div>
  <div>Cash:            ₱${parseFloat(tx.cash.$numberDecimal).toFixed(2)}</div>
  <div>Change:          ₱${parseFloat(tx.change.$numberDecimal).toFixed(
    2
  )}</div>
  <div>Discount:        ₱${parseFloat(tx.totalDiscount.$numberDecimal).toFixed(
    2
  )}</div>

  <div class="line"></div>
  <div class="center">
    Thank you for your purchase!<br>
    Visit us again!
  </div>
  <script>window.print();</script>
</body>
</html>
`);
      });
    });
  }

  function renderPaginationControls() {
    paginationWrapper.innerHTML = '';
    const totalPages = Math.ceil(allTransactions.length / pageSize);
    if (totalPages <= 1) return;

    const prevBtn = document.createElement('button');
    prevBtn.textContent = 'Prev';
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        renderPage();
      }
    });
    paginationWrapper.appendChild(prevBtn);

    for (let i = 1; i <= totalPages; i++) {
      const pageBtn = document.createElement('button');
      pageBtn.textContent = i;
      if (i === currentPage) pageBtn.classList.add('active');
      pageBtn.addEventListener('click', () => {
        currentPage = i;
        renderPage();
      });
      paginationWrapper.appendChild(pageBtn);
    }

    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Next';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.addEventListener('click', () => {
      if (currentPage < totalPages) {
        currentPage++;
        renderPage();
      }
    });
    paginationWrapper.appendChild(nextBtn);
  }

  function applyFilters() {
    const filters = {};
    if (filterFromDate.value) filters.fromDate = filterFromDate.value;
    if (filterToDate.value) filters.toDate = filterToDate.value;
    if (filterReceiptInput.value.trim())
      filters.receipt = filterReceiptInput.value.trim();

    currentPage = 1;
    renderTransactions(filters);
  }

  applyFilterBtn.addEventListener('click', applyFilters);

  resetFilterBtn.addEventListener('click', () => {
    filterFromDate.value = today;
    filterToDate.value = today;
    filterReceiptInput.value = '';
    currentPage = 1;
    renderTransactions();
  });

  renderTransactions({
    fromDate: today,
    toDate: today,
  });
  applyFilters(); // initial render
});
