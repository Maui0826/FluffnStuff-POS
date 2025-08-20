import {
  getAllUsersAPI,
  createUserAPI,
  banUserAPI,
  suspendUserAPI,
  unbanUserAPI,
  updateUserAPI,
} from '../scripts/api/adminManageUsers.js';

document.addEventListener('DOMContentLoaded', () => {
  const roleDropdown = document.querySelector('.dropdown');
  const searchInput = document.querySelector('.search-input');
  const searchButton = document.querySelector('.search-btn');
  const tableContainer = document.querySelector('.grid-data');

  const addUserBtn = document.getElementById('add-user-btn');
  const addUserModal = document.getElementById('add-user-modal');
  const addUserClose = document.getElementById('add-user-close');
  const addUserForm = document.getElementById('add-user-form');

  const userInfoModal = document.getElementById('user-info-modal');
  const userInfoClose = document.getElementById('modal-close');
  const userInfoBody = document.getElementById('modal-body');

  let allUsers = [];
  let selectedRole = roleDropdown?.value || 'all';
  let sortOrder = 'asc';

  let currentPage = 1;
  let totalPages = 1;
  const limit = 10; // Users per page
  const prevBtn = document.getElementById('prev-page');
  const nextBtn = document.getElementById('next-page');
  const paginationNumbers = document.getElementById('pagination-numbers');

  const updateUserModal = document.getElementById('update-user-modal');
  const updateUserClose = document.getElementById('update-user-close');
  const updateUserForm = document.getElementById('update-user-form');

  updateUserClose?.addEventListener('click', () => {
    updateUserModal.style.display = 'none';
  });

  window.addEventListener('click', e => {
    if (e.target === updateUserModal) updateUserModal.style.display = 'none';
  });

  // ---- OPEN UPDATE MODAL ----
  function openUpdateUserModal(user) {
    updateUserForm.userId.value = user._id;
    updateUserForm.firstName.value = user.name?.firstName || '';
    updateUserForm.middleName.value = user.name?.middleName || '';
    updateUserForm.lastName.value = user.name?.lastName || '';
    updateUserForm.extName.value = user.name?.extName || '';
    updateUserForm.email.value = user.email || '';
    updateUserForm.role.value = user.role || 'cashier';
    updateUserModal.style.display = 'block';
  }

  // ---- SUBMIT UPDATE ----
  updateUserForm?.addEventListener('submit', async e => {
    e.preventDefault();
    const formData = Object.fromEntries(new FormData(updateUserForm).entries());

    const userPayload = {
      name: {
        firstName: formData.firstName,
        middleName: formData.middleName,
        lastName: formData.lastName,
        extName: formData.extName,
      },
      email: formData.email,
      role: formData.role,
    };

    if (formData.password) {
      userPayload.password = formData.password; // ✅ backend will hash & update
    }

    try {
      await updateUserAPI(formData.userId, userPayload);
      alert('✅ User updated successfully!');
      updateUserModal.style.display = 'none';
      loadUsers();
    } catch (err) {
      alert(`❌ ${err.message}`);
    }
  });

  document
    .getElementById('toggleUpdatePassword')
    .addEventListener('click', () => {
      const passwordInput = document.getElementById('update-password');
      if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
      } else {
        passwordInput.type = 'password';
      }
    });

  // -------------------- MODALS --------------------
  addUserBtn?.addEventListener('click', () => {
    addUserModal.style.display = 'block';
  });
  addUserClose?.addEventListener('click', () => {
    addUserModal.style.display = 'none';
  });
  window.addEventListener('click', e => {
    if (e.target === addUserModal) addUserModal.style.display = 'none';
    if (e.target === userInfoModal) userInfoModal.style.display = 'none';
  });
  userInfoClose?.addEventListener('click', () => {
    userInfoModal.style.display = 'none';
  });

  // -------------------- SORT --------------------
  const sortNameBtn = document.getElementById('sort-name-btn');
  sortNameBtn?.addEventListener('click', () => {
    sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    sortNameBtn.classList.toggle('asc', sortOrder === 'asc');
    sortNameBtn.classList.toggle('desc', sortOrder === 'desc');
    loadUsers({ sortBy: 'name', sortOrder, role: selectedRole });
  });

  // -------------------- CREATE USER --------------------
  addUserForm?.addEventListener('submit', async e => {
    e.preventDefault();
    const formData = Object.fromEntries(new FormData(addUserForm).entries());
    const userPayload = {
      email: formData.email,
      name: {
        firstName: formData.firstName,
        middleName: formData.middleName,
        lastName: formData.lastName,
        extName: formData.extName,
      },
      role: formData.role,
    };
    try {
      await createUserAPI(userPayload);
      alert('✅ User created successfully!');
      addUserModal.style.display = 'none';
      addUserForm.reset();
      loadUsers();
    } catch (err) {
      alert(`❌ ${err.message}`);
    }
  });

  // -------------------- TABLE & RENDER --------------------
  function formatFullName(user) {
    const { firstName, middleName, lastName, extName } = user.name || {};
    return [firstName, middleName, lastName, extName].filter(Boolean).join(' ');
  }

  function clearTable() {
    tableContainer.innerHTML = '';
  }

  function renderUserRow(user) {
    const row = document.createElement('div');
    row.className = 'grid-row';
    row.style.display = 'contents';

    // Name
    const nameCell = document.createElement('div');
    nameCell.textContent = formatFullName(user) || '(No Name)';
    row.appendChild(nameCell);

    // ✅ Role
    const roleCell = document.createElement('div');
    roleCell.textContent = user.role || 'N/A';
    row.appendChild(roleCell);

    // Status
    const statusCell = document.createElement('div');
    statusCell.textContent = user.status || 'unknown';
    row.appendChild(statusCell);

    // Suspend Button
    const suspendCell = document.createElement('div');
    const suspendBtn = document.createElement('button');
    suspendBtn.className = 'suspend-btn';
    suspendBtn.textContent = 'Suspend';
    suspendBtn.dataset.id = user._id;

    // Ban & Unban Buttons
    const banCell = document.createElement('div');
    const banBtn = document.createElement('button');
    banBtn.className = 'ban-btn';
    banBtn.textContent = 'Ban';
    banBtn.dataset.id = user._id;

    const unbanBtn = document.createElement('button');
    unbanBtn.className = 'unban-btn';
    unbanBtn.textContent = 'Unban';
    unbanBtn.dataset.id = user._id;

    // Button logic based on status
    switch (user.status) {
      case 'banned':
        unbanBtn.style.display = 'inline-block';
        suspendBtn.disabled = true;
        banBtn.disabled = true;
        break;
      case 'suspended':
        suspendBtn.disabled = true;
        banBtn.style.display = 'inline-block';
        unbanBtn.disabled = true;
        break;
      case 'active':
        suspendBtn.style.display = 'inline-block';
        banBtn.style.display = 'inline-block';
        unbanBtn.disabled = true;
        break;
      default:
        suspendBtn.disabled = true;
        banBtn.disabled = true;
        unbanBtn.disabled = true;
        break;
    }

    suspendCell.appendChild(suspendBtn);
    row.appendChild(suspendCell);

    banCell.appendChild(banBtn);
    banCell.appendChild(unbanBtn);
    row.appendChild(banCell);

    // Info Button
    const infoCell = document.createElement('div');
    infoCell.innerHTML = `<button class="update-btn" data-id="${user._id}">Update</button><button class="view-btn" data-id="${user._id}">View</button>`;
    row.appendChild(infoCell);

    tableContainer.appendChild(row);

    // -------------------- BUTTON API CALLS --------------------
    suspendBtn.addEventListener('click', async () => {
      try {
        await suspendUserAPI(user._id);
        loadUsers({ role: selectedRole });
      } catch (err) {
        alert(err.message);
      }
    });

    const updateBtn = infoCell.querySelector('.update-btn');
    updateBtn.addEventListener('click', () => {
      openUpdateUserModal(user);
    });

    banBtn.addEventListener('click', async () => {
      try {
        await banUserAPI(user._id);
        loadUsers({ role: selectedRole });
      } catch (err) {
        alert(err.message);
      }
    });

    unbanBtn.addEventListener('click', async () => {
      try {
        await unbanUserAPI(user._id);
        loadUsers({ role: selectedRole });
      } catch (err) {
        alert(err.message);
      }
    });

    // -------------------- VIEW MODAL --------------------
    const viewBtn = infoCell.querySelector('.view-btn');
    viewBtn.addEventListener('click', () => {
      openUserInfoModal(user);
    });
  }

  function openUserInfoModal(user) {
    const { firstName, middleName, lastName, extName } = user.name || {};
    userInfoBody.innerHTML = `
      <p><strong>Full Name:</strong> ${[
        firstName,
        middleName,
        lastName,
        extName,
      ]
        .filter(Boolean)
        .join(' ')}</p>
      <p><strong>Email:</strong> ${user.email}</p>
      <p><strong>Role:</strong> ${user.role}</p>
      <p><strong>Status:</strong> ${user.status}</p>
      <p><strong>Created At:</strong> ${new Date(
        user.createdAt
      ).toLocaleString()}</p>
    `;
    userInfoModal.style.display = 'block';
  }

  // -------------------- LOAD USERS --------------------
  async function loadUsers({
    search = '',
    role = selectedRole,
    sortBy = 'name',
    sortOrder = 'asc',
    page = 1,
    limit = 10,
  } = {}) {
    try {
      clearTable();
      currentPage = page;

      const {
        users,
        total,
        totalPages: apiTotalPages,
      } = await getAllUsersAPI({
        search,
        role,
        sortBy,
        sortOrder,
        page,
        limit,
      });

      totalPages = apiTotalPages;

      if (!users.length) {
        const emptyRow = document.createElement('div');
        emptyRow.className = 'grid-row empty-message';
        emptyRow.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 1rem; color: #777;">
        No users found
      </div>`;
        tableContainer.appendChild(emptyRow);
        renderPagination();
        return;
      }

      users.forEach(renderUserRow);
      renderPagination();
    } catch (err) {
      alert(err.message);
    }
  }

  // -------------------- RENDER PAGINATION --------------------
  function renderPagination() {
    paginationNumbers.innerHTML = '';

    // Prev & Next button states
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages;

    // Create numbered buttons
    for (let i = 1; i <= totalPages; i++) {
      const btn = document.createElement('button');
      btn.textContent = i;
      btn.className = 'btn btn-number';
      if (i === currentPage) btn.classList.add('active');
      btn.addEventListener('click', () => {
        loadUsers({ page: i, limit });
      });
      paginationNumbers.appendChild(btn);
    }
  }

  // -------------------- PREV & NEXT --------------------
  prevBtn.addEventListener('click', () => {
    if (currentPage > 1) loadUsers({ page: currentPage - 1, limit });
  });

  nextBtn.addEventListener('click', () => {
    if (currentPage < totalPages) loadUsers({ page: currentPage + 1, limit });
  });

  // -------------------- SEARCH & ROLE --------------------
  searchButton?.addEventListener('click', () => {
    const query = searchInput.value.trim();
    loadUsers({ search: query, role: selectedRole });
  });

  roleDropdown?.addEventListener('change', () => {
    selectedRole = roleDropdown.value;
    searchInput.value = '';
    loadUsers({ role: selectedRole });
  });

  // Initial load
  loadUsers();
});
