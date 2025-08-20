import productAPI from '../scripts/api/product.js';
import {
  getCategoriesAPI,
  loadCategoriesAPI,
} from '../scripts/api/category.js';

document.addEventListener('DOMContentLoaded', () => {
  const inventoryBody = document.getElementById('inventory-body');
  const headers = document.querySelectorAll('.sortable');

  const addProductBtn = document.getElementById('add-product-btn');
  const addProductModal = document.getElementById('add-product-modal');
  const closeAddProduct = document.getElementById('close-add-product');
  const addProductForm = document.getElementById('add-product-form');

  const updateModal = document.getElementById('update-product-modal');
  const updateForm = document.getElementById('update-product-form');
  const closeUpdateModal = document.getElementById('close-update-product');

  const orderModal = document.getElementById('order-product-modal');
  const orderForm = document.getElementById('order-product-form');
  const closeOrderModal = document.getElementById('close-order-product');

  const toggleBtn = document.getElementById('edit-quantity-toggle');
  const adjustmentFields = document.getElementById(
    'quantity-adjustment-fields'
  );

  let currentPage = 1;
  const limit = 10; // items per page
  let totalPages = 1;
  const paginationContainer = document.getElementById('pagination');

  let products = [];
  let currentUpdateProduct = null;
  let currentOrderProduct = null;
  let sortField = null;
  let sortOrder = 'asc';

  // -------------------- LOAD CATEGORIES --------------------
  async function loadCategories() {
    const addSelect = document.getElementById('product-category');
    const updateSelect = document.getElementById('update-category');

    const categories = await loadCategoriesAPI(); // call API service

    // Reset select options
    addSelect.innerHTML = '<option value="">Select Category</option>';
    updateSelect.innerHTML = '<option value="">Select Category</option>';

    // Populate categories
    categories.forEach(cat => {
      const value = cat._id || cat.id;
      addSelect.append(new Option(cat.name, value));
      updateSelect.append(new Option(cat.name, value));
    });
  }

  // -------------------- LOAD PRODUCTS --------------------
  async function loadProducts(page = 1) {
    try {
      const { items: rawProducts, totalCount } =
        await productAPI.getAllProductsAPI({ page, limit });

      products = rawProducts.map(p => ({ ...p, id: p._id || p.id }));

      totalPages = Math.ceil(totalCount / limit);
      currentPage = page;

      renderProducts();
      renderPagination();
    } catch (err) {
      console.error('Error fetching products:', err);
      inventoryBody.innerHTML = `<tr><td colspan="9">Failed to load products.</td></tr>`;
    }
  }

  // -------------------- Pagination --------------------
  function renderPagination() {
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';

    // Prev button
    const prevBtn = document.createElement('button');
    prevBtn.textContent = 'Prev';
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => goToPage(currentPage - 1);
    pagination.appendChild(prevBtn);

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
      const btn = document.createElement('button');
      btn.textContent = i;
      if (i === currentPage) btn.classList.add('active');
      btn.onclick = () => goToPage(i);
      pagination.appendChild(btn);
    }

    // Next button
    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Next';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = () => goToPage(currentPage + 1);
    pagination.appendChild(nextBtn);
  }

  function goToPage(page) {
    if (page < 1 || page > totalPages) return;
    loadProducts(page);
  }

  // -------------------- RENDER PRODUCTS --------------------
  function renderProducts() {
    inventoryBody.innerHTML = '';

    if (!products.length) {
      inventoryBody.innerHTML = `<tr><td colspan="9">No products available.</td></tr>`;
      return;
    }

    let sortedProducts = [...products];
    // Ensure sortField is set
    const field = sortField || 'quantity';
    const order = sortOrder || 'asc';
    sortedProducts.sort((a, b) => {
      let aVal = a[field];
      let bVal = b[field];

      // Handle Decimal128 from MongoDB
      if (aVal?._bsontype === 'Decimal128') aVal = parseFloat(aVal.toString());
      if (bVal?._bsontype === 'Decimal128') bVal = parseFloat(bVal.toString());

      // Numeric fields
      if (['price', 'acquisitionPrice', 'quantity'].includes(field)) {
        aVal = parseFloat(aVal || 0);
        bVal = parseFloat(bVal || 0);
      } else {
        aVal = (aVal || '').toString().toLowerCase();
        bVal = (bVal || '').toString().toLowerCase();
      }

      if (aVal < bVal) return order === 'asc' ? -1 : 1;
      if (aVal > bVal) return order === 'asc' ? 1 : -1;
      return 0;
    });

    sortedProducts.forEach(product => {
      const price = parseFloat(
        product.price?.$numberDecimal || product.price || 0
      );
      const acquisition = parseFloat(
        product.acquisitionPrice?.$numberDecimal ||
          product.acquisitionPrice ||
          0
      );

      const row = document.createElement('tr');
      row.dataset.id = product._id;
      row.innerHTML = `
       <td>
  <img 
    src="${product.imageUrl || '/assets/noimage.png'}" 
    alt="${product.name || 'No Image'}" 
    width="50"
  />
</td>

        <td>${product.sku}</td>
        <td>${product.name}</td>
        <td>${product.categoryName || ''}</td>
        <td>₱${price.toFixed(2)}</td>
        <td>₱${acquisition.toFixed(2)}</td>
        <td class="${
          product.quantity < (product.lowStockThreshold || 5) ? 'low-stock' : ''
        }">
          ${product.quantity}
        </td>
        <td>${product.description || ''}</td>
        <td class="action-btns">
          <button class="update-btn" data-id="${product._id}">Update</button>
          <button class="order-btn" data-id="${product._id}">Order</button>
          <button class="delete-btn" data-id="${product._id}">Delete</button>
        </td>
      `;
      inventoryBody.appendChild(row);
    });

    attachEventListeners();
  }

  // -------------------- SORT HEADER CLICK --------------------
  headers.forEach(header => {
    header.addEventListener('click', () => {
      const field = header.querySelector('.sort-icon')?.dataset.key;
      if (!field) return;

      if (sortField === field) {
        sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
      } else {
        sortField = field;
        sortOrder = 'asc';
      }
      renderProducts();
    });
  });

  // -------------------- ATTACH EVENT LISTENERS --------------------
  function attachEventListeners() {
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.onclick = async () => {
        const id = btn.dataset.id;
        const index = products.findIndex(p => p.id === id);
        if (index === -1) return;
        if (!confirm('Are you sure you want to delete this product?')) return;
        try {
          await productAPI.deleteProductAPI(id);
          products.splice(index, 1);
          renderProducts();
        } catch {
          alert('Failed to delete product.');
        }
      };
    });

    document.querySelectorAll('.update-btn').forEach(btn => {
      btn.onclick = () => {
        const id = btn.dataset.id;
        currentUpdateProduct = products.find(p => p.id === id);
        if (!currentUpdateProduct) return;
        openUpdateModal(currentUpdateProduct);
      };
    });

    document.querySelectorAll('.order-btn').forEach(btn => {
      btn.onclick = () => {
        const id = btn.dataset.id;
        currentOrderProduct = products.find(p => p.id === id);
        if (!currentOrderProduct) return;
        orderModal.style.display = 'flex';
      };
    });
  }

  // -------------------- OPEN UPDATE MODAL --------------------
  function openUpdateModal(product) {
    document.getElementById('update-sku').value = product.sku || '';
    document.getElementById('update-name').value = product.name || '';
    document.getElementById('update-price').value =
      product.price?.$numberDecimal || product.price || 0;
    document.getElementById('update-acquisition').value =
      product.acquisitionPrice
        ? parseFloat(
            product.acquisitionPrice.$numberDecimal || product.acquisitionPrice
          )
        : product.acquisition || 0;
    document.getElementById('update-description').value =
      product.description || '';
    document.getElementById('update-low-threshold').value =
      product.lowStockThreshold || 5;
    document.getElementById('update-category').value = product.categoryId || '';
    document.getElementById('update-img-url').value = product.imageUrl || '';
    updateModal.style.display = 'flex';
  }
  addProductForm.onsubmit = async e => {
    e.preventDefault();

    const sku = document.getElementById('product-sku').value.trim();
    const productName = document.getElementById('product-name').value.trim();
    const categoryName = document
      .getElementById('product-category')
      .value.trim();
    const quantity = parseInt(
      document.getElementById('product-quantity').value,
      10
    );
    const description = document
      .getElementById('product-description')
      .value.trim();
    const price = parseFloat(document.getElementById('product-price').value);
    const acquisition = parseFloat(
      document.getElementById('product-acquisition').value
    );
    const lowStockThreshold = parseInt(
      document.getElementById('product-low-threshold').value,
      10
    );
    const fileInput = document.getElementById('product-img-file');
    const imageUrlInput = document.getElementById('product-img-url');

    // Validation
    if (
      !sku ||
      !productName ||
      !categoryName ||
      isNaN(quantity) ||
      isNaN(price)
    ) {
      return alert('Please fill all required fields with valid values.');
    }

    // -------------------- ADD PRODUCT --------------------

    const formData = new FormData();
    formData.append('sku', sku);
    formData.append('productName', productName);
    formData.append('categoryId', categoryName);
    formData.append('quantity', quantity);
    formData.append('description', description);
    formData.append('price', price);
    formData.append('acquisition', acquisition || 0);
    formData.append('lowStockThreshold', lowStockThreshold || 5);

    if (fileInput.files[0]) formData.append('image', fileInput.files[0]);
    else if (imageUrlInput.value.trim())
      formData.append('imageUrl', imageUrlInput.value.trim());

    try {
      await productAPI.createProductAPI(formData);
      alert('Product added successfully!');
      addProductForm.reset();
      addProductModal.style.display = 'none';
      await loadProducts(currentPage); // reload table
    } catch (err) {
      console.error('Add product failed:', err);
      alert(err?.response?.data?.message || 'Failed to add product.');
    }
  };

  // -------------------- UPDATE PRODUCT --------------------
  updateForm.onsubmit = async e => {
    e.preventDefault();
    if (!currentUpdateProduct) return;

    const formData = new FormData();
    formData.append('sku', document.getElementById('update-sku').value.trim());
    formData.append(
      'productName',
      document.getElementById('update-name').value.trim()
    );
    formData.append(
      'categoryId',
      document.getElementById('update-category').value
    );
    formData.append('price', document.getElementById('update-price').value);
    formData.append(
      'acquisitionPrice',
      document.getElementById('update-acquisition').value
    );
    formData.append(
      'description',
      document.getElementById('update-description').value.trim()
    );
    formData.append(
      'lowStockThreshold',
      document.getElementById('update-low-threshold').value
    );

    const fileInput = document.getElementById('update-img-file');
    const imgUrlInput = document.getElementById('update-img-url');

    if (fileInput.files[0]) formData.append('image', fileInput.files[0]);
    else if (imgUrlInput.value.trim())
      formData.append('imageUrl', imgUrlInput.value.trim());

    // -------------------- HANDLE STOCK ADJUSTMENT --------------------
    const quantityInput = document.getElementById('adjusted-quantity');
    const reasonInput = document.getElementById('adjustment-reason');
    const noteInput = document.getElementById('adjustment-note');

    if (quantityInput && quantityInput.value.trim() !== '') {
      const newQuantity = parseInt(quantityInput.value, 10);
      if (isNaN(newQuantity)) {
        return alert('Quantity must be a valid number.');
      }
      if (newQuantity !== currentUpdateProduct.quantity) {
        if (!reasonInput || !reasonInput.value.trim()) {
          return alert('Please provide a reason for quantity adjustment.');
        }
        formData.append('quantity', newQuantity);
        formData.append('reason', reasonInput.value.trim());
        if (noteInput && noteInput.value.trim()) {
          formData.append('note', noteInput.value.trim());
        }
      }
    }

    try {
      await productAPI.updateProductAPI(currentUpdateProduct.id, formData);

      // Reload all products to reflect changes
      await loadProducts(currentPage);

      // Close modal
      updateModal.style.display = 'none';

      // Reset the form and quantity adjustment fields
      updateForm.reset();
      adjustmentFields.classList.add('hidden');

      currentUpdateProduct = null;
    } catch (err) {
      console.error('Update failed:', err);
      alert('Failed to update product.');
    }
  };

  // -------------------- ORDER PRODUCT HANDLER --------------------
  orderForm.onsubmit = async e => {
    e.preventDefault();
    if (!currentOrderProduct) return alert('No product selected for ordering.');

    // Get values
    const supplierName = document.getElementById('supplier-name').value.trim();
    const orderQuantity = parseInt(
      document.getElementById('order-quantity').value,
      10
    );
    const deliveryDate = document.getElementById('expected-delivery').value;
    const acquisition = parseFloat(
      currentOrderProduct.acquisitionPrice?.$numberDecimal ||
        currentOrderProduct.acquisitionPrice ||
        0
    );

    // Validation
    if (!supplierName) return alert('Please enter the supplier name.');
    if (!deliveryDate) return alert('Please select a delivery date.');
    if (isNaN(orderQuantity) || orderQuantity <= 0)
      return alert('Please enter a valid order quantity.');
    if (isNaN(acquisition) || acquisition < 0)
      return alert('Invalid acquisition price.');

    // Prepare order data
    const orderData = {
      supplierName,
      orderQuantity,
      deliveryDate,
      acquisitionPrice: acquisition, // <-- match backend
    };

    try {
      // Call API
      await productAPI.orderStockAPI(currentOrderProduct.id, orderData);

      // Success feedback
      alert(`Order for "${currentOrderProduct.name}" placed successfully.`);

      // Reload products to reflect stock updates if needed
      await loadProducts(currentPage);

      // Close modal and reset form
      orderModal.style.display = 'none';
      orderForm.reset();
      currentOrderProduct = null;
    } catch (err) {
      console.error('Order failed:', err);
      alert(err?.message || 'Failed to place order.');
    }
  };

  // -------------------- TOGGLE ADJUSTMENT FIELDS --------------------
  toggleBtn?.addEventListener('click', () =>
    adjustmentFields.classList.toggle('hidden')
  );

  // -------------------- MODAL TOGGLING --------------------
  addProductBtn.onclick = () => (addProductModal.style.display = 'flex');
  closeAddProduct.onclick = () => (addProductModal.style.display = 'none');
  closeUpdateModal.onclick = () => (updateModal.style.display = 'none');
  closeOrderModal.onclick = () => (orderModal.style.display = 'none');
  window.onclick = e => {
    if (e.target === addProductModal) addProductModal.style.display = 'none';
    if (e.target === updateModal) updateModal.style.display = 'none';
    if (e.target === orderModal) orderModal.style.display = 'none';
  };

  // -------------------- INITIAL LOAD --------------------
  loadCategories();
  loadProducts(currentPage);
});
