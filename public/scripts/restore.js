document.getElementById('restore-form').addEventListener('submit', async e => {
  e.preventDefault();

  const statusEl = document.getElementById('status');
  const fileInput = document.getElementById('backupFile');

  if (!fileInput.files.length) {
    statusEl.textContent = '❌ Please select a file first.';
    return;
  }

  const formData = new FormData();
  formData.append('backupFile', fileInput.files[0]);

  try {
    statusEl.textContent = 'Uploading... ⏳';

    const response = await fetch('/api/v1/restore', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (response.ok) {
      statusEl.textContent = '✅ Database restored successfully!';
    } else {
      statusEl.textContent = `❌ Error: ${result.message}`;
    }
  } catch (err) {
    console.error(err);
    statusEl.textContent = '❌ Upload failed.';
  }
});
