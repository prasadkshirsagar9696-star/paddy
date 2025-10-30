async function logout() {
  await fetch('/api/logout', { method: 'POST' });
  window.location.href = '/login.html';
}
document.getElementById('logoutBtn')?.addEventListener('click', (e) => { e.preventDefault(); logout(); });

const tbody = document.querySelector('#salesTable tbody');

async function loadSales() {
  const res = await fetch('/api/sales');
  if (!res.ok) {
    if (res.status === 401) window.location.href = '/login.html';
    return;
  }
  const rows = await res.json();
  tbody.innerHTML = '';
  rows.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${r.id}</td>
      <td>${r.fuel_type}</td>
      <td>${Number(r.quantity_liters).toFixed(2)}</td>
      <td>${Number(r.price_per_liter).toFixed(2)}</td>
      <td>${Number(r.total_amount).toFixed(2)}</td>
      <td>${r.customer_name ?? ''}</td>
      <td>${new Date(r.created_at).toLocaleString()}</td>`;
    tbody.appendChild(tr);
  });
}

loadSales();


