import axios from 'https://cdn.jsdelivr.net/npm/axios@1.6.8/dist/axios.min.js';

document.getElementById('login-form').addEventListener('submit', async e => {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const response = await axios.post(
      'https://fluffnstuff-pos.onrender.com/api/auth/login',
      {
        email,
        password,
      },
      {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true, // so cookies are stored
      }
    );

    console.log('Login success:', response.data);
    alert('Login successful!');
    window.location.href = '/dashboard.html';
  } catch (err) {
    console.error('Login error:', err.response?.data || err.message);
    alert(err.response?.data?.message || 'Login failed');
  }
});
