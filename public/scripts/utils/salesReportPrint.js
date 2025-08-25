/**
 * Generates a professional sales report PDF
 * @param {Object} reportData - report data from API
 * @param {string} fromDate - from date
 * @param {string} toDate - to date
 */
export const generateSalesReportPDF = async (reportData, fromDate, toDate) => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  let currentY = 60;

  // --- Add Logo from <img> element ---
  const imgEl = document.getElementById('logo'); // <img id="logo" src="logo.png" style="display:none">
  if (imgEl) {
    const canvas = document.createElement('canvas');
    canvas.width = imgEl.width;
    canvas.height = imgEl.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(imgEl, 0, 0, imgEl.width, imgEl.height);
    const imgData = canvas.toDataURL('image/png');
    doc.addImage(imgData, 'PNG', margin, 20, 60, 60);
  }

  // --- Header ---
  doc.setFont('times', 'bold');
  doc.setFontSize(16);
  doc.text("DA Constance Fluff 'N Stuff Pet Supplies Store", margin + 70, 40);

  doc.setFont('times', 'normal');
  doc.setFontSize(12);
  doc.text('Pasig City, Metro Manila', margin + 70, 60);

  doc.setFont('times', 'bold');
  doc.setFontSize(14);
  doc.text('SALES REPORT', pageWidth / 2, 90, { align: 'center' });

  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  doc.text(`Period: ${fromDate} to ${toDate}`, pageWidth / 2, 105, {
    align: 'center',
  });
  doc.text(`Generated on: ${new Date().toLocaleString()}`, margin, 120);

  currentY = 140;

  // --- Sales Overview ---
  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.text('Sales Overview', margin, currentY);
  currentY += 15;

  doc.setFont('times', 'normal');
  doc.setFontSize(10);

  const overview = [
    `Volume of Sales: ${reportData.volume}`,
    `Gross Sales: ₱${Number(reportData.grossSales).toLocaleString()}`,
    `Net Profit: ₱${Number(reportData.netProfit).toLocaleString()}`,
    `Total Revenue: ₱${Number(reportData.totalRevenue).toLocaleString()}`,
    `Total VAT: ₱${Number(reportData.totalVAT).toLocaleString()}`,
    `Total Discount: ₱${Number(reportData.totalDiscount).toLocaleString()}`,
  ];

  overview.forEach(text => {
    doc.text(text, margin, currentY);
    currentY += 12;
  });

  currentY += 10;

  // --- Top-Selling by SKU Table ---
  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.text('Top-Selling Products (by SKU)', margin, currentY);
  currentY += 5;

  const topSKUData = reportData.topSellingBySKU.map((item, index) => [
    index + 1,
    item.sku,
    item.name,
    item.quantity,
    `₱${Number(item.netProfit).toLocaleString()}`,
  ]);

  doc.autoTable({
    startY: currentY,
    head: [['#', 'SKU', 'Product Name', 'Quantity Sold', 'Net Profit']],
    body: topSKUData,
    theme: 'grid',
    headStyles: {
      fillColor: [54, 162, 235],
      textColor: 255,
      fontStyle: 'bold',
    },
    bodyStyles: { font: 'times', fontStyle: 'normal', fontSize: 10 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    columnStyles: {
      0: { halign: 'center' },
      3: { halign: 'left' },
      4: { halign: 'left' },
    },
    didDrawPage: data => {
      const pageCount = doc.internal.getNumberOfPages();
      doc.setFont('times', 'italic');
      doc.setFontSize(9);
      doc.text(
        `Page ${doc.internal.getCurrentPageInfo().pageNumber} of ${pageCount}`,
        pageWidth - margin,
        pageHeight - 10,
        { align: 'right' }
      );
    },
  });

  // --- Top-Selling by Category Table ---
  doc.addPage();
  currentY = 60;

  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.text('Top-Selling Products (by Category)', margin, currentY);
  currentY += 5;

  const topCategoryData = reportData.topSellingByCategory.map((item, index) => [
    index + 1,
    item.category,
    item.quantity,
    `₱${Number(item.netProfit).toLocaleString()}`,
  ]);

  doc.autoTable({
    startY: currentY,
    head: [['#', 'Category', 'Quantity Sold', 'Net Profit']],
    body: topCategoryData,
    theme: 'grid',
    headStyles: {
      fillColor: [54, 162, 235],
      textColor: 255,
      fontStyle: 'bold',
    },
    bodyStyles: { font: 'times', fontStyle: 'normal', fontSize: 10 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    columnStyles: {
      0: { halign: 'center' },
      2: { halign: 'left' },
      3: { halign: 'left' },
    },
    didDrawPage: data => {
      const pageCount = doc.internal.getNumberOfPages();
      doc.setFont('times', 'italic');
      doc.setFontSize(9);
      doc.text(
        `Page ${doc.internal.getCurrentPageInfo().pageNumber} of ${pageCount}`,
        pageWidth - margin,
        pageHeight - 10,
        { align: 'right' }
      );
    },
  });

  // --- Daily Breakdown with Transactions ---
  if (reportData.dailyBreakdown?.length) {
    doc.addPage();
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.text('Daily Breakdown (Summary)', margin, 40);

    // Daily Summary Table
    doc.autoTable({
      startY: 60,
      head: [
        [
          'Date',
          'Transactions',
          'Gross Sales',
          'Total Revenue',
          'VAT',
          'Discounts',
        ],
      ],
      body: reportData.dailyBreakdown.map(d => [
        d.date,
        d.transactions,
        `₱${Number(d.grossSales).toLocaleString()}`,
        `₱${Number(d.totalRevenue).toLocaleString()}`,
        `₱${Number(d.totalVAT).toLocaleString()}`,
        `₱${Number(d.totalDiscount).toLocaleString()}`,
      ]),
      theme: 'grid',
    });

    // --- Transaction Breakdown for each day ---
    reportData.transactionBreakdown.forEach(day => {
      doc.addPage();
      doc.setFont('times', 'bold');
      doc.setFontSize(12);
      doc.text(`Transactions on ${day.date}`, margin, 40);

      doc.autoTable({
        startY: 60,
        head: [['Receipt Number', 'Gross', 'Total', 'VAT', 'Discount']],
        body: day.transactions.map(t => [
          t.id,
          `₱${Number(t.grossAmount).toLocaleString()}`,
          `₱${Number(t.totalAmount).toLocaleString()}`,
          `₱${Number(t.vatAmount).toLocaleString()}`,
          `₱${Number(t.discount).toLocaleString()}`,
        ]),
        theme: 'grid',
        headStyles: {
          fillColor: [54, 162, 235],
          textColor: 255,
          fontStyle: 'bold',
        },
        bodyStyles: { font: 'times', fontStyle: 'normal', fontSize: 10 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
      });
    });
  }

  // --- Save PDF ---
  doc.save(`Sales_Report_${fromDate}_to_${toDate}.pdf`);
};
