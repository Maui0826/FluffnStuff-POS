import { getOrderReport } from '../scripts/api/reportsAPI.js';
import { generateOrderPDF } from '../scripts/utils/orderPdf.js'; // import the separate PDF function

// --- DOM Elements ---
const fromDateInput = document.getElementById('from-date');
const toDateInput = document.getElementById('to-date');
const generateBtn = document.getElementById('generate-report');
const downloadBtn = document.getElementById('download-report');
const reportTypeSelect = document.getElementById('report-type');

const tableBody = document.querySelector('#order-report-table tbody');
const summaryDiv = document.getElementById('summary-values');

// --- Navigate to report page based on selection ---
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

// --- Event listener for report type selection ---
reportTypeSelect.addEventListener('change', e =>
  navigateToReport(e.target.value)
);

// --- Render table & summary ---
export function renderReport(data) {
  tableBody.innerHTML = '';
  summaryDiv.innerHTML = '';

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

  summaryDiv.innerHTML = `
    <p>Total Delivered Quantity: ${data.summary.totalDeliveredQty}</p>
    <p>Total Acquisition Cost: ₱${data.summary.totalAcquisitionCost.toFixed(
      2
    )}</p>
    <p>Pending Deliveries: ${data.summary.pendingDeliveries}</p>
    <p>On-Time Deliveries: ${data.summary.onTimeDeliveries}</p>
    <p>Late Deliveries: ${data.summary.lateDeliveries}</p>
  `;
}

// --- Generate report ---
generateBtn.addEventListener('click', async () => {
  const fromDate = fromDateInput.value;
  const toDate = toDateInput.value;

  if (!fromDate || !toDate) {
    alert('Please select both From and To dates');
    return;
  }

  const data = await getOrderReport(fromDate, toDate);
  if (data) renderReport(data);
});

// --- Download PDF ---
downloadBtn.addEventListener('click', () => {
  generateOrderPDF(
    fromDateInput.value,
    toDateInput.value,
    tableBody,
    summaryDiv
  );
});
