// utils/table.js
export function renderTable(selector, data, columns, mapper) {
  const tbody = document.querySelector(selector + ' tbody');
  tbody.innerHTML = '';

  data.forEach((item, idx) => {
    const rowData = mapper({ ...item, index: idx });
    const tr = document.createElement('tr');

    columns.forEach(col => {
      const td = document.createElement('td');
      td.textContent = rowData[col];
      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });
}
