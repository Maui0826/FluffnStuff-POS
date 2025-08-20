import {
  searchReceipt,
  fetchProducts,
  refundProduct,
} from '../scripts/api/transactions.js';

const searchBtn = document.getElementById('search-receipt-btn');
const receiptInput = document.getElementById('receiptNum');
const receiptMessage = document.getElementById('receipt-message');

const refundForm = document.getElementById('refund-form');
const skuSelect = document.getElementById('sku');
const boughtQtyInput = document.getElementById('boughtQty');
const priceInput = document.getElementById('price');
const quantityInput = document.getElementById('quantity');
const messageDiv = document.getElementById('refund-message');

// cancel button
document.getElementById('cancel-btn').addEventListener('click', () => {
  window.location.href = '/point-of-sale';
});

let transactionItems = [];
let transactionId = null; // store _id of the receipt

// Step 1: Search receipt
searchBtn.addEventListener('click', async () => {
  const receiptNum = receiptInput.value.trim();
  if (!receiptNum) return;

  try {
    // Search receipt and get the transaction _id
    const receiptData = await searchReceipt(receiptNum);
    transactionId = receiptData.data._id;

    if (!transactionId) throw new Error('Invalid receipt data');

    // Fetch products using transaction _id
    const productData = await fetchProducts(transactionId);
    transactionItems = productData.transactionItems || [];

    if (transactionItems.length === 0) {
      throw new Error('No products found in this receipt');
    }

    // Populate SKU select with product names
    skuSelect.innerHTML = '<option value="">Select Product</option>';
    transactionItems.forEach(item => {
      const option = document.createElement('option');
      option.value = item.sku;
      option.textContent = item.name;
      skuSelect.appendChild(option);
    });

    // Show refund form
    refundForm.style.display = 'block';
    receiptMessage.textContent = '';
  } catch (err) {
    receiptMessage.textContent = `Error: ${err.message}`;
    refundForm.style.display = 'none';
  }
});

// Step 2: Show bought quantity and price when SKU selected
skuSelect.addEventListener('change', () => {
  const sku = skuSelect.value;
  if (!sku) {
    boughtQtyInput.value = '';
    priceInput.value = '';
    quantityInput.max = '';
    return;
  }

  const item = transactionItems.find(i => i.sku === sku);
  if (item) {
    boughtQtyInput.value = item.quantity;
    priceInput.value = parseFloat(item.price).toFixed(2);
    quantityInput.max = item.quantity;
    quantityInput.value = 1;
  }
});

// Step 3: Handle refund submission
refundForm.addEventListener('submit', async e => {
  e.preventDefault();
  messageDiv.textContent = '';

  const payload = {
    receiptNum: receiptInput.value.trim(),
    sku: skuSelect.value,
    quantity: quantityInput.value,
    reason: document.getElementById('reason').value,
    note: document.getElementById('note').value,
  };

  try {
    const data = await refundProduct(payload);
    messageDiv.textContent = `Refund successful! Updated transaction total: ${data.data.totalAmount}`;
    refundForm.reset();
    refundForm.style.display = 'none';
    skuSelect.innerHTML = '<option value="">Select Product</option>';
    transactionItems = [];
    transactionId = null;
  } catch (err) {
    messageDiv.textContent = `Error: ${err.message}`;
  }
});
