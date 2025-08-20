export function generateOrderPDF(fromDate, toDate, tableBody, summaryDiv) {
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
  doc.text('DELIVERY REPORT', pageWidth / 2, currentY, { align: 'center' });

  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  doc.text(`Period: ${fromDate} to ${toDate}`, pageWidth / 2, currentY + 15, {
    align: 'center',
  });
  doc.text(
    `Generated on: ${new Date().toLocaleString()}`,
    margin,
    currentY + 15
  );
  currentY += 30;

  // --- Summary Metrics ---
  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.text('Summary', margin, currentY);
  currentY += 15;

  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  const summaryItems = Array.from(summaryDiv.querySelectorAll('p')).map(
    p => p.textContent
  );
  summaryItems.forEach(item => {
    doc.text(item, margin, currentY);
    currentY += 12;
  });
  currentY += 10;

  // --- Delivery Table ---
  const table = document.getElementById('order-report-table');
  doc.autoTable({
    startY: currentY,
    html: table,
    theme: 'grid',
    tableWidth: 'wrap',
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold',
    },
    bodyStyles: { font: 'times', fontStyle: 'normal', fontSize: 10 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 120 },
      2: { cellWidth: 70 },
      3: { cellWidth: 120 },
      4: { cellWidth: 60 },
      5: { cellWidth: 60 },
      6: { cellWidth: 70 },
      7: { cellWidth: 70 },
      8: { cellWidth: 50 },
      9: { cellWidth: 50 },
      10: { cellWidth: 50 },
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

  // --- Save PDF ---
  doc.save(`Delivery_Report_${fromDate}_to_${toDate}.pdf`);
}
