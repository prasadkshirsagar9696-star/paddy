async function logout() {
  await fetch('/api/logout', { method: 'POST' });
  window.location.href = '/login.html';
}

document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
  e.preventDefault();
  logout();
});

const fuelTableBody = document.querySelector('#fuelTable tbody');
const empTableBody = document.querySelector('#empTable tbody');

async function loadFuel() {
  const res = await fetch('/api/fuel');
  if (!res.ok) {
    if (res.status === 401) window.location.href = '/login.html';
    return;
  }
  const fuels = await res.json();
  fuelTableBody.innerHTML = '';
  fuels.forEach((f) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${f.id}</td>
      <td>${f.type}</td>
      <td><input type="number" step="0.01" value="${f.price_per_liter}" data-id="${f.id}" class="input" style="max-width:110px"></td>
      <td><input type="number" step="0.01" value="${f.stock_liters}" data-id="${f.id}" class="input" style="max-width:110px"></td>
      <td class="actions">
        <button class="btn secondary" data-action="save" data-id="${f.id}">Save</button>
        <button class="btn danger" data-action="delete" data-id="${f.id}">Delete</button>
      </td>`;
    fuelTableBody.appendChild(tr);
  });
}

async function loadEmployees() {
  const res = await fetch('/api/employees');
  if (!res.ok) {
    if (res.status === 401) window.location.href = '/login.html';
    return;
  }
  const emps = await res.json();
  empTableBody.innerHTML = '';
  emps.forEach((e) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${e.id}</td>
      <td><input value="${e.name}" class="input" data-field="name" data-id="${e.id}"/></td>
      <td><input value="${e.role}" class="input" data-field="role" data-id="${e.id}"/></td>
      <td><input value="${e.phone ?? ''}" class="input" data-field="phone" data-id="${e.id}"/></td>
      <td class="actions">
        <button class="btn secondary" data-action="save-emp" data-id="${e.id}">Save</button>
        <button class="btn danger" data-action="delete-emp" data-id="${e.id}">Delete</button>
      </td>`;
    empTableBody.appendChild(tr);
  });
}

document.getElementById('addFuelBtn')?.addEventListener('click', async () => {
  const type = document.getElementById('fuelType').value.trim();
  const price = Number(document.getElementById('fuelPrice').value);
  const stock = Number(document.getElementById('fuelStock').value);
  if (!type || !(price >= 0) || !(stock >= 0)) return alert('Please fill valid values');
  const res = await fetch('/api/fuel', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type, price_per_liter: price, stock_liters: stock }) });
  if (!res.ok) return alert('Error creating fuel');
  document.getElementById('fuelType').value = '';
  document.getElementById('fuelPrice').value = '';
  document.getElementById('fuelStock').value = '';
  loadFuel();
});

fuelTableBody?.addEventListener('click', async (e) => {
  const target = e.target;
  if (!(target instanceof HTMLElement)) return;
  const action = target.getAttribute('data-action');
  const id = target.getAttribute('data-id');
  if (!id) return;
  if (action === 'save') {
    const inputs = fuelTableBody.querySelectorAll(`input[data-id="${id}"]`);
    const price = Number(inputs[0].value);
    const stock = Number(inputs[1].value);
    const res = await fetch(`/api/fuel/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ price_per_liter: price, stock_liters: stock }) });
    if (!res.ok) return alert('Update failed');
    loadFuel();
  }
  if (action === 'delete') {
    if (!confirm('Delete this fuel?')) return;
    const res = await fetch(`/api/fuel/${id}`, { method: 'DELETE' });
    if (!res.ok) return alert('Delete failed');
    loadFuel();
  }
});

document.getElementById('addEmpBtn')?.addEventListener('click', async () => {
  const name = document.getElementById('empName').value.trim();
  const role = document.getElementById('empRole').value.trim();
  const phone = document.getElementById('empPhone').value.trim();
  if (!name || !role) return alert('Name and role required');
  const res = await fetch('/api/employees', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, role, phone }) });
  if (!res.ok) return alert('Error creating employee');
  document.getElementById('empName').value = '';
  document.getElementById('empRole').value = '';
  document.getElementById('empPhone').value = '';
  loadEmployees();
});

empTableBody?.addEventListener('click', async (e) => {
  const target = e.target;
  if (!(target instanceof HTMLElement)) return;
  const action = target.getAttribute('data-action');
  const id = target.getAttribute('data-id');
  if (!id) return;
  if (action === 'save-emp') {
    const rowInputs = empTableBody.querySelectorAll(`input[data-id="${id}"]`);
    const data = { name: '', role: '', phone: '' };
    rowInputs.forEach((input) => {
      const field = input.getAttribute('data-field');
      data[field] = input.value;
    });
    const res = await fetch(`/api/employees/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (!res.ok) return alert('Update failed');
    loadEmployees();
  }
  if (action === 'delete-emp') {
    if (!confirm('Delete this employee?')) return;
    const res = await fetch(`/api/employees/${id}`, { method: 'DELETE' });
    if (!res.ok) return alert('Delete failed');
    loadEmployees();
  }
});

loadFuel();
loadEmployees();


