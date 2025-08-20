const sidebar = document.querySelector('.sidebar');
const navLabels = document.querySelectorAll('.nav-label');
const navLists = sidebar.querySelectorAll('ul');

sidebar.addEventListener('click', async e => {
  const listItem = e.target.closest('li');
  if (!listItem) return;

  // Expand/collapse sidebar
  if (listItem.classList.contains('expand')) {
    sidebar.classList.toggle('expand-right');
    navLabels.forEach(label => label.classList.toggle('hidden'));
    navLists.forEach(list => list.classList.toggle('sidebar-expanded'));
  }

  // SPA-style logout
  if (listItem.classList.contains('log-out')) {
    try {
      const response = await fetch('/api/v1/auth/logout', {
        method: 'GET',
        credentials: 'include', // ensure cookies are sent
      });

      if (response.ok) {
        // Optionally show a toast or message here
        window.location.href = '/login'; // redirect after logout
      } else {
        const data = await response.json();
        console.error('Logout failed:', data.msg || data.message);
      }
    } catch (err) {
      console.error('Logout error:', err);
    }
  }
});
