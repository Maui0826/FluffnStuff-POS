export const generateInventoryPDF = (reportData, fromDate, toDate) => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'landscape' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  let currentY = 40;

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
  const totalInventoryValue = Number(
    reportData.summary?.totalInventoryValue?.$numberDecimal || 0
  );
  doc.text(
    `Total Inventory Value: ₱${totalInventoryValue.toLocaleString()}`,
    margin,
    currentY
  );
  currentY += 12;
  doc.text(
    `Total Quantity Sold: ${reportData.summary.totalQuantitySold}`,
    margin,
    currentY
  );
  currentY += 12;
  doc.text(
    `Total Refunds: ₱${reportData.summary.totalRefunds.toLocaleString()}`,
    margin,
    currentY
  );
  currentY += 12;
  doc.text(
    `Low Stock Items: ${reportData.summary.lowStockCount}`,
    margin,
    currentY
  );
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
      columnStyles: columnStyles,
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

  // --- Add Tables with optimized widths ---
  addTable(
    'Top Moving Items (by SKU)',
    ['#', 'SKU', 'Product Name', 'Quantity Sold', 'COGS'],
    reportData.topSellingBySKU.map(i => ({
      sku: i.sku,
      name: i.name,
      quantity: i.quantity,
      cogs: '₱' + i.cogs.toLocaleString(),
    })),
    {
      1: { cellWidth: 80 },
      2: { cellWidth: 200 },
      3: { cellWidth: 80 },
      4: { cellWidth: 60 },
    }
  );

  addTable(
    'Top Moving Items (by Category)',
    ['#', 'Category', 'Quantity Sold', 'COGS'],
    reportData.topSellingByCategory.map(i => ({
      category: i.category,
      quantity: i.quantity,
      cogs: '₱' + i.cogs.toLocaleString(),
    })),
    { 1: { cellWidth: 150 }, 2: { cellWidth: 100 }, 3: { cellWidth: 80 } }
  );

  addTable(
    'Volume of Refunds',
    ['#', 'Product Name', 'Quantity Refunded', 'Refund Amount', 'Reason'],
    reportData.refunds.map(i => ({
      name: i.name,
      quantity: i.quantity,
      amount: '₱' + i.amount.toLocaleString(),
      reason: i.reason,
    })),
    {
      1: { cellWidth: 200 },
      2: { cellWidth: 70 },
      3: { cellWidth: 80 },
      4: { cellWidth: 120 },
    }
  );

  addTable(
    'Refund Summary by Reason',
    ['#', 'Reason', 'Quantity', 'Total Amount (₱)'],
    reportData.refundSummary.map(i => ({
      reason: i.reason,
      quantity: i.totalQty,
      totalAmount: '₱' + i.totalAmount.toLocaleString(),
    })),
    { 1: { cellWidth: 200 }, 2: { cellWidth: 70 }, 3: { cellWidth: 100 } }
  );

  addTable(
    'Volume of Damaged Items',
    ['#', 'Product Name', 'Quantity Damaged'],
    reportData.damaged.map(i => ({
      name: i.name,
      quantity: i.quantity,
    })),
    { 1: { cellWidth: 200 }, 2: { cellWidth: 80 } }
  );

  addTable(
    'Low Stock Duration (Days)',
    ['#', 'Product Name', 'Days Below Threshold'],
    reportData.lowStock.map(i => ({
      name: i.name,
      days: i.days,
    })),
    { 1: { cellWidth: 200 }, 2: { cellWidth: 80 } }
  );

  // --- Save PDF ---
  doc.save(`Inventory_Report_${fromDate || 'all'}_to_${toDate || 'all'}.pdf`);
};
