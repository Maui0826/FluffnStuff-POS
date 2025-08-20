import Stock from '../models/stockModel.js';

export const getOrderReport = async (fromDate, toDate) => {
  const deliveredItems = await Stock.find({
    deliveredDate: { $gte: new Date(fromDate), $lte: new Date(toDate) },
    isDeleted: false,
  })
    .populate('productId', 'name sku') // only populate name and sku
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
      sku: item.productId.sku, // lowercase 'sku'
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

  const pendingDeliveries = await Stock.countDocuments({
    status: 'pending',
    isDeleted: false,
  });

  return {
    report,
    summary: {
      totalDeliveredQty,
      totalAcquisitionCost,
      pendingDeliveries,
      onTimeDeliveries,
      lateDeliveries: deliveredItems.length - onTimeDeliveries,
    },
  };
};
