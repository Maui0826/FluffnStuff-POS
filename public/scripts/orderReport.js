import { getOrderReport } from '../scripts/api/reportsAPI.js';
import { generateOrderPDF } from '../scripts/utils/orderPdf.js';

// --- DOM Elements ---
const fromDateInput = document.getElementById('from-date');
const toDateInput = document.getElementById('to-date');
const generateBtn = document.getElementById('generate-report');
const downloadBtn = document.getElementById('download-report');
const reportTypeSelect = document.getElementById('report-type');
const pendingTable = document.querySelector('#pending-table tbody');
const cancelledTable = document.querySelector('#cancelled-table tbody');
const tableBody = document.querySelector('#order-report-table tbody');
const summaryDiv = document.getElementById('summary-values');

// --- Set initial dates to today ---
const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
fromDateInput.value = todayStr;
toDateInput.value = todayStr;

// --- Navigate to report page ---
function navigateToReport(reportType) {
  switch (reportType) {
    case 'sales':
      window.location.href = '/reports/sales';
      break;
    case 'inventory':
      window.location.href = '/reports/inventory';
      break;
    case 'order':
      window.location.href = '/reports/order';
      break;
    default:
      console.warn('Unknown report type:', reportType);
  }
}

reportTypeSelect.addEventListener('change', e =>
  navigateToReport(e.target.value)
);

// --- Render report ---
export function renderReport(data) {
  tableBody.innerHTML = '';
  pendingTable.innerHTML = '';
  cancelledTable.innerHTML = '';
  summaryDiv.innerHTML = '';

  // Delivered items
  if (!data.report.length) {
    tableBody.innerHTML = `<tr><td colspan="11" style="text-align:center;font-style:italic;">No records available</td></tr>`;
  } else {
    data.report.forEach(item => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${new Date(item.date).toLocaleDateString()}</td>
        <td>${item.product}</td>
        <td>${item.sku}</td>
        <td>${item.supplier}</td>
        <td>${item.orderedQty}</td>
        <td>${item.deliveredQty}</td>
        <td>₱${item.acquisitionPrice.toFixed(2)}</td>
        <td>₱${item.totalCost.toFixed(2)}</td>
        <td>${item.shortfall}</td>
        <td>${item.overdelivery}</td>
        <td>${item.onTime ? 'Yes' : 'No'}</td>
      `;
      tableBody.appendChild(row);
    });
  }

  // Pending items
  if (!data.pendingItems.length) {
    pendingTable.innerHTML = `<tr><td colspan="5" style="text-align:center;font-style:italic;">No records available</td></tr>`;
  } else {
    data.pendingItems.forEach(item => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${item.productId.name}</td>
        <td>${item.productId.sku}</td>
        <td>${item.supplierName}</td>
        <td>${item.orderQuantity}</td>
        <td>${new Date(item.deliveryDate).toLocaleDateString()}</td>
      `;
      pendingTable.appendChild(row);
    });
  }

  // Cancelled items
  if (!data.cancelledItems.length) {
    cancelledTable.innerHTML = `<tr><td colspan="5" style="text-align:center;font-style:italic;">No records available</td></tr>`;
  } else {
    data.cancelledItems.forEach(item => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${item.productId.name}</td>
        <td>${item.productId.sku}</td>
        <td>${item.supplierName}</td>
        <td>${item.orderQuantity}</td>
        <td>${new Date(item.deliveryDate).toLocaleDateString()}</td>
      `;
      cancelledTable.appendChild(row);
    });
  }

  // Summary metrics
  summaryDiv.innerHTML = `
    <p>Total Delivered Quantity: ${data.summary.totalDeliveredQty}</p>
    <p>Total Acquisition Cost: ₱${data.summary.totalAcquisitionCost.toFixed(
      2
    )}</p>
    <p>Pending Deliveries: ${data.summary.pendingDeliveries}</p>
    <p>Cancelled Deliveries: ${data.summary.cancelledDeliveries}</p>
    <p>On-Time Deliveries: ${data.summary.onTimeDeliveries}</p>
    <p>Late Deliveries: ${data.summary.lateDeliveries}</p>
  `;
}

// --- Generate report ---
generateBtn.addEventListener('click', async () => {
  if (!fromDateInput.value || !toDateInput.value) {
    alert('Please select both From and To dates');
    return;
  }

  const fromDate = new Date(fromDateInput.value + 'T00:00:00'); // start of day
  const toDate = new Date(toDateInput.value + 'T23:59:59'); // end of day

  const data = await getOrderReport(
    fromDate.toISOString(),
    toDate.toISOString()
  );
  if (data) renderReport(data);
});

// --- Download PDF ---
downloadBtn.addEventListener('click', () => {
  generateOrderPDF(fromDateInput.value, toDateInput.value);
});

// --- Auto-generate today's report on page load ---
window.addEventListener('DOMContentLoaded', async () => {
  const fromDate = new Date(todayStr + 'T00:00:00');
  const toDate = new Date(todayStr + 'T23:59:59');
  const data = await getOrderReport(
    fromDate.toISOString(),
    toDate.toISOString()
  );
  if (data) renderReport(data);
});
