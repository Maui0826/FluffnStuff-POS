import { fetchInventoryReport } from './api/reportsAPI.js';
import { renderTable } from './utils/table.js';
import { renderCharts } from './utils/inventoryChart.js';
import { generateInventoryPDF } from './utils/pdf.js';

let reportData = {};

const today = new Date().toISOString().split('T')[0];
document.getElementById('from-date').value = today;
document.getElementById('to-date').value = today;

// --- Elements ---
const chartsSection = document.querySelector('.charts');
const tablesSection = document.querySelector('.tables');
const summaryDiv = document.getElementById('summary-values');

// --- Hide sections function ---
function hideSections() {
  if (chartsSection) chartsSection.style.display = 'none';
  if (tablesSection) tablesSection.style.display = 'none';
  if (summaryDiv) summaryDiv.style.display = 'none';
}

// --- Show sections function ---
function showSections() {
  if (chartsSection) chartsSection.style.display = '';
  if (tablesSection) tablesSection.style.display = '';
  if (summaryDiv) summaryDiv.style.display = 'flex';
}

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

// --- Hide sections when filters change ---
const filters = document.querySelectorAll('#report-type, #from-date, #to-date');
filters.forEach(filter => {
  filter.addEventListener('change', hideSections);
  filter.addEventListener('input', hideSections); // For date inputs
});

// --- Report Type Navigation ---
const reportTypeSelect = document.getElementById('report-type');
reportTypeSelect.addEventListener('change', e => {
  const selectedType = e.target.value;
  navigateToReport(selectedType);
});

// --- Generate Report ---
document
  .getElementById('generate-report')
  .addEventListener('click', async () => {
    const from = document.getElementById('from-date').value || today;
    const to = document.getElementById('to-date').value || today;

    try {
      reportData = await fetchInventoryReport(from, to);

      renderAllTables(reportData);
      renderCharts(reportData, {
        topMovingChartId: 'top-moving-chart',
        lowStockChartId: 'low-stock-chart',
      });

      showSections(); // Show charts and tables after generation
    } catch (err) {
      console.error(err);
      alert('Error fetching report data.');
    }
  });

// --- Download PDF ---
document.getElementById('download-report').addEventListener('click', () => {
  if (!reportData.topSellingBySKU) return alert('Generate report first!');
  const from = document.getElementById('from-date').value || today;
  const to = document.getElementById('to-date').value || today;
  generateInventoryPDF(reportData, from, to);
});

// --- Render all tables ---
function renderAllTables(data) {
  renderTable(
    '#top-sku-table',
    data.topSellingBySKU,
    ['#', 'sku', 'name', 'quantity', 'cogs'],
    i => ({
      '#': i.index + 1,
      sku: i.sku,
      name: i.name,
      quantity: i.quantity,
      cogs: '₱' + i.cogs.toLocaleString(),
    })
  );

  renderTable(
    '#top-category-table',
    data.topSellingByCategory,
    ['#', 'category', 'quantity', 'cogs'],
    i => ({
      '#': i.index + 1,
      category: i.category,
      quantity: i.quantity,
      cogs: '₱' + i.cogs.toLocaleString(),
    })
  );

  renderTable(
    '#refund-table',
    data.refunds,
    ['#', 'name', 'quantity', 'amount', 'reason'],
    i => ({
      '#': i.index + 1,
      name: i.name,
      quantity: i.quantity,
      amount: '₱' + i.amount.toLocaleString(),
      reason: i.reason,
    })
  );

  renderTable('#damaged-table', data.damaged, ['#', 'name', 'quantity'], i => ({
    '#': i.index + 1,
    name: i.name,
    quantity: i.quantity,
  }));

  renderTable('#low-stock-table', data.lowStock, ['#', 'name', 'days'], i => ({
    '#': i.index + 1,
    name: i.name,
    days: i.days,
  }));

  renderTable(
    '#refund-summary-table',
    data.refundSummary,
    ['#', 'reason', 'quantity', 'totalAmount'],
    i => ({
      '#': i.index + 1,
      reason: i.reason,
      quantity: i.totalQty,
      totalAmount: '₱' + i.totalAmount.toLocaleString(),
    })
  );

  // Render summary
  const totalInventoryValue = Number(
    data.summary?.totalInventoryValue?.$numberDecimal || 0
  );
  const totalQuantitySold = data.summary?.totalQuantitySold || 0;
  const totalRefunds = data.summary?.totalRefunds || 0;

  summaryDiv.innerHTML = `
    <p>Total Inventory Value: ₱${totalInventoryValue.toLocaleString()}</p>
    <p>Total Quantity Sold: ${totalQuantitySold}</p>
    <p>Total Refunds: ₱${totalRefunds.toLocaleString()}</p>
  `;
}
