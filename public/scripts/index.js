import axios from 'https://cdn.jsdelivr.net/npm/axios@1.6.8/+esm';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('login-form');

  if (form) {
    form.addEventListener('submit', async e => {
      e.preventDefault();

      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value.trim();

      try {
        const res = await axios.post('/api/auth/login', {
          email,
          password,
        });

        if (res.data.success) {
          alert('Login successful!');
          window.location.href = '/dashboard.html'; // redirect after login
        } else {
          alert(res.data.message || 'Invalid login credentials.');
        }
      } catch (err) {
        console.error(err);
        alert(
          err.response?.data?.message || 'Something went wrong. Try again.'
        );
      }
    });
  }
});
