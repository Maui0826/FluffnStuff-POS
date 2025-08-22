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

  const toggleBtn = document.getElementById('edit-quantity-toggle');
  const adjustmentFields = document.getElementById(
    'quantity-adjustment-fields'
  );

  let currentPage = 1;
  const limit = 10;
  let totalPages = 1;
  const paginationContainer = document.getElementById('pagination');

  let products = [];
  let currentUpdateProduct = null;
  let sortField = null;
  let sortOrder = 'asc';

  // ------------------- ORDER MODAL -------------------
  const orderModal = document.getElementById('order-product-modal');
  const orderForm = document.getElementById('order-product-form');
  const closeOrderModal = document.getElementById('close-order-product');
  const bulkOrderBtn = document.querySelector('.order-btn');
  let multiOrderProducts = [];

  // -------------------- LOAD SUPPLIERS FOR FILTER --------------------
  async function loadSuppliersFilter() {
    try {
      const supplierFilter = document.getElementById('supplier-filter');
      if (!supplierFilter)
        return console.warn('supplier-filter element not found');

      const res = await productAPI.getAllProductsAPI({ page: 1, limit: 1000 });
      const suppliersSet = new Set();

      res.items.forEach(product => {
        if (product.supplierName) {
          product.supplierName
            .split(',')
            .forEach(name => suppliersSet.add(name.trim()));
        }
      });

      supplierFilter.innerHTML = '<option value="">All Suppliers</option>';
      Array.from(suppliersSet).forEach(name => {
        supplierFilter.append(new Option(name, name));
      });
    } catch (err) {
      console.error('Failed to load suppliers for filter:', err);
    }
  }

  // add product
  addProductForm.addEventListener('submit', async e => {
    e.preventDefault();

    const formData = new FormData();

    formData.append('sku', document.getElementById('product-sku').value.trim());
    formData.append(
      'productName',
      document.getElementById('product-name').value.trim()
    );
    formData.append(
      'categoryId',
      document.getElementById('product-category').value
    );
    formData.append('price', document.getElementById('product-price').value);
    formData.append(
      'acquisition',
      document.getElementById('product-acquisition').value
    );
    formData.append(
      'supplierName',
      document.getElementById('suppliers-name').value.trim()
    );
    formData.append(
      'quantity',
      document.getElementById('product-quantity').value
    );
    formData.append(
      'lowStockThreshold',
      document.getElementById('product-low-threshold').value
    );
    formData.append(
      'description',
      document.getElementById('product-description').value.trim()
    );

    // Handle file if uploaded
    const fileInput = document.getElementById('product-img-file');
    if (fileInput.files.length > 0) {
      formData.append('image', fileInput.files[0]); // match Multer's "image"
    } else {
      formData.append(
        'imageUrl',
        document.getElementById('product-img-url').value.trim()
      );
    }

    try {
      await productAPI.createProductAPI(formData); // <-- must send FormData
      alert('Product added successfully!');
      addProductModal.style.display = 'none';
      addProductForm.reset();
      await loadProducts(currentPage);
    } catch (err) {
      console.error('Failed to add product:', err);
      alert('Error adding product. Please try again.');
    }
  });

  // ------------------- LOAD PRODUCTS FOR ORDER -------------------
  async function loadProductsForOrder() {
    try {
      const res = await productAPI.getAllProductsAPI({ page: 1, limit: 1000 });
      const allProducts = res.items;
      const tbody = document.querySelector('#order-products-table tbody');
      tbody.innerHTML = '';
      multiOrderProducts = [];

      allProducts.forEach((p, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
        <td><input type="checkbox" class="order-product-checkbox" data-index="${index}"/></td>
        <td>${p.name}</td>
        <td>${p.quantity}</td>
        <td><input type="number" min="1" value="1" class="order-quantity-input" data-index="${index}" style="display:none;"/></td>
        <td><input type="number" min="0" step="0.01" value="${
          p.acquisitionPrice || 0
        }" class="acquisition-input" data-index="${index}" style="display:none;"/></td>
      `;
        tbody.appendChild(tr);

        multiOrderProducts[index] = {
          id: p._id,
          name: p.name,
          quantity: p.quantity,
          selected: false,
          orderQuantity: 1,
          acquisitionPrice: p.acquisitionPrice || 0,
        };
      });

      // Checkbox change
      document.querySelectorAll('.order-product-checkbox').forEach(cb => {
        cb.addEventListener('change', e => {
          const i = e.target.dataset.index;
          multiOrderProducts[i].selected = e.target.checked;

          // Show/hide order quantity & acquisition
          const orderInput = document.querySelector(
            `.order-quantity-input[data-index="${i}"]`
          );
          const acquisitionInput = document.querySelector(
            `.acquisition-input[data-index="${i}"]`
          );
          orderInput.style.display = e.target.checked ? 'inline-block' : 'none';
          acquisitionInput.style.display = e.target.checked
            ? 'inline-block'
            : 'none';
        });
      });

      // Order quantity input change
      document.querySelectorAll('.order-quantity-input').forEach(input => {
        input.addEventListener('input', e => {
          const i = e.target.dataset.index;
          multiOrderProducts[i].orderQuantity = parseInt(e.target.value || 1);
        });
      });

      // Acquisition price change
      document.querySelectorAll('.acquisition-input').forEach(input => {
        input.addEventListener('input', e => {
          const i = e.target.dataset.index;
          multiOrderProducts[i].acquisitionPrice = parseFloat(
            e.target.value || 0
          );
        });
      });
    } catch (err) {
      console.error('Failed to load products for order:', err);
    }
  }

  // ------------------- OPEN/CLOSE ORDER MODAL -------------------
  // ------------------- CALL IT ON ORDER MODAL OPEN -------------------
  bulkOrderBtn.onclick = async () => {
    await loadProductsForOrder();
    await loadSuppliersForOrder(); // populate dropdown
    orderModal.style.display = 'flex';
  };

  closeOrderModal.onclick = () => {
    orderModal.style.display = 'none';
    orderForm.reset();
    multiOrderProducts = [];
  };

  window.onclick = e => {
    if (e.target === orderModal) {
      orderModal.style.display = 'none';
      orderForm.reset();
      multiOrderProducts = [];
    }
  };

  // ------------------- SUBMIT ORDER -------------------
  orderForm.onsubmit = async e => {
    e.preventDefault();

    let supplierName = document
      .getElementById('order-supplier-name')
      .value.trim();
    const customSupplier = document
      .getElementById('custom-supplier-input')
      .value.trim();
    if (supplierName === '__other__') {
      if (!customSupplier) return alert('Please enter a supplier name.');
      supplierName = customSupplier;
    }

    const deliveryDate = document.getElementById(
      'order-expected-delivery'
    ).value;
    const selectedProducts = multiOrderProducts.filter(p => p.selected);

    if (!supplierName || !deliveryDate || !selectedProducts.length) {
      return alert(
        'Please provide all details and select at least one product.'
      );
    }

    try {
      await productAPI.orderStockAPI({
        supplierName,
        deliveryDate,
        products: selectedProducts.map(p => ({
          productId: p.id,
          orderQuantity: parseFloat(p.orderQuantity || 1),
          acquisitionPrice: parseFloat(p.acquisitionPrice || 0),
        })),
      });

      alert('All selected products ordered successfully!');
      orderModal.style.display = 'none';
      orderForm.reset();
      multiOrderProducts = [];
      await loadProducts(currentPage);
    } catch (err) {
      console.error(err);
      alert('Failed to place orders.');
    }
  };

  // ------------------- LOAD PRODUCTS -------------------
  const searchInput = document.getElementById('search-input');
  const supplierFilter = document.getElementById('supplier-filter');
  const applyFiltersBtn = document.getElementById('apply-filters');

  async function loadProducts(page = 1) {
    const search = searchInput.value.trim();
    const supplier = supplierFilter.value.trim();
    try {
      const { items: rawProducts, totalCount } =
        await productAPI.getAllProductsAPI({ page, limit, search, supplier });
      products = rawProducts.map(p => ({ ...p, id: p._id || p.id }));
      totalPages = Math.ceil(totalCount / limit);
      currentPage = page;
      renderProducts();
      renderPagination();
    } catch (err) {
      console.error('Error fetching products:', err);
      inventoryBody.innerHTML = `<tr><td colspan="10">Failed to load products.</td></tr>`;
    }
  }

  applyFiltersBtn.addEventListener('click', () => loadProducts(1));
  searchInput.addEventListener('keyup', e => {
    if (e.key === 'Enter') loadProducts(1);
  });

  function renderPagination() {
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';
    const prevBtn = document.createElement('button');
    prevBtn.textContent = 'Prev';
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => loadProducts(currentPage - 1);
    pagination.appendChild(prevBtn);
    for (let i = 1; i <= totalPages; i++) {
      const btn = document.createElement('button');
      btn.textContent = i;
      if (i === currentPage) btn.classList.add('active');
      btn.onclick = () => loadProducts(i);
      pagination.appendChild(btn);
    }
    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Next';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = () => loadProducts(currentPage + 1);
    pagination.appendChild(nextBtn);
  }

  function renderProducts() {
    inventoryBody.innerHTML = '';
    if (!products.length)
      return (inventoryBody.innerHTML = `<tr><td colspan="9">No products available.</td></tr>`);

    let sortedProducts = [...products];
    const field = sortField || 'quantity';
    const order = sortOrder || 'asc';
    sortedProducts.sort((a, b) => {
      let aVal = a[field];
      let bVal = b[field];
      if (aVal?._bsontype === 'Decimal128') aVal = parseFloat(aVal.toString());
      if (bVal?._bsontype === 'Decimal128') bVal = parseFloat(bVal.toString());
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
        <td><img src="${product.imageUrl || '/assets/noimage.png'}" alt="${
        product.name || 'No Image'
      }" width="50"/></td>
        <td>${product.sku}</td>
        <td>${product.name}</td>
        <td>${product.categoryName || ''}</td>
        <td>₱${price.toFixed(2)}</td>
        <td>₱${acquisition.toFixed(2)}</td>
        <td>${product.supplierName || ''}</td>
        <td class="${
          product.quantity < (product.lowStockThreshold || 5) ? 'low-stock' : ''
        }">${product.quantity}</td>
        <td>${product.description || ''}</td>
        <td class="action-btns">
          <button class="update-btn" data-id="${product._id}">Update</button>
          <button class="delete-btn" data-id="${product._id}">Delete</button>
        </td>
      `;
      inventoryBody.appendChild(row);
    });

    attachEventListeners();
  }

  headers.forEach(header => {
    header.addEventListener('click', () => {
      const field = header.querySelector('.sort-icon')?.dataset.key;
      if (!field) return;
      if (sortField === field) sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
      else {
        sortField = field;
        sortOrder = 'asc';
      }
      renderProducts();
    });
  });

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
  }

  // ------------------- LOAD SUPPLIERS FOR ORDER -------------------
  async function loadSuppliersForOrder() {
    try {
      const res = await productAPI.getAllProductsAPI({ page: 1, limit: 1000 });
      const suppliersSet = new Set();

      res.items.forEach(p => {
        if (p.supplierName) {
          p.supplierName.split(',').forEach(n => suppliersSet.add(n.trim()));
        }
      });

      const orderSupplierSelect = document.getElementById(
        'order-supplier-name'
      );
      const customInput = document.getElementById('custom-supplier-input');

      // Reset
      orderSupplierSelect.innerHTML =
        '<option value="">Select Supplier</option>';

      // Populate suppliers
      Array.from(suppliersSet).forEach(name => {
        orderSupplierSelect.append(new Option(name, name));
      });

      // Add "Other" option
      orderSupplierSelect.append(new Option('Other', '__other__'));

      // Show/hide custom input
      orderSupplierSelect.addEventListener('change', e => {
        customInput.style.display =
          e.target.value === '__other__' ? 'inline-block' : 'none';
      });
    } catch (err) {
      console.error('Failed to load suppliers for order:', err);
    }
  }

  // -------------------- LOAD CATEGORIES --------------------
  async function loadCategories() {
    try {
      const addSelect = document.getElementById('product-category');
      const updateSelect = document.getElementById('update-category');

      // Fetch categories from API
      const categories = await loadCategoriesAPI();

      // Reset select options
      addSelect.innerHTML = '<option value="">Select Category</option>';
      updateSelect.innerHTML = '<option value="">Select Category</option>';

      // Use DocumentFragment to improve performance
      const addFragment = document.createDocumentFragment();
      const updateFragment = document.createDocumentFragment();

      categories.forEach(cat => {
        const value = cat._id || cat.id;
        addFragment.appendChild(new Option(cat.name, value));
        updateFragment.appendChild(new Option(cat.name, value));
      });

      addSelect.appendChild(addFragment);
      updateSelect.appendChild(updateFragment);
    } catch (error) {
      console.error('Failed to load categories:', error);
      alert('Error loading categories. Please try again.');
    }
  }

  function openUpdateModal(product) {
    document.getElementById('update-sku').value = product.sku || '';
    document.getElementById('update-name').value = product.name || '';
    document.getElementById('update-price').value =
      product.price?.$numberDecimal || product.price || 0;
    document.getElementById('update-acquisition').value =
      product.acquisitionPrice
        ? parseFloat(
            product.acquisitionPrice?.$numberDecimal || product.acquisitionPrice
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

  toggleBtn?.addEventListener('click', () =>
    adjustmentFields.classList.toggle('hidden')
  );
  addProductBtn.onclick = () => (addProductModal.style.display = 'flex');
  closeAddProduct.onclick = () => (addProductModal.style.display = 'none');
  closeUpdateModal.onclick = () => (updateModal.style.display = 'none');
  window.onclick = e => {
    if (e.target === addProductModal) addProductModal.style.display = 'none';
    if (e.target === updateModal) updateModal.style.display = 'none';
  };

  // ------------------- INITIAL LOAD -------------------
  loadCategories();
  loadSuppliersFilter();
  loadProducts(currentPage);
});
