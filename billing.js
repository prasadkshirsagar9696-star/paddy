async function logout() {
  await fetch('/api/logout', { method: 'POST' });
  window.location.href = '/login.html';
}
document.getElementById('logoutBtn')?.addEventListener('click', (e) => { e.preventDefault(); logout(); });

const fuelSelect = document.getElementById('fuelSelect');
const priceInput = document.getElementById('pricePerLiter');
const qtyInput = document.getElementById('quantityLiters');
const totalEl = document.getElementById('totalAmount');
const msgEl = document.getElementById('billMsg');

let fuels = [];

async function loadFuelOptions() {
  const res = await fetch('/api/fuel');
  if (!res.ok) {
    if (res.status === 401) window.location.href = '/login.html';
    return;
  }
  fuels = await res.json();
  fuelSelect.innerHTML = fuels.map(f => `<option value="${f.id}" data-price="${f.price_per_liter}">${f.type} — Stock: ${Number(f.stock_liters).toFixed(2)}L</option>`).join('');
  updatePrice();
}

function updatePrice() {
  const selected = fuelSelect.options[fuelSelect.selectedIndex];
  const price = Number(selected?.getAttribute('data-price') || 0);
  priceInput.value = price.toFixed(2);
}

function calculateTotal() {
  const price = Number(priceInput.value);
  const qty = Number(qtyInput.value);
  if (!(price >= 0) || !(qty > 0)) return 0;
  const total = price * qty;
  totalEl.textContent = total.toFixed(2);
  return total;
}

document.getElementById('calcBtn')?.addEventListener('click', () => {
  calculateTotal();
});

fuelSelect?.addEventListener('change', () => {
  updatePrice();
  calculateTotal();
});

document.getElementById('submitSaleBtn')?.addEventListener('click', async () => {
  const fuel_id = Number(fuelSelect.value);
  const quantity_liters = Number(qtyInput.value);
  const customer_name = document.getElementById('customerName').value.trim() || undefined;
  if (!(fuel_id > 0) || !(quantity_liters > 0)) return alert('Select fuel and valid quantity');
  try {
    const res = await fetch('/api/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fuel_id, quantity_liters, customer_name })
    });
    const data = await res.json();
    if (!res.ok) return alert(data.message || 'Sale failed');
    msgEl.style.display = 'block';
    msgEl.textContent = `Sale recorded. Total: ₹${data.total_amount.toFixed(2)}`;
    qtyInput.value = '';
    totalEl.textContent = '0.00';
    await loadFuelOptions();
  } catch (e) {
    alert('Network error');
  }
});

loadFuelOptions();


