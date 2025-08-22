import { fetchInventoryReport } from './api/reportsAPI.js';
import { renderTable } from './utils/table.js';
import { renderCharts } from './utils/inventoryChart.js';
import { generateInventoryPDF } from './utils/pdf.js';

let reportData = {};

// --- Default Dates ---
const today = new Date().toISOString().split('T')[0];
document.getElementById('from-date').value = today;
document.getElementById('to-date').value = today;

// --- Elements ---
const chartsSection = document.querySelector('.charts');
const tablesSection = document.querySelector('.tables');
const summaryDiv = document.getElementById('summary-values');
const refundSummarySection = document
  .querySelector('#refund-summary-table')
  ?.closest('.table-wrapper');

// ================== HELPERS ==================

// Hide report sections
function hideSections() {
  if (chartsSection) chartsSection.style.display = 'none';
  if (tablesSection) tablesSection.style.display = 'none';
  if (summaryDiv) summaryDiv.style.display = 'none';
  if (refundSummarySection) refundSummarySection.style.display = 'none';
}

// Show report sections
function showSections() {
  if (chartsSection) chartsSection.style.display = '';
  if (tablesSection) tablesSection.style.display = '';
  if (summaryDiv) summaryDiv.style.display = 'flex';
  if (refundSummarySection) refundSummarySection.style.display = '';
}

// Navigate to other report pages
function navigateToReport(reportType) {
  const routes = {
    sales: '/reports/sales',
    inventory: '/reports/inventory',
    order: '/reports/order',
  };
  if (routes[reportType]) {
    window.location.href = routes[reportType];
  } else {
    console.warn('Unknown report type:', reportType);
  }
}

// Render all report tables
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

  // --- Summary ---
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

// ================== EVENT LISTENERS ==================

// Hide sections when filters change
document
  .querySelectorAll('#report-type, #from-date, #to-date')
  .forEach(filter => {
    filter.addEventListener('change', hideSections);
    filter.addEventListener('input', hideSections);
  });

// Report type navigation
document
  .getElementById('report-type')
  .addEventListener('change', e => navigateToReport(e.target.value));

// Generate report
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
      showSections();
    } catch (err) {
      console.error(err);
      alert('Error fetching report data.');
    }
  });

// Download PDF
document.getElementById('download-report').addEventListener('click', () => {
  if (!reportData.topSellingBySKU) {
    return alert('Generate report first!');
  }
  const from = document.getElementById('from-date').value || today;
  const to = document.getElementById('to-date').value || today;
  generateInventoryPDF(reportData, from, to);
});

// Overview report
document
  .getElementById('overview-report')
  .addEventListener('click', async () => {
    const from = document.getElementById('from-date').value || today;
    const to = document.getElementById('to-date').value || today;

    try {
      if (!reportData || Object.keys(reportData).length === 0) {
        reportData = await fetchInventoryReport(from, to);
        renderAllTables(reportData);
        renderCharts(reportData, {
          topMovingChartId: 'top-moving-chart',
          lowStockChartId: 'low-stock-chart',
        });
      }
      showSections();
    } catch (err) {
      console.error(err);
      alert('Error fetching report data.');
    }
  });

// ================== INIT ==================
hideSections(); // hide on page load
