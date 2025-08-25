import { searchProduct, createTransaction } from '../scripts/api/posAPI.js';
import { calculateReceipt } from './utils/calculations.js';

document.addEventListener('DOMContentLoaded', () => {
  const cart = [];

  // --- DOM Elements ---
  const skuInput = document.getElementById('skuOrName');
  const preview = document.getElementById('product-preview');
  const previewImg = document.getElementById('preview-img');
  const previewName = document.getElementById('preview-name');
  const previewSKU = document.getElementById('preview-sku');
  const previewDesc = document.getElementById('preview-desc');
  const previewPrice = document.getElementById('preview-price');
  const qtyInput = document.getElementById('quantity');
  const addToCartBtn = document.getElementById('add-to-cart');
  const cartTable = document.querySelector('#cart-table tbody');
  const itemCountSpan = document.getElementById('item-count');
  const totalAmountSpan = document.getElementById('total-amount');
  const voidToggleBtn = document.getElementById('void-mode-toggle');
  const voidControls = document.getElementById('void-controls');
  const deleteSelectedBtn = document.getElementById('delete-selected');
  const cancelVoidBtn = document.getElementById('cancel-void');
  const cartTableHeader = document.querySelector('.void-checkbox-header');

  const confirmPaymentBtn = document.getElementById('confirm-payment');
  const paymentSection = document.getElementById('payment-section');
  const finalizePaymentBtn = document.getElementById('finalize-payment');
  const cancelPaymentBtn = document.getElementById('cancel-payment');
  const paymentAmountInput = document.getElementById('payment-amount');
  const displayTotal = document.getElementById('display-total');
  const displayDiscount = document.getElementById('display-discount');
  const changeAmount1 = document.getElementById('change-amount1');
  const discountType = document.getElementById('discount-type');

  const paymentMethodSelect = document.getElementById('payment-method');
  const transactionNumberGroup = document.getElementById(
    'transaction-number-group'
  );
  const discountSelect = document.getElementById('discount-type');
  const seniorField = document.getElementById('senior-field');
  const pwdField = document.getElementById('pwd-field');

  const refundButton = document.getElementById('refund-button');

  //refund button
  refundButton.addEventListener('click', () => {
    // Redirect to the refunds page
    window.location.href = '/refunds';
  });

  //void toggle

  let voidMode = false;

  voidToggleBtn.disabled = cart.length === 0;

  // Update void button state based on cart
  function updateVoidButtonState() {
    voidToggleBtn.disabled = cart.length === 0;
    if (cart.length === 0) {
      voidToggleBtn.style.display = 'inline-block'; // show button again
    } else {
      voidToggleBtn.classList.remove('hidden');
    }
  }

  // Toggle void mode
  voidToggleBtn.addEventListener('click', () => {
    if (cart.length === 0) return; // safety check

    voidMode = true;
    voidControls.classList.remove('hidden');
    voidToggleBtn.style.display = 'none'; // hide button

    renderCart(); // re-render cart to show checkboxes
  });

  // Cancel void
  cancelVoidBtn.addEventListener('click', () => {
    voidMode = false;
    voidControls.classList.add('hidden');
    voidToggleBtn.style.display = 'inline-block'; // show button again
    renderCart();
  });

  // Delete selected items
  deleteSelectedBtn.addEventListener('click', () => {
    const checkboxes = document.querySelectorAll('.void-checkbox');

    // Check if any checkbox is selected
    const anySelected = Array.from(checkboxes).some(cb => cb.checked);
    if (!anySelected) {
      alert('No items selected to delete.');
      return; // exit early if nothing is selected
    }

    // Delete selected items (iterate backwards to avoid index issues)
    for (let i = checkboxes.length - 1; i >= 0; i--) {
      if (checkboxes[i].checked) {
        cart.splice(i, 1);
      }
    }

    renderCart();
    voidMode = false; // exit void mode
    voidControls.classList.add('hidden');
    voidToggleBtn.style.display = 'inline-block';
    updateVoidButtonState(); // update void button
  });

  // Toggle reference number field based on payment method
  paymentMethodSelect.addEventListener('change', () => {
    const method = paymentMethodSelect.value;
    const transactionNumberInput =
      document.getElementById('transaction-number');

    if (method === 'ewallet' || method === 'bank') {
      transactionNumberGroup.classList.remove('hidden');
      transactionNumberInput.required = true; // Make required
    } else {
      transactionNumberGroup.classList.add('hidden');
      transactionNumberInput.value = '';
      transactionNumberInput.required = false; // Remove required
    }
  });

  // Toggle Senior / PWD fields
  discountSelect.addEventListener('change', () => {
    const discount = discountSelect.value;

    if (discount === 'senior') {
      seniorField.classList.remove('hidden');
      pwdField.classList.add('hidden');
      document.getElementById('pwd-id').value = '';

      // Make Senior ID required
      document.getElementById('senior-id').required = true;
      document.getElementById('pwd-id').required = false;
    } else if (discount === 'pwd') {
      pwdField.classList.remove('hidden');
      seniorField.classList.add('hidden');
      document.getElementById('senior-id').value = '';

      // Make PWD ID required
      document.getElementById('pwd-id').required = true;
      document.getElementById('senior-id').required = false;
    } else {
      seniorField.classList.add('hidden');
      pwdField.classList.add('hidden');
      document.getElementById('senior-id').value = '';
      document.getElementById('pwd-id').value = '';

      // Remove required attribute
      document.getElementById('senior-id').required = false;
      document.getElementById('pwd-id').required = false;
    }

    // Recalculate totals
    applyDiscountToUI();
  });

  const receiptFields = {
    totalQty: document.getElementById('totalQty'),
    grossAmount: document.getElementById('grossAmount'),
    vatableAmount: document.getElementById('vatableAmount'),
    vatExempt: document.getElementById('vatExemptSales'),
    vatZero: document.getElementById('vatZeroRateSale'),
    vat: document.getElementById('twelvePercentVat'),
    billAmount: document.getElementById('billAmount'),
    change: document.getElementById('change-amount1'), // still visible
  };

  let totalDue = 0;

  // Confirm Payment
  confirmPaymentBtn.addEventListener('click', () => {
    if (!cart.length) return alert('Cart is empty!');

    confirmPaymentBtn.style.display = 'none';
    const cash = parseFloat(paymentAmountInput.value) || 0;

    // 🔥 First recalc cart totals so discount applies
    updateCartTotals();

    // Build receipt using discounted totalDue
    const receipt = {
      totalQty: receiptFields.totalQty.textContent,
      grossAmount: receiptFields.grossAmount.textContent,
      vatableAmount: receiptFields.vatableAmount.textContent,
      vatExemptSales: receiptFields.vatExempt.textContent,
      vatZeroRatedSales: receiptFields.vatZero.textContent,
      vat: receiptFields.vat.textContent,
      billAmount: totalDue, // <-- use discounted totalDue
      change: Math.max(cash - totalDue, 0).toFixed(2),
      totalDiscount: displayDiscount.textContent,
    };

    totalDue = Number(receipt.billAmount);
    updateReceiptUI(receipt);

    displayDiscount.textContent = (Number(receipt.totalDiscount) || 0).toFixed(
      2
    );
    displayTotal.textContent = Number(receipt.billAmount).toFixed(2);
    changeAmount1.textContent = Number(receipt.change).toFixed(2);

    paymentSection.classList.remove('hidden');
    paymentAmountInput.value = '';
    finalizePaymentBtn.disabled = true;
  });

  function applyDiscountToUI() {
    const discount = discountSelect.value;
    const total = cart.reduce((sum, item) => sum + item.total, 0);
    let discountAmount = 0;

    if (discount === 'senior') {
      discountAmount = total * 0.2; // 20% senior discount
    } else if (discount === 'pwd') {
      discountAmount = total * 0.2; // 20% PWD discount
    }

    displayDiscount.textContent = discountAmount.toFixed(2);

    // 🔥 Update totalDue here
    totalDue = total - discountAmount;
    displayTotal.textContent = (total - discountAmount).toFixed(2);

    // 🔥 Recompute change immediately
    const paid = parseFloat(paymentAmountInput.value) || 0;
    const change = paid - totalDue > 0 ? paid - totalDue : 0;
    changeAmount1.textContent = change.toFixed(2);
    finalizePaymentBtn.disabled = paid < totalDue;
  }

  // Enable Finalize Payment
  paymentAmountInput.addEventListener('input', () => {
    const paid = parseFloat(paymentAmountInput.value) || 0;
    const change = paid - totalDue > 0 ? paid - totalDue : 0;
    changeAmount1.textContent = change.toFixed(2);
    finalizePaymentBtn.disabled = paid < totalDue;
  });

  // discount
  // Update displayDiscount when discount type changes
  discountSelect.addEventListener('change', () => {
    const discount = discountSelect.value;

    if (discount === 'senior') {
      seniorField.classList.remove('hidden');
      pwdField.classList.add('hidden');
      document.getElementById('pwd-id').value = '';
    } else if (discount === 'pwd') {
      pwdField.classList.remove('hidden');
      seniorField.classList.add('hidden');
      document.getElementById('senior-id').value = '';
    } else {
      seniorField.classList.add('hidden');
      pwdField.classList.add('hidden');
      document.getElementById('senior-id').value = '';
      document.getElementById('pwd-id').value = '';
    }

    updateCartTotals();
  });

  // Cancel Payment
  cancelPaymentBtn.addEventListener('click', () => {
    paymentSection.classList.add('hidden');
    paymentAmountInput.value = '';
    confirmPaymentBtn.style.display = 'inline-block';
  });

  // Finalize Payment
  finalizePaymentBtn.addEventListener('click', async () => {
    const paid = parseFloat(paymentAmountInput.value);
    if (isNaN(paid) || paid < totalDue) return alert('Insufficient payment!');
    // Check required fields based on discount
    const discount = discountSelect.value;
    if (
      discount === 'senior' &&
      !document.getElementById('senior-id').value.trim()
    ) {
      return alert('Please enter Senior Citizen ID!');
    }
    if (discount === 'pwd' && !document.getElementById('pwd-id').value.trim()) {
      return alert('Please enter PWD ID!');
    }

    // Check required fields based on payment method
    const paymentMethod = paymentMethodSelect.value;
    if (
      (paymentMethod === 'ewallet' || paymentMethod === 'bank') &&
      !document.getElementById('transaction-number').value.trim()
    ) {
      return alert('Please enter Transaction Number!');
    }

    const transactionData = {
      items: cart.map(item => ({
        productId: item._id,
        quantity: item.quantity,
        price: Number(item.price),
        vatType: item.vatType || 'vatable',
      })),
      cash: paid,
      discountType: discountType.value,
      paymentMethod: paymentMethodSelect.value,
      referenceNumber:
        document.getElementById('transaction-number')?.value || null,
      seniorId: document.getElementById('senior-id')?.value || null,
      pwdId: document.getElementById('pwd-id')?.value || null,
    };

    const result = await createTransaction(transactionData);

    if (result && result.status === 'success') {
      const receiptNum = result.data.transaction.receiptNum; // <-- get receiptNum from response
      alert('Transaction successful!');

      // Generate receipt content
      const receiptWindow = window.open('', 'PRINT', 'height=600,width=400');

      // Receipt calculations
      const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
      const grossAmount = cart.reduce((sum, item) => sum + item.total, 0);

      const billAmount = totalDue;
      let vatableAmount = 0;
      let vat = 0;
      let vatExemptSales = 0;

      if (discountSelect.value === 'senior' || discountSelect.value === 'pwd') {
        vatExemptSales = billAmount.toFixed(2);
      } else {
        vatableAmount = (grossAmount / 1.12).toFixed(2);
        vat = (grossAmount - vatableAmount).toFixed(2);
      }

      const change = (paid - billAmount).toFixed(2);

      // Format items nicely
      let itemsHTML = '';
      cart.forEach(item => {
        const name = item.name.length > 16 ? item.name.slice(0, 16) : item.name;
        const qty = item.quantity.toString().padStart(2, ' ');
        const total = item.total.toFixed(2).padStart(6, ' ');
        itemsHTML += `${name.padEnd(16, ' ')} ${qty} ${total}<br>`;
      });

      receiptWindow.document.write(`
<html>
  <head>
    <title>Receipt</title>
    <style>
      body { font-family: monospace; font-size: 12px; padding: 5px; width: 58mm; }
      .center { text-align: center; }
      .line { border-bottom: 1px dashed #000; margin: 4px 0; }
      .right { text-align: right; }
      .bold { font-weight: bold; }
      .items { margin-bottom: 5px; }
    </style>
  </head>
  <body>
    <!-- Store Header -->
    <div class="center bold">
      DA Constance Fluff 'N Stuff<br>
      Pet Supplies Store<br>
      Address: Pasig City, Metro Manilae<br>
      Business Email: srjdee@gmail.com<br>
      Transaction #: ${receiptNum}<br>

      DATE: ${new Date().toLocaleString()}
    </div>

    <div class="line"></div>

    <!-- Items -->
    <div class="items">
      <strong>Item             QTY   TOTAL</strong><br>
      ${itemsHTML}
    </div>

    <div class="line"></div>

    <!-- Totals & VAT -->
    <div>Total Qty:       ${totalQty}</div>
    <div>Gross Amount:    ₱${grossAmount.toFixed(2)}</div>
    <div>Vatable Amount:  ₱${vatableAmount}</div>
    <div>VAT-Exempt Sales:₱${vatExemptSales}</div>
    <div>VAT Zero-Rate Sales:₱0.00</div>
    <div>12% VAT:         ₱${vat}</div>

    <div class="line"></div>

    <!-- Payment -->
    <div>Bill Amount:     ₱${billAmount.toFixed(2)}</div>
    <div>Cash:            ₱${paid.toFixed(2)}</div>
    <div>Change:          ₱${change}</div>
    <div>Discount:        ₱${displayDiscount.textContent}</div>

    <div class="line"></div>

    <!-- Footer -->
    <div class="center">
      Thank you for your purchase!<br>
      Visit us again!
    </div>
  </body>
</html>
`);

      receiptWindow.document.close();
      receiptWindow.focus();
      receiptWindow.print();
      receiptWindow.close();

      cart.length = 0;
      renderCart();
      paymentSection.classList.add('hidden');
      confirmPaymentBtn.style.display = 'inline-block';

      resetPOS();
    }
  });

  function resetPOS() {
    // Clear cart
    cart.length = 0;
    renderCart();

    // Reset totals & receipt fields
    totalDue = 0;
    displayDiscount.textContent = '0.00';
    displayTotal.textContent = '0.00';
    changeAmount1.textContent = '0.00';

    for (let key in receiptFields) {
      if (receiptFields[key]) receiptFields[key].textContent = '0.00';
    }
    receiptFields.totalQty.textContent = '0';

    // Reset input fields
    skuInput.value = '';
    qtyInput.value = '';
    paymentAmountInput.value = '';
    document.getElementById('transaction-number').value = '';
    document.getElementById('senior-id').value = '';
    document.getElementById('pwd-id').value = '';

    // Reset dropdowns
    discountSelect.value = 'none';
    paymentMethodSelect.value = 'cash';

    // Hide extra fields
    seniorField.classList.add('hidden');
    pwdField.classList.add('hidden');
    transactionNumberGroup.classList.add('hidden');

    // Reset UI state
    paymentSection.classList.add('hidden');
    confirmPaymentBtn.style.display = 'inline-block';
    finalizePaymentBtn.disabled = true;

    // Focus back on SKU input
    skuInput.focus();
  }

  skuInput.focus();

  // Handle Enter key
  [skuInput, qtyInput].forEach(input => {
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const quantity = parseInt(qtyInput.value);
        const skuOrName = skuInput.value.trim();
        if (skuOrName && quantity > 0) addToCartBtn.click();
      }
    });
  });

  // --- Product preview ---
  skuInput.addEventListener('input', async () => {
    const val = skuInput.value.trim();
    if (!val) {
      preview.innerHTML = '';
      preview.classList.add('hidden');
      return;
    }

    const results = await searchProduct(val);
    if (!results.length) {
      preview.innerHTML = '';
      preview.classList.add('hidden');
      return;
    }

    // Clear previous preview
    preview.innerHTML = '';
    preview.classList.remove('hidden');

    // Scrollable container for suggestions
    const listContainer = document.createElement('div');
    listContainer.classList.add('preview-list');

    results.forEach(product => {
      const price = parseFloat(product.price.$numberDecimal || product.price);
      const itemDiv = document.createElement('div');
      itemDiv.classList.add('preview-item');

      // Add sold-out style if quantity is 0
      if (product.quantity === 0) {
        itemDiv.style.opacity = '0.5';
        itemDiv.style.pointerEvents = 'none'; // prevent clicking
      }

      const desc = product.description || '';
      const shortDesc = desc.length > 10 ? desc.slice(0, 10) + '...' : desc;

      itemDiv.innerHTML = `
      <img src="${product.imageUrl || './assets/default.png'}" />
      <div>
        <p style="font-weight:bold;">${product.name}</p>
        <p style="font-size:1rem;color:#555;"><strong>SKU:</strong> ${
          product.sku
        }</p>
        <p><strong>Price:</strong> ₱${price.toFixed(2)}</p>
        <p style="font-size:1rem;color:#555;"><strong>Desc: </strong>${shortDesc}</p>
        <p style="color:green;font-weight:bold;">${
          product.quantity === 0 ? 'Sold Out' : `Qty: ${product.quantity}`
        }</p>
      </div>
    `;

      // Click to fill input & add to cart (skip if sold out)
      if (product.quantity > 0) {
        itemDiv.addEventListener('click', () => {
          listContainer.querySelectorAll('.preview-item').forEach(el => {
            el.classList.remove('selected');
          });
          itemDiv.classList.add('selected');
          skuInput.value = product.sku;
          qtyInput.value = 1;
        });
      }

      listContainer.appendChild(itemDiv);
    });

    preview.appendChild(listContainer);
  });

  // Add to cart
  addToCartBtn.addEventListener('click', async () => {
    const skuOrName = skuInput.value.trim();
    const quantity = parseInt(qtyInput.value);

    if (!skuOrName) return alert('Please enter a SKU or product name.');
    if (isNaN(quantity) || quantity <= 0) return alert('Invalid quantity.');

    const results = await searchProduct(skuOrName);
    const product = results[0];
    if (!product) return alert('Product not found.');

    const price = parseFloat(product.price.$numberDecimal || product.price);

    if (quantity > product.quantity) {
      return alert(`Only ${product.quantity} pcs available in stock.`);
    }
    const existingItem = cart.find(item => item.sku === product.sku);
    if (existingItem) {
      existingItem.quantity += quantity;
      existingItem.total = existingItem.quantity * price;
    } else {
      cart.push({
        _id: product._id,
        sku: product.sku,
        name: product.name,
        price,
        quantity,
        total: quantity * price,
        vatType: product.vatType || 'vatable',
        img: product.imageUrl || './assets/default.png',
        stock: product.quantity, // ✅ keep track of max stock
      });
    }

    renderCart();
    skuInput.value = '';
    qtyInput.value = '';
    preview.classList.add('hidden');
    skuInput.focus();
  });

  // Update renderCart to include checkboxes when in void mode
  function renderCart() {
    cartTable.innerHTML = '';
    cart.forEach((item, index) => {
      const row = document.createElement('tr');

      row.innerHTML = `
      <td class="${voidMode ? '' : 'hidden'}">
        <input type="checkbox" class="void-checkbox" data-index="${index}" />
      </td>
      <td><img src="${item.img}" width="40" /></td>
      <td>${item.name}</td>
      <td>${item.sku}</td>
      <td>₱${item.price.toFixed(2)}</td>
      <td>${item.quantity}</td>
      <td>₱${item.total.toFixed(2)}</td>
      <td>
        <button class="qty-btn" data-index="${index}" data-action="increase">+</button>
        <button class="qty-btn" data-index="${index}" data-action="decrease">-</button>
      </td>
    `;
      cartTable.appendChild(row);
    });

    itemCountSpan.textContent = cart.length;
    totalAmountSpan.textContent = cart
      .reduce((sum, item) => sum + item.total, 0)
      .toFixed(2);

    document.querySelectorAll('.qty-btn').forEach(btn => {
      btn.addEventListener('click', handleQtyChange);
    });

    const checkboxHeader = document.querySelector('.void-checkbox-header');

    if (voidMode) {
      checkboxHeader.classList.remove('hidden'); // show
    } else {
      checkboxHeader.classList.add('hidden'); // hide
    }
    updateVoidButtonState(); // update void button visibility and disabled state
  }

  function handleQtyChange(e) {
    const index = parseInt(e.target.dataset.index);
    const action = e.target.dataset.action;
    const item = cart[index];

    if (action === 'increase') {
      if (item.quantity < item.stock) {
        item.quantity++;
      } else {
        alert(`Cannot exceed available stock (${item.stock}).`);
      }
    } else if (action === 'decrease' && item.quantity > 1) {
      item.quantity--;
    }

    item.total = item.quantity * item.price;

    // Recalculate totals & update UI
    updateCartTotals();
    renderCart();
  }

  function updateCartTotals() {
    const total = cart.reduce((sum, item) => sum + item.total, 0);
    const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);

    // Update cart summary
    totalAmountSpan.textContent = total.toFixed(2);
    itemCountSpan.textContent = cart.length;

    // Apply discount if any
    const discount = discountSelect.value;
    let discountAmount = 0;
    if (discount === 'senior' || discount === 'pwd') {
      discountAmount = total * 0.2; // example 20% discount
    }

    const totalDueAmount = total - discountAmount;

    // Update visible summary
    displayDiscount.textContent = discountAmount.toFixed(2);
    displayTotal.textContent = totalDueAmount.toFixed(2);

    // Update hidden receipt fields for calculations / print
    receiptFields.totalQty.textContent = totalQty;
    receiptFields.grossAmount.textContent = total.toFixed(2);

    if (discount === 'senior' || discount === 'pwd') {
      // Senior/PWD: VAT-exempt
      receiptFields.vatableAmount.textContent = (0).toFixed(2);
      receiptFields.vat.textContent = (0).toFixed(2);
      receiptFields.vatExempt.textContent = totalDueAmount.toFixed(2);
    } else {
      // Normal transaction: VATable
      const vatable = total / 1.12;
      const vat = total - vatable;

      receiptFields.vatableAmount.textContent = vatable.toFixed(2);
      receiptFields.vat.textContent = vat.toFixed(2);
      receiptFields.vatExempt.textContent = (0).toFixed(2);
    }

    receiptFields.billAmount.textContent = totalDueAmount.toFixed(2);
    // Update change dynamically if payment amount entered
    const paid = parseFloat(paymentAmountInput.value) || 0;
    receiptFields.change.textContent = Math.max(
      paid - totalDueAmount,
      0
    ).toFixed(2);

    // Update global totalDue
    totalDue = totalDueAmount;
  }
  function updateReceiptUI(receipt) {
    if (!receiptFields.totalQty) return;

    receiptFields.totalQty.textContent = Number(receipt.totalQty).toFixed(0);
    receiptFields.grossAmount.textContent = Number(receipt.grossAmount).toFixed(
      2
    );
    receiptFields.vatableAmount.textContent = Number(
      receipt.vatableAmount
    ).toFixed(2);
    receiptFields.vatExempt.textContent = Number(
      receipt.vatExemptSales
    ).toFixed(2);
    receiptFields.vatZero.textContent = Number(
      receipt.vatZeroRatedSales
    ).toFixed(2);
    receiptFields.vat.textContent = Number(receipt.vat).toFixed(2);
    receiptFields.billAmount.textContent = Number(receipt.billAmount).toFixed(
      2
    );
    receiptFields.change.textContent = Number(receipt.change).toFixed(2);
  }
});
