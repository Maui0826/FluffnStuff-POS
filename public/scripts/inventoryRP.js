import {
  fetchInventorySummary,
  fetchInventoryDetails,
} from './api/inventoryReport.js';

document.addEventListener('DOMContentLoaded', () => {
  const tableBody = document.getElementById('inventory-body');
  const modal = document.getElementById('product-modal');
  const closeBtn = modal.querySelector('.close-btn');
  const modalProductName = document.getElementById('modal-product-name');

  const receivedBody = document.getElementById('received-body');
  const soldBody = document.getElementById('sold-body');
  const returnedBody = document.getElementById('returned-body');

  const fromDateInput = document.getElementById('from-date');
  const toDateInput = document.getElementById('to-date');
  const generateBtn = document.getElementById('generate-report');

  // ✅ Helper to safely display values
  const safeText = (val, fallback = 'N/A') =>
    val === null || val === undefined || val === '' ? fallback : val;

  // ✅ Set default dates (today)
  const today = new Date().toISOString().split('T')[0]; // format: yyyy-mm-dd
  fromDateInput.value = today;
  toDateInput.value = today;

  // ✅ Load summary (with optional date filters)
  async function loadSummary() {
    tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Loading...</td></tr>`;

    const startDate = fromDateInput.value;
    const endDate = toDateInput.value;

    const summary = await fetchInventorySummary(startDate, endDate);

    tableBody.innerHTML = '';

    if (!summary.length) {
      tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No products found</td></tr>`;
      return;
    }

    summary.forEach(item => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${safeText(item.productName)}</td>
        <td>${safeText(item.qtyReceived)}</td>
        <td>${safeText(item.qtySold)}</td>
        <td>${safeText(item.qtyDamaged)}</td>
        <td>${safeText(item.qtyOnHand)}</td>
      `;
      tr.addEventListener('click', () =>
        openModal(item.productId, item.productName, startDate, endDate)
      );
      tableBody.appendChild(tr);
    });
  }

  // ✅ Open product details modal
  async function openModal(productId, productName, startDate, endDate) {
    modalProductName.textContent = safeText(productName);

    // Clear old data
    receivedBody.innerHTML = '';
    soldBody.innerHTML = '';
    returnedBody.innerHTML = '';

    // Fetch details
    const details = await fetchInventoryDetails(productId, startDate, endDate);

    // Fill received table
    if (!details.receives.length) {
      receivedBody.innerHTML = `<tr><td colspan="3" style="text-align:center;">No receive records</td></tr>`;
    } else {
      details.receives.forEach(rec => {
        const row = `<tr>
          <td>${safeText(rec.product)}</td>
          <td>${safeText(new Date(rec.dateReceived).toLocaleDateString())}</td>
          <td>${safeText(rec.qtyReceived)}</td>
        </tr>`;
        receivedBody.insertAdjacentHTML('beforeend', row);
      });
    }

    // Fill sold table
    if (!details.solds.length) {
      soldBody.innerHTML = `<tr><td colspan="3" style="text-align:center;">No sales records</td></tr>`;
    } else {
      details.solds.forEach(s => {
        const row = `<tr>
          <td>${safeText(new Date(s.dateSold).toLocaleDateString())}</td>
          <td>${safeText(s.qtySold)}</td>
          <td>${safeText(s.totalAmount?.toFixed?.(2))}</td>
        </tr>`;
        soldBody.insertAdjacentHTML('beforeend', row);
      });
    }

    // Fill returned table
    if (!details.refunds.length) {
      returnedBody.innerHTML = `<tr><td colspan="4" style="text-align:center;">No return/damage records</td></tr>`;
    } else {
      details.refunds.forEach(r => {
        const row = `<tr>
          <td>${safeText(r.product)}</td>
          <td>${safeText(new Date(r.dateReturned).toLocaleDateString())}</td>
          <td>${safeText(r.qtyReturned)}</td>
          <td>${safeText(r.reason)}</td>
        </tr>`;
        returnedBody.insertAdjacentHTML('beforeend', row);
      });
    }

    modal.classList.remove('hidden');
  }

  // Close modal
  closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
  window.addEventListener('click', e => {
    if (e.target === modal) modal.classList.add('hidden');
  });

  // ✅ Wire up "Generate" button
  generateBtn.addEventListener('click', loadSummary);

  // ✅ Load initial report
  loadSummary();
});
