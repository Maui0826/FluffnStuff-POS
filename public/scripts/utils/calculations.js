export function calculateReceipt(cart, cash = 0, discountType = 'none') {
  let totalQty = 0;
  let grossAmount = 0;
  let vatableSales = 0;
  let vatExemptSales = 0;
  let zeroRatedSales = 0;
  let totalDiscount = 0;

  const discountRates = {
    senior: 0.2, // 20% discount
    pwd: 0.2, // 20% discount
    none: 0,
  };
  const discountRate = discountRates[discountType] || 0;

  const items = cart.map(item => {
    const price = Number(item.price) || 0;
    const qty = Number(item.quantity) || 0;
    const lineTotal = price * qty;

    totalQty += qty;
    grossAmount += lineTotal;

    let vt = String(item.vatType || 'vatable').toLowerCase();

    // PWD override: treat all items as VAT-exempt
    if (discountType === 'pwd') {
      vt = 'exempt';
      vatExemptSales += lineTotal;
    } else {
      if (vt === 'vatable') {
        vatableSales += lineTotal / 1.12;
      } else if (vt === 'exempt') {
        vatExemptSales += lineTotal;
      } else if (vt === 'zero-rated') {
        zeroRatedSales += lineTotal;
      }
    }

    return {
      sku: item.sku || '',
      name: item.name || '',
      vatType: vt,
      price,
      quantity: qty,
      lineTotal,
    };
  });

  // VAT is only from vatable sales
  const vat = vatableSales * 0.12;

  // Apply discount on gross amount
  totalDiscount = grossAmount * discountRate;
  const billAmount = grossAmount - totalDiscount;

  // Cash change
  const change = Number(cash) - billAmount;

  return {
    items,
    totalQty,
    grossAmount,
    vatableAmount: vatableSales,
    vatExemptSales,
    vatZeroRatedSales: zeroRatedSales,
    vat,
    billAmount,
    totalDiscount,
    cash: Number(cash),
    change: change >= 0 ? change : 0,
    timestamp: new Date().toISOString(),
  };
}
