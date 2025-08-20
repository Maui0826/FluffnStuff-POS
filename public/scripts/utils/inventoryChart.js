// charts.js
let topMovingChart = null;
let lowStockChart = null;

export function renderCharts(data, { topMovingChartId, lowStockChartId }) {
  const topCtx = document.getElementById(topMovingChartId);
  const lowCtx = document.getElementById(lowStockChartId);

  if (!topCtx || !lowCtx) {
    console.warn('Chart canvas not found. Check the element IDs.');
    return;
  }

  // Destroy previous charts if they exist
  if (topMovingChart) topMovingChart.destroy();
  if (lowStockChart) lowStockChart.destroy();

  // Top Moving Items Chart
  topMovingChart = new Chart(topCtx, {
    type: 'bar',
    data: {
      labels: data.topSellingBySKU.map(i => i.name),
      datasets: [
        {
          label: 'Quantity Sold',
          data: data.topSellingBySKU.map(i => i.quantity),
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
        },
      ],
    },
    options: { responsive: true },
  });

  // Low Stock Duration Chart
  lowStockChart = new Chart(lowCtx, {
    type: 'bar',
    data: {
      labels: data.lowStock.map(i => i.name),
      datasets: [
        {
          label: 'Days Below Threshold',
          data: data.lowStock.map(i => i.days),
          backgroundColor: 'rgba(255, 99, 132, 0.6)',
        },
      ],
    },
    options: { responsive: true },
  });
}
