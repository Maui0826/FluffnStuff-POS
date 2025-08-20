const API_BASE = '/api/v1';

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.querySelector('#loginForm');

  loginForm.addEventListener('submit', async e => {
    e.preventDefault();

    const email = document.querySelector('#username').value.trim();
    const password = document.querySelector('#password').value.trim();
    // const session =
    //   document.querySelector('#session')
    //     ?.checked || false; // optional remember-me checkbox

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email,
          password,
        }),
      });

      if (response.redirected) {
        window.location.href = response.url;
      } else {
        const data = await response.json();
        alert(data.message || 'Login failed. Please try again.');
      }
    } catch (err) {
      console.error(err);
      alert('Something went wrong. Please try again later.');
    }
  });
});
