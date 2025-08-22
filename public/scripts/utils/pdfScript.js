// scripts/utils/pdf.js
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export function generateInventoryPDF(reportData) {
  const doc = new jsPDF();

  // Title
  doc.setFontSize(16);
  doc.text('Inventory Report', 14, 20);

  // Table
  const tableData = reportData.items.map(item => [
    item.sku,
    item.productName,
    item.category,
    item.quantity,
    item.sellingPrice.toFixed(2),
    item.acquisitionPrice.toFixed(2),
    item.supplierName,
  ]);

  doc.autoTable({
    head: [
      [
        'SKU',
        'Product Name',
        'Category',
        'Qty',
        'Selling Price',
        'Acquisition Price',
        'Supplier',
      ],
    ],
    body: tableData,
    startY: 30,
  });

  // Save PDF
  doc.save(`inventory_report_${new Date().toISOString().split('T')[0]}.pdf`);
}
