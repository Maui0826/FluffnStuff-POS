import { fetchSalesReport } from '../scripts/api/salesAPI.js';
import { generateSalesReportPDF } from '../scripts/utils/salesReportPrint.js';
import { renderTopItemsChart } from '../scripts/utils/salesReportChart.js';

const reportTypeSelect = document.getElementById('report-type');

const generateBtn = document.getElementById('generate-report');
const downloadBtn = document.getElementById('download-report');
const fromDateInput = document.getElementById('from-date');
const toDateInput = document.getElementById('to-date');
const topSellingSelect = document.getElementById('top-selling-type');

const volumeSalesEl = document.getElementById('volume-sales');
const grossSalesEl = document.getElementById('gross-sales');
const netProfitEl = document.getElementById('net-profit');
const topItemsChartEl = document.getElementById('top-items-chart');

const totalRevenueEl = document.getElementById('total-revenue');
const totalVATEl = document.getElementById('total-vat');

const totalDiscountEl = document.getElementById('total-discount');

let currentReportData = null;

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

generateBtn.addEventListener('click', async () => {
  const fromDate = fromDateInput.value;
  const toDate = toDateInput.value;

  if (!fromDate || !toDate) {
    alert('Please select both From and To dates.');
    return;
  }

  try {
    currentReportData = await fetchSalesReport(fromDate, toDate);
    alert('Sales report fetched successfully!');
    renderSalesOverview();
    renderTopItems();
    renderDailyBreakdown(); // 👈 add this
  } catch (error) {
    console.error(error);
    alert('Failed to fetch sales report.');
  }
});

downloadBtn.addEventListener('click', () => {
  if (!currentReportData) {
    alert('Please generate the report first.');
    return;
  }

  // Prepare the latest sales overview data
  const salesOverviewData = {
    volume: currentReportData.volume,
    grossSales: currentReportData.grossSales,
    netProfit: currentReportData.netProfit,
    totalRevenue: currentReportData.totalRevenue,
    totalVAT: currentReportData.totalVAT,
    totalDiscount: currentReportData.totalDiscount,
    topSellingBySKU: currentReportData.topSellingBySKU,
    topSellingByCategory: currentReportData.topSellingByCategory,
    dailyBreakdown: currentReportData.dailyBreakdown,
    transactionBreakdown: currentReportData.transactionBreakdown,
  };

  generateSalesReportPDF(
    salesOverviewData,
    fromDateInput.value,
    toDateInput.value
  );
});

topSellingSelect.addEventListener('change', () => {
  if (currentReportData) renderTopItems();
});

function renderSalesOverview() {
  document.getElementById('sales-stats').classList.remove('hidden');

  volumeSalesEl.textContent = currentReportData.volume;
  grossSalesEl.textContent = `₱${Number(
    currentReportData.grossSales
  ).toLocaleString()}`;
  netProfitEl.textContent = `₱${Number(
    currentReportData.netProfit
  ).toLocaleString()}`;
  totalRevenueEl.textContent = `₱${Number(
    currentReportData.totalRevenue
  ).toLocaleString()}`;
  totalVATEl.textContent = `₱${Number(
    currentReportData.totalVAT
  ).toLocaleString()}`;
  totalDiscountEl.textContent = `₱${Number(
    currentReportData.totalDiscount
  ).toLocaleString()}`;
}
function renderTopItems() {
  const type = topSellingSelect.value; // 'sku' or 'category'
  const data =
    type === 'sku'
      ? currentReportData.topSellingBySKU
      : currentReportData.topSellingByCategory;

  renderTopItemsChart(topItemsChartEl, data, type);
}

function renderDailyBreakdown() {
  const table = document.getElementById('report-table');
  const thead = table.querySelector('thead');
  const tbody = table.querySelector('tbody');

  if (!currentReportData.dailyBreakdown?.length) {
    thead.innerHTML = '';
    tbody.innerHTML = '<tr><td colspan="6">No transactions found.</td></tr>';
    return;
  }

  thead.innerHTML = `
    <tr>
      <th>Date</th>
      <th>Transactions</th>
      <th>Gross Sales</th>
      <th>Total Revenue</th>
      <th>VAT</th>
      <th>Discounts</th>
    </tr>
  `;

  tbody.innerHTML = currentReportData.dailyBreakdown
    .map(
      d => `
      <tr>
        <td>${d.date}</td>
        <td>${d.transactions}</td>
        <td>₱${Number(d.grossSales).toLocaleString()}</td>
        <td>₱${Number(d.totalRevenue).toLocaleString()}</td>
        <td>₱${Number(d.totalVAT).toLocaleString()}</td>
        <td>₱${Number(d.totalDiscount).toLocaleString()}</td>
      </tr>
    `
    )
    .join('');
}
