document.getElementById('loginForm').addEventListener('submit', async e => {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const response = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
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
