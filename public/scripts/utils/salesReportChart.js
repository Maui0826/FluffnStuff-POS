let topItemsChart = null;

/**
 * Renders the Top-Selling Items chart
 * @param {HTMLCanvasElement} canvasEl - Chart canvas element
 * @param {Array} data - Top-selling data (SKU or Category)
 * @param {string} type - 'sku' or 'category'
 */
export const renderTopItemsChart = (canvasEl, data, type) => {
  const labels = data.map(d => (type === 'sku' ? d.sku : d.category));
  const quantities = data.map(d => d.quantity);
  const netProfits = data.map(d => d.netProfit);

  if (topItemsChart) topItemsChart.destroy(); // destroy previous chart

  topItemsChart = new window.Chart(canvasEl, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Quantity Sold',
          data: quantities,
          backgroundColor: 'rgba(54, 162, 235, 0.7)',
          yAxisID: 'y1',
        },
        {
          label: 'Net Profit (₱)',
          data: netProfits,
          backgroundColor: 'rgba(255, 99, 132, 0.7)',
          yAxisID: 'y2',
        },
      ],
    },
    options: {
      responsive: true,
      interaction: { mode: 'index', intersect: false },
      scales: {
        y1: {
          type: 'linear',
          position: 'left',
          title: { display: true, text: 'Quantity Sold' },
        },
        y2: {
          type: 'linear',
          position: 'right',
          title: { display: true, text: 'Net Profit (₱)' },
          grid: { drawOnChartArea: false },
        },
      },
    },
  });
};
