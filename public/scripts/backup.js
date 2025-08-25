document.addEventListener('DOMContentLoaded', () => {
  const jsonBtn = document.getElementById('json-backup');
  const zipBtn = document.getElementById('zip-backup');
  const statusEl = document.getElementById('status');

  async function downloadBackup(format) {
    try {
      statusEl.textContent = 'Preparing backup... ⏳';

      const response = await fetch(`/api/v1/backup?format=${format}`, {
        method: 'GET',
      });

      if (!response.ok) throw new Error('Failed to fetch backup');

      // Get blob (file content)
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      // Create temporary <a> to trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = format === 'json' ? 'backup.json' : 'backup.zip';
      document.body.appendChild(a);
      a.click();

      // Cleanup
      a.remove();
      window.URL.revokeObjectURL(url);

      statusEl.textContent = `✅ Backup downloaded as ${format.toUpperCase()}`;
    } catch (err) {
      console.error(err);
      statusEl.textContent = '❌ Error while downloading backup.';
    }
  }

  const csvBtn = document.createElement('button');
  csvBtn.id = 'csv-backup';
  csvBtn.textContent = 'Download CSV';
  document.querySelector('.btn-group').appendChild(csvBtn);

  csvBtn.addEventListener('click', () => downloadBackup('csv'));

  jsonBtn.addEventListener('click', () => downloadBackup('json'));
  zipBtn.addEventListener('click', () => downloadBackup('zip'));
});
