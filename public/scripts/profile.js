import {
  getMe,
  requestPasswordReset,
  requestEmailUpdate,
} from '../scripts/api/auth.js';

// Helper to capitalize first letter of each word
const capitalize = str =>
  str.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const user = await getMe();

    const fullName = `${user.name.firstName} ${user.name.middleName || ''} ${
      user.name.lastName
    } ${user.name.extName || ''}`
      .replace(/\s+/g, ' ')
      .trim();

    document.querySelector('.profile-name1').textContent = capitalize(fullName);
    document.querySelector('.profile-role').textContent =
      user.role.toUpperCase();
    document.querySelector('.profile-email').textContent = user.email;
    document.querySelector('.profile-status').textContent =
      user.status.toUpperCase();

    document
      .querySelector('#changePasswordBtn')
      .addEventListener('click', () => {
        document.querySelector('#passwordModal').showModal();
      });

    document.querySelector('#changeEmailBtn').addEventListener('click', () => {
      document.querySelector('#emailModal').showModal();
    });

    document
      .querySelector('#submitPassword')
      .addEventListener('click', async () => {
        const email = user.email;
        try {
          const msg = await requestPasswordReset(email);

          alert(msg);
          document.querySelector('#passwordModal').close();
        } catch (err) {
          alert(err.message);
        }
      });

    document
      .querySelector('#submitEmail')
      .addEventListener('click', async () => {
        const newEmail = document.querySelector('#newEmail').value;
        try {
          const msg = await requestEmailUpdate(newEmail);

          alert(msg);
          document.querySelector('#emailModal').close();
        } catch (err) {
          alert(err.message);
        }
      });
  } catch (err) {
    alert('Error: ' + err.message);
  }
});
