import Stock from '../models/stockModel.js';
import mongoose from 'mongoose';

export const getOrderReport = async (fromDate, toDate) => {
  const from = new Date(fromDate);
  const to = new Date(toDate);
  to.setHours(23, 59, 59, 999); // include full day

  // Delivered items
  const deliveredItems = await Stock.find({
    deliveredDate: { $gte: from, $lte: to },
    status: 'delivered',
    isDeleted: false,
  })
    .populate('productId', 'name sku')
    .lean();

  let totalDeliveredQty = 0;
  let totalAcquisitionCost = 0;
  let onTimeDeliveries = 0;

  const report = deliveredItems.map(item => {
    const acquisitionPrice = parseFloat(item.acquisitionPrice.toString());
    const totalCost = item.deliveredQuantity * acquisitionPrice;
    const shortfall = Math.max(item.orderQuantity - item.deliveredQuantity, 0);
    const overdelivery = Math.max(
      item.deliveredQuantity - item.orderQuantity,
      0
    );
    const onTime = item.deliveredDate <= item.deliveryDate;

    totalDeliveredQty += item.deliveredQuantity;
    totalAcquisitionCost += totalCost;
    if (onTime) onTimeDeliveries++;

    return {
      date: item.deliveredDate,
      product: item.productId.name,
      sku: item.productId.sku,
      supplier: item.supplierName,
      orderedQty: item.orderQuantity,
      deliveredQty: item.deliveredQuantity,
      acquisitionPrice,
      totalCost,
      shortfall,
      overdelivery,
      onTime,
    };
  });

  // Pending deliveries in range
  const pendingItems = await Stock.find({
    status: 'pending',
    deliveryDate: { $gte: from, $lte: to },
    isDeleted: false,
  })
    .populate('productId', 'name sku')
    .lean();

  // Cancelled deliveries in range
  const cancelledItems = await Stock.find({
    status: 'cancelled',
    deliveryDate: { $gte: from, $lte: to },
    isDeleted: false,
  })
    .populate('productId', 'name sku')
    .lean();

  return {
    report,
    pendingItems,
    cancelledItems,
    summary: {
      totalDeliveredQty,
      totalAcquisitionCost,
      pendingDeliveries: pendingItems.length,
      cancelledDeliveries: cancelledItems.length,
      onTimeDeliveries,
      lateDeliveries: deliveredItems.length - onTimeDeliveries,
    },
  };
};
