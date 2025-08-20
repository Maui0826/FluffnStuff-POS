import { resetPassword } from './api/auth.js';

document
  .getElementById('resetForm')
  .addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = document
      .getElementById('password')
      .value.trim();
    const confirmPassword = document
      .getElementById('confirmPassword')
      .value.trim();
    const message =
      document.getElementById('message');

    if (password !== confirmPassword) {
      message.textContent =
        'Passwords do not match.';
      message.style.color = 'red';
      return;
    }

    const urlParams = new URLSearchParams(
      window.location.search
    );
    const token = urlParams.get('token');

    if (!token) {
      message.textContent =
        'Missing token in URL.';
      message.style.color = 'red';
      return;
    }

    try {
      const response = await resetPassword({
        token,
        newPassword: password,
      });
      message.textContent =
        response || 'Password reset successful!';
      message.style.color = 'green';

      document.location.href = '/profile';
    } catch (err) {
      message.textContent = err.message;
      message.style.color = 'red';
    }
  });
