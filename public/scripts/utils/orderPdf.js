export function generateOrderPDF(fromDate, toDate) {
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
  const summaryDiv = document.getElementById('summary-values');
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

  // --- Helper function for page numbers ---
  const addPageNumbers = () => {
    const pageCount = doc.internal.getNumberOfPages();
    doc.setFont('times', 'italic');
    doc.setFontSize(9);
    doc.text(
      `Page ${doc.internal.getCurrentPageInfo().pageNumber} of ${pageCount}`,
      pageWidth - margin,
      pageHeight - 10,
      { align: 'right' }
    );
  };

  // --- Function to add table with label and empty text ---
  const addTableWithLabel = (label, tableEl, headColor) => {
    // Add table label
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.text(label, margin, currentY);
    currentY += 15;

    if (tableEl && tableEl.rows.length > 1) {
      // Table has data
      doc.autoTable({
        startY: currentY,
        html: tableEl,
        theme: 'grid',
        headStyles: { fillColor: headColor, textColor: 255, fontStyle: 'bold' },
        bodyStyles: { font: 'times', fontStyle: 'normal', fontSize: 10 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        didDrawPage: addPageNumbers,
      });
      currentY = doc.lastAutoTable.finalY + 20;
    } else {
      // Table empty
      doc.setFont('times', 'italic');
      doc.setFontSize(10);
      doc.text('No records available', margin + 10, currentY);
      currentY += 30;
    }
  };

  // --- Delivered Table ---
  addTableWithLabel(
    'Delivered Items',
    document.getElementById('order-report-table'),
    [41, 128, 185]
  );

  // --- Pending Table ---
  addTableWithLabel(
    'Pending Deliveries',
    document.getElementById('pending-table'),
    [230, 126, 34]
  );

  // --- Cancelled Table ---
  addTableWithLabel(
    'Cancelled Deliveries',
    document.getElementById('cancelled-table'),
    [192, 57, 43]
  );

  // --- Save PDF ---
  doc.save(`Delivery_Report_${fromDate}_to_${toDate}.pdf`);
}
