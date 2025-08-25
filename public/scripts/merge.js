import {
  fetchInventorySummary,
  fetchInventoryDetails,
  fetchInventoryReport,
} from './api/inventoryReport.js';

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
  const summaryDiv = document.getElementById('summary-values');

  // NEW TABLE SECTIONS
  const ordersTable = document.getElementById('orders-overview-table');
  const refundSummaryTable = document.getElementById(
    'refundsummary-overview-table'
  );
  const refundsTable = document.getElementById('refunds-overview-table');
  const generateBtn = document.getElementById('generate-btn');
  const overviewBtn = document.getElementById('overview-btn');
  const downloadBtn = document.getElementById('download-btn');

  const today = new Date().toISOString().split('T')[0];
  fromDateInput.value = today;
  toDateInput.value = today;

  const safeText = (val, fallback = 'N/A') =>
    val === null || val === undefined || val === '' ? fallback : val;

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

  const safeFetchInventoryReport = async (startDate, endDate) => {
    try {
      return await fetchInventoryReport(startDate, endDate);
    } catch (err) {
      console.error(err);
      return {
        inventorySummary: [],
        orders: [],
        refundSummary: [],
        refunds: [],
      };
    }
  };

  // 🔹 Render inventory table (summary only)
  const renderInventoryTable = (summary, startDate, endDate) => {
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
      <td>${safeText(item.qtyRefunded)}</td>
      <td>${safeText(item.qtyOnHand)}</td
    `;

      tr.addEventListener('click', () =>
        openModal(item.productId, item.productName, startDate, endDate)
      );
      tableBody.appendChild(tr);
    });

    // 🔹 Update summary totals (removed qtyDamaged)
    const totals = summary.reduce(
      (acc, s) => {
        acc.qtySold += Number(s.qtySold || 0);
        acc.qtyRefunded += Number(s.qtyRefunded || 0);
        return acc;
      },
      { qtySold: 0, qtyRefunded: 0 }
    );

    summaryDiv.innerHTML = `
    <p>Total Quantity Sold: ${totals.qtySold}</p>
    <p>Total Refunded: ${totals.qtyRefunded}</p>
  `;
  };

  // 🔹 Load summary & extra sections
  const loadSummary = async () => {
    tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Loading...</td></tr>`;

    const startDate = fromDateInput.value;
    const endDate = toDateInput.value;

    // fetch summary separately
    const summary = await safeFetchInventorySummary(startDate, endDate);

    // fetch full report for other tables
    const fullReport = await safeFetchInventoryReport(startDate, endDate);

    // clear existing
    summaryDiv.innerHTML = '';
    ordersTable.innerHTML = '';
    refundSummaryTable.innerHTML = '';
    refundsTable.innerHTML = '';

    // render summary totals
    if (summary.length) {
      const totals = summary.reduce(
        (acc, s) => {
          acc.qtySold += Number(s.qtySold || 0);
          acc.qtyRefunded += Number(s.qtyRefunded || 0);
          return acc;
        },
        { qtySold: 0, qtyRefunded: 0 }
      );

      summaryDiv.innerHTML = `
    <p>Total Quantity Sold: ${totals.qtySold}</p>
    <p>Total Refunded: ${totals.qtyRefunded}</p>
  `;
    }

    // render inventory table
    renderInventoryTable(summary, startDate, endDate);

    // --- 📦 Orders ---
    if (fullReport.data?.orders?.length) {
      ordersTable.innerHTML = `
  <thead>
    <tr>
      <th>Product</th>
      <th>Qty Received</th>
      <th>Acquisition Price</th>
      <th>Supplier</th>
      <th>Delivery Date</th>
      <th>Delivered Date</th>
    </tr>
  </thead>
  <tbody>
    ${fullReport.data.orders
      .map(
        o => `<tr>
          <td>${safeText(o.product)}</td>
          <td>${safeText(o.quantityReceived)}</td>
          <td>${safeText(o.acquisitionPrice?.$numberDecimal)}</td>
          <td>${safeText(o.supplier)}</td>
          <td>${safeText(new Date(o.deliveryDate).toLocaleDateString())}</td>
          <td>${safeText(new Date(o.deliveredDate).toLocaleDateString())}</td>
        </tr>`
      )
      .join('')}
  </tbody>`;
    } else {
      ordersTable.innerHTML = `<tr><td colspan="6" style="text-align:center;">No orders</td></tr>`;
    }

    // --- 💰 Refund Summary ---
    if (fullReport.data?.refundSummary?.length) {
      refundSummaryTable.innerHTML = `
  <thead><tr><th>Reason</th><th>Quantity</th><th>Total Amount</th></tr></thead>
  <tbody>
    ${fullReport.data.refundSummary
      .map(
        rs => `<tr>
          <td>${safeText(rs.reason)}</td>
          <td>${safeText(rs.quantity)}</td>
          <td>${safeText(rs.totalAmount)}</td>
        </tr>`
      )
      .join('')}
  </tbody>`;
    } else {
      refundSummaryTable.innerHTML = `<tr><td colspan="3" style="text-align:center;">No refund summary</td></tr>`;
    }

    // --- 📊 Refund Breakdown ---
    if (fullReport.data?.refunds?.length) {
      refundsTable.innerHTML = `
<thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Reason</th><th>Date Refunded</th></tr></thead>
  <tbody>
    ${fullReport.data.refunds
      .map(
        r => `<tr>
          <td>${safeText(r.product)}</td>
          <td>${safeText(r.quantity)}</td>
          <td>${safeText(r.price)}</td>
          <td>${safeText(r.reason)}</td>
          <td>${safeText(new Date(r.refundedAt).toLocaleDateString())}</td>
        </tr>`
      )
      .join('')}
  </tbody>`;
    } else {
      refundsTable.innerHTML = `<tr><td colspan="4" style="text-align:center;">No refunds</td></tr>`;
    }

    // 🔹 Keep both summary + fullReport for PDF
    reportData = { ...fullReport, inventorySummary: summary };
  };

  // 🔹 Modal: product details
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
      receivedBody.innerHTML = `<tr><td colspan="4" style="text-align:center;">No receive records</td></tr>`;
    } else {
      details.receives.forEach(rec => {
        receivedBody.insertAdjacentHTML(
          'beforeend',
          `<tr>
            <td>${safeText(productName)}</td>
            <td>${safeText(
              new Date(rec.deliveryDate).toLocaleDateString()
            )}</td>
            <td>${safeText(
              new Date(rec.dateReceived).toLocaleDateString()
            )}</td>
            <td>${safeText(rec.qtyReceived)}</td>
          </tr>`
        );
      });
    }

    if (!details.solds.length) {
      soldBody.innerHTML = `<tr><td colspan="3" style="text-align:center;">No sales records</td></tr>`;
    } else {
      details.solds.forEach(s => {
        soldBody.insertAdjacentHTML(
          'beforeend',
          `<tr>
            <td>${safeText(new Date(s.dateSold).toLocaleDateString())}</td>
            <td>${safeText(s.qtySold)}</td>
            <td>${safeText(Number(s.totalAmount).toFixed(2))}</td>
          </tr>`
        );
      });
    }

    if (!details.refunds.length) {
      returnedBody.innerHTML = `<tr><td colspan="4" style="text-align:center;">No return/damage records</td></tr>`;
    } else {
      details.refunds.forEach(r => {
        returnedBody.insertAdjacentHTML(
          'beforeend',
          `<tr>
            <td>${safeText(productName)}</td>
            <td>${safeText(new Date(r.dateReturned).toLocaleDateString())}</td>
            <td>${safeText(r.qtyReturned)}</td>
            <td>${safeText(r.reason)}</td>
          </tr>`
        );
      });
    }

    modal.classList.remove('hidden');
  };

  closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
  window.addEventListener('click', e => {
    if (e.target === modal) modal.classList.add('hidden');
  });

  document.getElementById('report-type').addEventListener('change', e => {
    const routes = {
      sales: '/reports/sales',
      inventory: '/reports/inventory',
      order: '/reports/order',
    };
    if (routes[e.target.value]) window.location.href = routes[e.target.value];
  });

  generateBtn.addEventListener('click', async () => {
    document.getElementById('inventory-table').style.display = '';
    document.getElementById('summary-values').style.display = '';
    document.getElementById('report-container').classList.add('hidden');
    await loadSummary();
  });

  overviewBtn.addEventListener('click', async () => {
    const from = fromDateInput.value || today;
    const to = toDateInput.value || today;

    // Hide the "generate" view
    document.getElementById('inventory-table').style.display = 'none';
    document.getElementById('summary-values').style.display = 'none';

    // Fetch full report
    const fullReport = await safeFetchInventoryReport(from, to);

    // Show overview container
    const reportContainer = document.getElementById('report-container');
    reportContainer.classList.remove('hidden');

    // --- 🟢 Inventory Overview ---
    const invTable = document.getElementById('inventory-overview-table');
    if (fullReport.data?.currentInventory?.length) {
      invTable.innerHTML = `
    <thead>
      <tr>
        <th>Product</th>
        <th>On Hand</th>
        <th>Sold</th>
        <th>Damaged</th>
        <th>Expired</th>
        <th>Shrinkage</th>
        <th>Correction</th>
        <th>Restocked</th>
      </tr>
    </thead>
    <tbody>
      ${fullReport.data.currentInventory
        .map(
          item => `
          <tr>
            <td>${safeText(item.product)}</td>
            <td>${safeText(item.onHand)}</td>
            <td>${safeText(item.sold)}</td>
            <td>${safeText(item.damaged)}</td>
            <td>${safeText(item.expired)}</td>
            <td>${safeText(item.shrinkage)}</td>
            <td>${safeText(item.correction)}</td>
            <td>${safeText(item.restocked)}</td>
          </tr>`
        )
        .join('')}
    </tbody>`;
    } else {
      invTable.innerHTML = `<tr><td colspan="8" style="text-align:center;">No inventory records</td></tr>`;
    }

    // --- 📦 Orders ---
    const ordersTable = document.getElementById('orders-overview-table');
    if (fullReport.data?.orders?.length) {
      ordersTable.innerHTML = `
      <thead><tr><th>Product</th><th>Qty Received</th><th>Supplier</th><th>Delivery Date</th><th>Delivered Date</th></tr></thead>
      <tbody>
        ${fullReport.data.orders
          .map(
            o => `<tr>
              <td>${safeText(o.product)}</td>
              <td>${safeText(o.quantityReceived)}</td>
              <td>${safeText(o.supplier)}</td>
              <td>${safeText(
                new Date(o.deliveryDate).toLocaleDateString()
              )}</td>
              <td>${safeText(
                new Date(o.deliveredDate).toLocaleDateString()
              )}</td>
            </tr>`
          )
          .join('')}
      </tbody>`;
    } else {
      ordersTable.innerHTML = `<tr><td colspan="5" style="text-align:center;">No orders</td></tr>`;
    }

    // --- 📊 Refund Summary (Overview) ---
    const refundsSummaryTable = document.getElementById(
      'refundsummary-overview-table'
    );
    if (fullReport.data?.refundSummary?.length) {
      refundsSummaryTable.innerHTML = `
  <thead><tr><th>Reason</th><th>Qty</th><th>Total Refunds</th></tr></thead>
  <tbody>
    ${fullReport.data.refundSummary
      .map(
        r => `<tr>
          <td>${safeText(r.reason)}</td>
          <td>${safeText(r.quantity)}</td>
          <td>${safeText(r.totalAmount)}</td>
        </tr>`
      )
      .join('')}
  </tbody>`;
    } else {
      refundsSummaryTable.innerHTML = `<tr><td colspan="3" style="text-align:center;">No refund summary</td></tr>`;
    }

    // --- 📊 Refund Breakdown (Overview) ---
    const refundsTable = document.getElementById('refunds-overview-table');
    if (fullReport.data?.refunds?.length) {
      refundsTable.innerHTML = `
<thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Reason</th><th>Date Refunded</th></tr></thead>
  <tbody>
    ${fullReport.data.refunds
      .map(
        r => `<tr>
          <td>${safeText(r.product)}</td>
          <td>${safeText(r.quantity)}</td>
          <td>${safeText(r.price)}</td>
          <td>${safeText(r.reason)}</td>
           <td>${safeText(new Date(r.refundedAt).toLocaleDateString())}</td>
        </tr>`
      )
      .join('')}
  </tbody>`;
    } else {
      refundsTable.innerHTML = `<tr><td colspan="4" style="text-align:center;">No refunds</td></tr>`;
    }

    // --- 📌 Overview Totals ---
    const overviewSummaryDiv = document.getElementById(
      'overview-summary-values'
    );
    if (fullReport.data?.summary) {
      overviewSummaryDiv.innerHTML = `
      <p>Total Inventory Value: ${safeText(
        fullReport.data.summary.totalInventoryValue?.$numberDecimal
      )}</p>
      <p>Total Quantity Sold: ${safeText(
        fullReport.data.summary.totalQuantitySold
      )}</p>
      <p>Total Refunds: ${safeText(fullReport.data.summary.totalRefunds)}</p>
    `;
    }

    // Save for PDF
    reportData = fullReport.data;
  });

  downloadBtn.addEventListener('click', async () => {
    const from = fromDateInput.value || today;
    const to = toDateInput.value || today;

    // Fetch full overview report if not loaded
    if (!reportData || !reportData.currentInventory) {
      const fullReport = await safeFetchInventoryReport(from, to);
      reportData = fullReport.data;
    }

    if (
      !reportData ||
      (!reportData.currentInventory?.length &&
        !reportData.orders?.length &&
        !reportData.refundSummary?.length &&
        !reportData.refunds?.length)
    ) {
      tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Generate report first</td></tr>`;
      return;
    }

    // Generate PDF using overview tables
    generateInventoryPDF(reportData, from, to);
  });

  const formatNumber = val => {
    if (!val && val !== 0) return '0';
    if (typeof val === 'object' && val.$numberDecimal) {
      return Number(val.$numberDecimal).toFixed(2);
    }
    return Number(val).toFixed ? Number(val).toFixed(2) : val;
  };
  loadSummary();
});
