const refundBtn = document.getElementById('btnRefund');
const loginModal = document.getElementById('loginModal');
const closeModal = document.querySelector('.close');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const API_BASE = import.meta.env.ALLOWED_ORIGINS + '/api/v1';

// Show login modal when refund is clicked
refundBtn.addEventListener('click', () => {
  loginModal.style.display = 'flex';
});

// Close modal
closeModal.addEventListener('click', () => {
  loginModal.style.display = 'none';
});

// Handle login form submit
loginForm.addEventListener('submit', async e => {
  e.preventDefault();
  loginError.textContent = '';

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const res = await fetch(`${API_BASE}/refunds/refund-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, session: true }),
    });

    if (!res.ok) {
      const data = await res.json();
      loginError.textContent = data.message || 'Login failed';
      return;
    }

    // Success, redirect to refund page
    window.location.href = '/refunds';
  } catch (err) {
    loginError.textContent = 'Server error. Try again.';
  }
});
