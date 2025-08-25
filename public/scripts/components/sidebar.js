const sidebar = document.querySelector('.sidebar');
const mainContent = document.querySelector('main');
const container = document.querySelector('.container');
const footer = document.querySelector('footer');

// Only select nav items inside the sidebar
const sidebarNavLabels = sidebar.querySelectorAll('.nav-label');
const sidebarNavLists = sidebar.querySelectorAll('.nav-icons, .control-icons');

// Toggle expand/collapse on sidebar expand button
sidebar.addEventListener('click', async e => {
  const listItem = e.target.closest('li');
  if (!listItem) return;

  // Expand/collapse sidebar
  if (listItem.classList.contains('expand')) {
    sidebar.classList.toggle('expand-right');

    // Toggle only sidebar labels
    sidebarNavLabels.forEach(label => label.classList.toggle('hidden'));
    sidebarNavLists.forEach(list => list.classList.toggle('sidebar-expanded'));

    // Adjust main content and footer margin dynamically
    const sidebarWidth = sidebar.classList.contains('expand-right') ? 400 : 80;
    mainContent.style.marginLeft = `${sidebarWidth}px`;
    footer.style.marginLeft = `${sidebarWidth}px`;
  }

  // SPA-style logout
  if (listItem.classList.contains('log-out')) {
    try {
      const response = await fetch('/api/v1/auth/logout', {
        method: 'GET',
        credentials: 'include',
      });
      if (response.ok) {
        window.location.href = '/login';
      } else {
        const data = await response.json();
        console.error('Logout failed:', data.msg || data.message);
      }
    } catch (err) {
      console.error('Logout error:', err);
    }
  }
});

// Shrink sidebar if click outside
document.addEventListener('click', e => {
  const isClickInside = sidebar.contains(e.target);
  const isExpandButton = e.target.closest('li.expand');

  if (
    sidebar.classList.contains('expand-right') &&
    !isClickInside &&
    !isExpandButton
  ) {
    sidebar.classList.remove('expand-right');
    sidebarNavLabels.forEach(label => label.classList.add('hidden'));
    sidebarNavLists.forEach(list => list.classList.remove('sidebar-expanded'));

    mainContent.style.marginLeft = '80px';
    footer.style.marginLeft = '80px';
  }
});
