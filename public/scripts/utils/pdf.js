export const generateInventoryPDF = (reportData, fromDate, toDate) => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'landscape' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  let currentY = 40;

  // --- Safe formatter ---
  const safe = (val, fallback = 'N/A') => {
    if (val === undefined || val === null || val === '') return fallback;
    if (typeof val === 'number') return val;
    if (!isNaN(Number(val))) return Number(val);
    return val;
  };

  const safeMoney = val =>
    '₱' + Number(val?.$numberDecimal ?? val ?? 0).toLocaleString();

  // --- Add Logo ---
  const imgEl = document.getElementById('logo');
  if (imgEl) {
    const canvas = document.createElement('canvas');
    canvas.width = imgEl.width;
    canvas.height = imgEl.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(imgEl, 0, 0, imgEl.width, imgEl.height);
    const imgData = canvas.toDataURL('image/png');
    doc.addImage(imgData, 'PNG', margin, currentY, 60, 60);
  }

  // --- Business Info ---
  doc.setFont('times', 'bold');
  doc.setFontSize(16);
  doc.text(
    "DA Constance Fluff 'N Stuff Pet Supplies Store",
    margin + 70,
    currentY + 20
  );

  doc.setFont('times', 'normal');
  doc.setFontSize(12);
  doc.text('Pasig City, Metro Manila', margin + 70, currentY + 40);
  currentY += 70;

  // --- Report Title & Period ---
  doc.setFont('times', 'bold');
  doc.setFontSize(14);
  doc.text('POS Inventory Report', pageWidth / 2, currentY, {
    align: 'center',
  });

  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  if (fromDate && toDate) {
    doc.text(`Period: ${fromDate} to ${toDate}`, pageWidth / 2, currentY + 15, {
      align: 'center',
    });
  }
  doc.text(
    `Generated on: ${new Date().toLocaleString()}`,
    margin,
    currentY + 15
  );
  currentY += 30;

  // --- Summary ---
  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.text('Summary', margin, currentY);
  currentY += 15;

  doc.setFont('times', 'normal');
  const totalInventoryValue = safe(
    reportData.summary?.totalInventoryValue?.$numberDecimal,
    0
  );
  const totalQuantitySold = safe(reportData.summary?.totalQuantitySold, 0);
  const totalRefunds = safe(reportData.summary?.totalRefunds, 0);
  const lowStockCount = safe(reportData.summary?.lowStockCount, 0);

  doc.text(
    `Total Inventory Value: ${safeMoney(totalInventoryValue)}`,
    margin,
    currentY
  );
  currentY += 12;
  doc.text(`Total Quantity Sold: ${totalQuantitySold}`, margin, currentY);
  currentY += 12;
  doc.text(`Total Refunds: ${safeMoney(totalRefunds)}`, margin, currentY);
  currentY += 12;
  doc.text(`Low Stock Items: ${lowStockCount}`, margin, currentY);
  currentY += 30;

  // --- Helper to add table ---
  const addTable = (title, headers, rows, columnStyles = {}) => {
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.text(title, margin, currentY);
    currentY += 5;

    doc.autoTable({
      startY: currentY,
      head: [headers],
      body: rows.map((row, i) => ({ '#': i + 1, ...row })).map(Object.values),
      theme: 'grid',
      tableWidth: 'auto',
      headStyles: {
        fillColor: [54, 162, 235],
        textColor: 255,
        fontStyle: 'bold',
      },
      bodyStyles: { font: 'times', fontSize: 10 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      columnStyles,
      styles: { overflow: 'linebreak', cellPadding: 4 },
      didDrawPage: () => {
        const pageCount = doc.internal.getNumberOfPages();
        doc.setFont('times', 'italic');
        doc.setFontSize(9);
        doc.text(
          `Page ${
            doc.internal.getCurrentPageInfo().pageNumber
          } of ${pageCount}`,
          pageWidth - margin,
          pageHeight - 10,
          { align: 'right' }
        );
      },
    });

    currentY = doc.lastAutoTable.finalY + 20;
  };

  // --- Current Inventory Table ---
  if (reportData.inventorySummary?.length) {
    addTable(
      'Current Inventory',
      ['#', 'Product Name', 'Qty on Hand', 'Acquisition Price (₱)'],
      reportData.inventorySummary.map(item => ({
        name: safe(item.productName),
        qtyOnHand: safe(item.qtyOnHand, 0),
        acquisitionPrice: safeMoney(item.acquisitionPrice),
      })),
      { 1: { cellWidth: 200 }, 2: { cellWidth: 80 }, 3: { cellWidth: 100 } }
    );
  }

  // --- Other Tables ---
  const tableData = [
    {
      title: 'Top Moving Items (by SKU)',
      headers: ['#', 'SKU', 'Product Name', 'Quantity Sold', 'COGS'],
      data: reportData.topSellingBySKU,
      map: i => ({
        sku: safe(i.sku),
        name: safe(i.name),
        quantity: safe(i.quantity, 0),
        cogs: safeMoney(i.cogs),
      }),
      styles: {
        1: { cellWidth: 80 },
        2: { cellWidth: 200 },
        3: { cellWidth: 80 },
        4: { cellWidth: 60 },
      },
    },
    {
      title: 'Top Moving Items (by Category)',
      headers: ['#', 'Category', 'Quantity Sold', 'COGS'],
      data: reportData.topSellingByCategory,
      map: i => ({
        category: safe(i.category),
        quantity: safe(i.quantity, 0),
        cogs: safeMoney(i.cogs),
      }),
      styles: {
        1: { cellWidth: 150 },
        2: { cellWidth: 100 },
        3: { cellWidth: 80 },
      },
    },
    {
      title: 'Volume of Refunds',
      headers: [
        '#',
        'Product Name',
        'Quantity Refunded',
        'Refund Amount',
        'Reason',
      ],
      data: reportData.refunds,
      map: i => ({
        name: safe(i.name),
        quantity: safe(i.quantity, 0),
        amount: safeMoney(i.amount),
        reason: safe(i.reason),
      }),
      styles: {
        1: { cellWidth: 200 },
        2: { cellWidth: 70 },
        3: { cellWidth: 80 },
        4: { cellWidth: 120 },
      },
    },
    {
      title: 'Refund Summary by Reason',
      headers: ['#', 'Reason', 'Quantity', 'Total Amount (₱)'],
      data: reportData.refundSummary,
      map: i => ({
        reason: safe(i.reason),
        quantity: safe(i.totalQty, 0),
        totalAmount: safeMoney(i.totalAmount),
      }),
      styles: {
        1: { cellWidth: 200 },
        2: { cellWidth: 70 },
        3: { cellWidth: 100 },
      },
    },
    {
      title: 'Volume of Damaged Items',
      headers: ['#', 'Product Name', 'Quantity Damaged'],
      data: reportData.damaged,
      map: i => ({
        name: safe(i.name),
        quantity: safe(i.quantity, 0),
      }),
      styles: { 1: { cellWidth: 200 }, 2: { cellWidth: 80 } },
    },
    {
      title: 'Low Stock Duration (Days)',
      headers: ['#', 'Product Name', 'Days Below Threshold'],
      data: reportData.lowStock,
      map: i => ({
        name: safe(i.name),
        days: safe(i.days, 0),
      }),
      styles: { 1: { cellWidth: 200 }, 2: { cellWidth: 80 } },
    },
  ];

  tableData.forEach(tbl => {
    if (tbl.data?.length)
      addTable(tbl.title, tbl.headers, tbl.data.map(tbl.map), tbl.styles);
  });

  doc.save(`Inventory_Report_${fromDate || 'all'}_to_${toDate || 'all'}.pdf`);
};
