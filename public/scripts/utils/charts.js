document.addEventListener('DOMContentLoaded', () => {
  const totalSalesChart = document.getElementById('totalSalesChart');
  const stockStatusChart = document.getElementById('stockStatusChart');

  // Bar Chart: Total Sales
  new Chart(totalSalesChart, {
    type: 'bar',
    data: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      datasets: [
        {
          label: '₱ Sales',
          data: [1200, 1500, 1100, 1800, 1400],
          backgroundColor: '#8a5a70',
          borderRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: 'Daily Sales',
        },
      },
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  });

  // Doughnut Chart: Stock Status
  new Chart(stockStatusChart, {
    type: 'doughnut',
    data: {
      labels: ['In Stock', 'Low Stock', 'Out of Stock'],
      datasets: [
        {
          data: [80, 15, 5],
          backgroundColor: ['#4caf50', '#ffc107', '#f44336'],
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Stock Status',
        },
        legend: {
          position: 'bottom',
        },
      },
    },
  });
});
