import {
  fetchInventorySummary,
  fetchInventoryDetails,
} from './api/inventoryReport.js';

import { fetchInventoryReport } from './api/reportsAPI.js';
import { renderTable } from './utils/table.js';
import { renderCharts } from './utils/inventoryChart.js';
import { generateInventoryPDF } from './utils/pdf.js';

let reportData = {};

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

  const chartsSection = document.querySelector('.charts');
  const tablesSection = document.querySelector('.tables');
  const summaryDiv = document.getElementById('summary-values');
  const refundSummarySection = document
    .querySelector('#refund-summary-table')
    ?.closest('.table-wrapper');

  const today = new Date().toISOString().split('T')[0];
  fromDateInput.value = today;
  toDateInput.value = today;

  const safeText = (val, fallback = 'N/A') =>
    val === null || val === undefined || val === '' ? fallback : val;

  const hideSections = () => {
    if (chartsSection) chartsSection.style.display = 'none';
    if (tablesSection) tablesSection.style.display = 'none';
    if (summaryDiv) summaryDiv.style.display = 'none';
    if (refundSummarySection) refundSummarySection.style.display = 'none';
  };

  const showSections = () => {
    if (chartsSection) chartsSection.style.display = '';
    if (tablesSection) tablesSection.style.display = '';
    if (summaryDiv) summaryDiv.style.display = 'flex';
    if (refundSummarySection) refundSummarySection.style.display = '';
  };

  const safeFetchInventorySummary = async (startDate, endDate) => {
    try {
      return await fetchInventorySummary(startDate, endDate);
    } catch (err) {
      console.error(err);
      tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No products available</td></tr>`;
      return [];
    }
  };

  const safeFetchInventoryDetails = async (productId, startDate, endDate) => {
    try {
      return await fetchInventoryDetails(productId, startDate, endDate);
    } catch (err) {
      console.error(err);
      return { receives: [], solds: [], refunds: [] };
    }
  };

  const safeFetchInventoryReport = async (from, to) => {
    try {
      return await fetchInventoryReport(from, to);
    } catch (err) {
      console.error(err);
      tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No report data available</td></tr>`;
      hideSections();
      return null;
    }
  };

  const renderAllTables = data => {
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

    renderTable(
      '#damaged-table',
      data.damaged,
      ['#', 'name', 'quantity'],
      i => ({
        '#': i.index + 1,
        name: i.name,
        quantity: i.quantity,
      })
    );

    renderTable(
      '#low-stock-table',
      data.lowStock,
      ['#', 'name', 'days'],
      i => ({
        '#': i.index + 1,
        name: i.name,
        days: i.days,
      })
    );

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
  };

  const loadSummary = async () => {
    tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Loading...</td></tr>`;

    const startDate = fromDateInput.value;
    const endDate = toDateInput.value;

    const summary = await safeFetchInventorySummary(startDate, endDate);

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
  };

  const openModal = async (productId, productName, startDate, endDate) => {
    modalProductName.textContent = safeText(productName);

    receivedBody.innerHTML = '';
    soldBody.innerHTML = '';
    returnedBody.innerHTML = '';

    const details = await safeFetchInventoryDetails(
      productId,
      startDate,
      endDate
    );

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
  };

  closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
  window.addEventListener('click', e => {
    if (e.target === modal) modal.classList.add('hidden');
  });

  document
    .querySelectorAll('#report-type, #from-date, #to-date')
    .forEach(filter => {
      filter.addEventListener('change', hideSections);
      filter.addEventListener('input', hideSections);
    });

  document.getElementById('report-type').addEventListener('change', e => {
    const routes = {
      sales: '/reports/sales',
      inventory: '/reports/inventory',
      order: '/reports/order',
    };
    if (routes[e.target.value]) window.location.href = routes[e.target.value];
  });

  // --- GENERATE BUTTON: only summary ---
  generateBtn.addEventListener('click', async () => {
    const inventoryTable = document.getElementById('inventory-table');
    if (inventoryTable) inventoryTable.style.display = '';

    await loadSummary(); // only update main summary table
    hideSections(); // ensure charts/tables stay hidden
  });

  // --- OVERVIEW BUTTON: full report ---
  document
    .getElementById('overview-report')
    .addEventListener('click', async () => {
      const from = fromDateInput.value || today;
      const to = toDateInput.value || today;

      // Hide the main inventory table when overview is clicked
      const inventoryTable = document.getElementById('inventory-table');
      if (inventoryTable) inventoryTable.style.display = 'none';

      // Fetch both report and summary
      const [report, summary] = await Promise.all([
        safeFetchInventoryReport(from, to),
        safeFetchInventorySummary(from, to),
      ]);

      if (report) {
        report.inventorySummary = summary; // <-- merge inventory summary
        reportData = report;
        renderAllTables(reportData);
        renderCharts(reportData, {
          topMovingChartId: 'top-moving-chart',
          lowStockChartId: 'low-stock-chart',
        });
        showSections();
      }
    });

  // --- DOWNLOAD PDF ---
  document
    .getElementById('download-report')
    .addEventListener('click', async () => {
      if (!reportData || !reportData.topSellingBySKU) {
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Generate report first</td></tr>`;
        return;
      }

      const from = fromDateInput.value || today;
      const to = toDateInput.value || today;

      // Ensure inventory summary is present
      if (!reportData.inventorySummary) {
        reportData.inventorySummary = await safeFetchInventorySummary(from, to);
      }

      generateInventoryPDF(reportData, from, to);
    });

  hideSections();
  loadSummary();
});
