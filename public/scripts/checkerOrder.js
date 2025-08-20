import orderAPI from '../scripts/api/supplyOrder.js';
import { getCategoriesAPI } from '../scripts/api/category.js';

document.addEventListener('DOMContentLoaded', async () => {
  const tableBody = document.querySelector('#order-table tbody');

  const filterDate = document.getElementById('filter-date');
  const filterStatus = document.getElementById('filter-status');
  const filterSupplier = document.getElementById('filter-supplier');

  const filterBtn = document.getElementById('filter-btn');

  const receiveModal = document.getElementById('receiveModal');
  const qtyInput = document.getElementById('receivedQty');
  const confirmBtn = document.getElementById('confirmReceive');
  const closeBtn = document.getElementById('closeModal');

  let currentPage = 1;
  let totalPages = 1;
  const pageLimit = 10;
  const paginationContainer = document.getElementById('pagination');

  let orders = [];
  let selectedOrderId = null;
  let sortField = null;
  let sortOrder = 'asc';

  // -------------------- LOAD ORDERS --------------------
  async function loadOrders(filters = {}, page = 1) {
    try {
      const query = { ...filters, limit: pageLimit, page };
      const response = await orderAPI.getAllOrders(query);

      const list = (response.data || []).map(o => ({
        ...o,
        deliveredQuantity: o.deliveredQuantity ?? o.delivedQuantity ?? 0,
      }));

      orders = list;
      currentPage = page;
      totalPages = Math.ceil((response.total || list.length) / pageLimit);

      renderOrders(orders);
      renderPagination(); // <-- must be called here
    } catch (err) {
      console.error(err);
      tableBody.innerHTML =
        '<tr><td colspan="10" style="text-align:center;color:red;">Failed to load orders.</td></tr>';
    }
  }

  // -------------------- PAGINATION --------------------
  function renderPagination() {
    paginationContainer.innerHTML = '';

    if (totalPages <= 1) return; // won't render if 1 or 0 pages

    // Prev Button
    const prevBtn = document.createElement('button');
    prevBtn.textContent = 'Prev';
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => loadOrders(getFilters(), currentPage - 1);
    paginationContainer.appendChild(prevBtn);

    // Page buttons
    for (let i = 1; i <= totalPages; i++) {
      const btn = document.createElement('button');
      btn.textContent = i;
      btn.disabled = i === currentPage;
      btn.className = i === currentPage ? 'active' : '';
      btn.onclick = () => loadOrders(getFilters(), i);
      paginationContainer.appendChild(btn);
    }

    // Next Button
    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Next';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = () => loadOrders(getFilters(), currentPage + 1);
    paginationContainer.appendChild(nextBtn);
  }

  // -------------------- RENDER ORDERS --------------------
  function renderOrders(list = []) {
    tableBody.innerHTML = '';
    const today = new Date();

    if (!list.length) {
      tableBody.innerHTML =
        '<tr><td colspan="10" style="text-align:center;color:gray;">No orders found.</td></tr>';
      return;
    }

    list.forEach(order => {
      const delivery = new Date(order.deliveryDate);
      const isOverdue = order.status === 'pending' && delivery < today;

      const row = document.createElement('tr');
      if (isOverdue) row.style.backgroundColor = '#ffe5e5';

      const product = order.productId || {};
      const deliveredDate = order.deliveredDate
        ? new Date(order.deliveredDate).toLocaleDateString()
        : '-';

      // Determine delivery status
      let deliveryStatus = '';
      if (order.status === 'pending')
        deliveryStatus =
          '<span style="color:#d97706;font-weight:bold;">Pending</span>';
      else if (order.status === 'cancelled')
        deliveryStatus =
          '<span style="color:#dc2626;font-weight:bold;">Cancelled</span>';
      else if (order.status === 'delivered') {
        const orderedQty = order.orderQuantity || 0;
        const deliveredQty = order.deliveredQuantity || 0;
        if (deliveredQty === orderedQty)
          deliveryStatus =
            '<span style="color:#16a34a;font-weight:bold;">Complete</span>';
        else if (deliveredQty < orderedQty)
          deliveryStatus = `<span style="color:#f59e0b;font-weight:bold;">Insufficient (${deliveredQty}/${orderedQty})</span>`;
        else
          deliveryStatus = `<span style="color:#2563eb;font-weight:bold;">Over-delivery (${deliveredQty}/${orderedQty})</span>`;
      }

      // Actions
      const actionContent =
        order.status === 'pending'
          ? `<div class="action-buttons">
             <button class="receive-btn" data-id="${order._id}">Received</button>
             <button class="cancel-btn" data-id="${order._id}">Cancel</button>
           </div>`
          : '<span style="color:#6b7280;">Completed</span>';

      row.innerHTML = `
      <td><img src="${product.imageUrl || '/assets/noimage.png'}" alt="${
        product.name || ''
      }" width="50"/></td>
      <td>${product.name || ''}</td>
      <td>${order.orderQuantity}</td>
      <td>${order.deliveredQuantity}</td>
      <td>₱${Number(
        product.price?.$numberDecimal || product.price || 0
      ).toFixed(2)}</td>
      <td>${order.supplierName}</td>
      <td>${new Date(order.deliveryDate).toLocaleDateString()}</td>
      <td>${deliveredDate}</td>
      <td>${deliveryStatus}</td>
      <td>${actionContent}</td>
    `;
      tableBody.appendChild(row);
    });

    attachRowActions();
  }

  // -------------------- FILTERS --------------------
  function getFilters() {
    const filters = {};
    if (filterDate.value) filters.deliveryDate = filterDate.value;
    if (filterStatus.value) filters.status = filterStatus.value.toLowerCase();
    if (filterSupplier.value.trim())
      filters.supplier = filterSupplier.value.trim();
    if (filterCategory.value) filters.category = filterCategory.value;
    return filters;
  }

  filterBtn.onclick = () => loadOrders(getFilters());

  // -------------------- MODAL --------------------
  confirmBtn.onclick = async () => {
    const qty = parseInt(qtyInput.value, 10);
    if (!qty || qty <= 0) return alert('Please enter a valid quantity.');
    try {
      await orderAPI.updateStatus(selectedOrderId, 'delivered', qty);
      alert('Order received successfully.');
      receiveModal.classList.add('hidden');
      qtyInput.value = '';
      await loadOrders(getFilters());
    } catch (err) {
      console.error(err);
      alert('Failed to receive order.');
    }
  };

  closeBtn.onclick = () => {
    receiveModal.classList.add('hidden');
    qtyInput.value = '';
  };

  // -------------------- ROW ACTIONS --------------------
  function attachRowActions() {
    document.querySelectorAll('.receive-btn').forEach(btn => {
      btn.onclick = () => {
        selectedOrderId = btn.dataset.id;
        receiveModal.classList.remove('hidden');
      };
    });

    document.querySelectorAll('.cancel-btn').forEach(btn => {
      btn.onclick = async () => {
        const id = btn.dataset.id;
        if (!confirm('Are you sure you want to cancel this order?')) return;
        try {
          await orderAPI.updateStatus(id, 'cancelled');
          alert('Order cancelled successfully.');
          await loadOrders(getFilters());
        } catch (err) {
          console.error(err);
          alert('Failed to cancel order.');
        }
      };
    });
  }

  // -------------------- INITIAL LOAD --------------------
  await loadOrders();
});
