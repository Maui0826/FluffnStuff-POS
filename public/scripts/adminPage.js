import { fetchDashboard } from '../scripts/api/dashboard.js';

const renderTotalSalesChart = weeklySale => {
  const ctx = document.getElementById('totalSalesChart').getContext('2d');

  // Map full weekday names to short labels
  const daysMap = {
    monday: 'Mon',
    tuesday: 'Tue',
    wednesday: 'Wed',
    thursday: 'Thu',
    friday: 'Fri',
    saturday: 'Sat',
    sunday: 'Sun',
  };

  const weeklyData = weeklySale.weekly; // <-- use weeklySale.weekly
  const labels = Object.keys(weeklyData).map(d => daysMap[d]);
  const dataValues = Object.values(weeklyData);

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: '₱ Sales',
          data: dataValues,
          backgroundColor: '#8a5a70',
          borderRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        title: { display: true, text: 'Daily Sales' },
      },
      scales: { y: { beginAtZero: true } },
    },
  });
};

const renderStockChart = stock => {
  const ctx = document.getElementById('stockStatusChart').getContext('2d');

  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Pending', 'Delivered', 'Cancelled'],
      datasets: [
        {
          data: [stock.pending, stock.delivered, stock.cancelled],
          backgroundColor: ['#fbc02d', '#4caf50', '#f44336'],
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        title: { display: true, text: 'Stock Status' },
        legend: { position: 'bottom' },
      },
    },
  });
};

const renderRecentTransactions = recent => {
  const ul = document.getElementById('recent-transactions');
  ul.innerHTML = recent
    .map(
      tx =>
        `<li>${tx.cashierName} - Items Sold: ${tx.itemQtySold} - ₱${Number(
          tx.totalAmount.$numberDecimal
        ).toFixed(2)}</li>`
    )
    .join('');
};

// Add click handlers to navigate to specific pages
const setupDashboardNavigation = () => {
  const salesCard = document.getElementById('card-sales');
  const stockCard = document.getElementById('card-stock');
  const transactionCard = document.getElementById('card-transactions');
  const orderSummaryCard = document.getElementById('card-orders');

  if (salesCard)
    salesCard.addEventListener('click', () => {
      window.location.href = '../reports/sales';
    });

  if (stockCard)
    stockCard.addEventListener('click', () => {
      window.location.href = '../inventory';
    });

  if (transactionCard)
    transactionCard.addEventListener('click', () => {
      window.location.href = '../transactions';
    });

  if (orderSummaryCard)
    orderSummaryCard.addEventListener('click', () => {
      window.location.href = '../supplies';
    });
};

const renderOrderSummary = orders => {
  const ul = document.getElementById('order-summary');
  ul.innerHTML = `
    <li>Pending: ${orders.pending.count} (Ordered: ${orders.pending.totalOrdered}, Delivered: ${orders.pending.totalDelivered})</li>
    <li>Delivered: ${orders.delivered.count} (Ordered: ${orders.delivered.totalOrdered}, Delivered: ${orders.delivered.totalDelivered})</li>
    <li>Cancelled: ${orders.cancelled.count} (Ordered: ${orders.cancelled.totalOrdered}, Delivered: ${orders.cancelled.totalDelivered})</li>
  `;
};

const initDashboard = async () => {
  try {
    const data = await fetchDashboard(); // fetchDashboard returns data.data already
    renderTotalSalesChart(data.weeklySale);
    renderStockChart(data.stock);
    renderRecentTransactions(data.recent);
    renderOrderSummary(data.orders);
  } catch (err) {
    console.error('Error loading dashboard:', err);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  initDashboard();
  setupDashboardNavigation();
});
