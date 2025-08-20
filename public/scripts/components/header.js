import { getMe } from '../../scripts/api/auth.js';

document.addEventListener('DOMContentLoaded', async () => {
  const profileIcon = document.querySelector('.header .profile');
  const logoContainer = document.querySelector('.logo-container');
  const headerName = document.getElementById('header-name');
  const headerRole = document.getElementById('header-role');

  try {
    const user = await getMe();

    const firstName = `${user.name.firstName}`.replace(/\s+/g, ' ').trim();
    const userRole = `${user.role}`;
    headerRole.textContent = userRole;
    headerName.textContent = firstName;
  } catch (err) {
    console.error('Error fetching /profile:', error);
  }

  // ✅ Navigate to /profile via API call
  profileIcon.addEventListener('click', async () => {
    try {
      const response = await fetch('/profile', {
        method: 'GET',
        credentials: 'include', // 🔑 include cookies
      });
      if (response.ok) {
        window.location.href = '/profile';
      } else {
        console.error('Failed to fetch /profile');
      }
    } catch (error) {
      console.error('Error fetching /profile:', error);
    }
  });

  // ✅ Navigate to /about-us via API call
  logoContainer.addEventListener('click', async () => {
    try {
      const response = await fetch('/about-us', {
        method: 'GET',
        credentials: 'include', // 🔑 include cookies
      });
      if (response.ok) {
        window.location.href = '/about-us';
      } else {
        console.error('Failed to fetch /about-us');
      }
    } catch (error) {
      console.error('Error fetching /about-us:', error);
    }
  });
});
