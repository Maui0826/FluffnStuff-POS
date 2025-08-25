export const generateInventoryPDF = (reportData, fromDate, toDate) => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'landscape' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  let currentY = 40;

  const safe = (val, fallback = 'N/A') => {
    if (val === undefined || val === null || val === '') return fallback;
    if (typeof val === 'number') return val;
    if (!isNaN(Number(val))) return Number(val);
    return val;
  };

  const safeMoney = val =>
    '₱' + Number(val?.$numberDecimal ?? val ?? 0).toLocaleString();

  // Logo
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

  // Header
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

  // Title
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

  // Summary
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

  doc.text(
    `Total Inventory Value: ${safeMoney(totalInventoryValue)}`,
    margin,
    currentY
  );
  currentY += 12;
  doc.text(`Total Quantity Sold: ${totalQuantitySold}`, margin, currentY);
  currentY += 12;
  doc.text(`Total Refunds: ${safeMoney(totalRefunds)}`, margin, currentY);
  currentY += 30;

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

  // Current Inventory
  if (reportData.currentInventory?.length) {
    addTable(
      'Current Inventory',
      [
        '#',
        'Product',
        'On Hand',
        'Sold',
        'Damaged',
        'Expired',
        'Shrinkage',
        'Correction',
        'Restocked',
      ],
      reportData.currentInventory.map(item => ({
        product: safe(item.product),
        onHand: safe(item.onHand, 0),
        sold: safe(item.sold, 0),
        damaged: safe(item.damaged, 0),
        expired: safe(item.expired, 0),
        shrinkage: safe(item.shrinkage, 0),
        correction: safe(item.correction, 0),
        restocked: safe(item.restocked, 0),
      }))
    );
  }

  // Orders
  if (reportData.orders?.length) {
    addTable(
      'Orders',
      [
        '#',
        'Product',
        'Qty Received',
        'Supplier',
        'Delivery Date',
        'Delivered Date',
      ],
      reportData.orders.map(o => ({
        product: safe(o.product),
        qtyReceived: safe(o.quantityReceived, 0),
        supplier: safe(o.supplier),
        deliveryDate: safe(o.deliveryDate)
          ? new Date(o.deliveryDate).toLocaleDateString()
          : 'N/A',
        deliveredDate: safe(o.deliveredDate)
          ? new Date(o.deliveredDate).toLocaleDateString()
          : 'N/A',
      }))
    );
  }

  // Refund Summary
  if (reportData.refundSummary?.length) {
    addTable(
      'Refund Summary',
      ['#', 'Reason', 'Qty', 'Total Amount'],
      reportData.refundSummary.map(r => ({
        reason: safe(r.reason),
        qty: safe(r.quantity, 0),
        totalAmount: safeMoney(r.totalAmount),
      }))
    );
  }

  // Refund Breakdown
  if (reportData.refunds?.length) {
    addTable(
      'Refund Breakdown',
      ['#', 'Product', 'Qty', 'Price', 'Reason', 'Date Refunded'],
      reportData.refunds.map(r => ({
        product: safe(r.product),
        qty: safe(r.quantity, 0),
        price: safeMoney(r.price),
        reason: safe(r.reason),
        dateRefunded: r.refundedAt
          ? new Date(r.refundedAt).toLocaleDateString()
          : 'N/A',
      }))
    );
  }

  doc.save(`Inventory_Overview_${fromDate || 'all'}_to_${toDate || 'all'}.pdf`);
};
