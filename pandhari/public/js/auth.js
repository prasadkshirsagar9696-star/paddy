const form = document.getElementById('loginForm');
const errorEl = document.getElementById('error');
const msgEl = document.getElementById('msg');

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.textContent = '';
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    if (!username || !password) {
      errorEl.textContent = 'Username and password required';
      return;
    }
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (!res.ok) {
        const d = await res.json();
        errorEl.textContent = d.message || 'Login failed';
        return;
      }
      msgEl.style.display = 'block';
      msgEl.textContent = 'Login successful. Redirecting...';
      setTimeout(() => {
        window.location.href = '/admin.html';
      }, 600);
    } catch (err) {
      errorEl.textContent = 'Network error';
    }
  });
}


