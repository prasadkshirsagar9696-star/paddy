const path = require('path');
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'db', 'app.db');
const SCHEMA_PATH = path.join(__dirname, 'db', 'schema.sql');

// Ensure db folder exists
fs.mkdirSync(path.join(__dirname, 'db'), { recursive: true });

// Initialize DB
const db = new sqlite3.Database(DB_PATH);

function runSchemaIfNeeded() {
  const tables = ['admins', 'fuel_stock', 'employees', 'sales'];
  db.serialize(() => {
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name=?", [tables[0]], (err, row) => {
      if (err) {
        console.error('DB error:', err);
        return;
      }
      if (!row) {
        const schemaSql = fs.readFileSync(SCHEMA_PATH, 'utf-8');
        db.exec(schemaSql, (e) => {
          if (e) {
            console.error('Schema exec error:', e);
          } else {
            console.log('Database schema initialized.');
          }
        });
      }
    });
  });
}

runSchemaIfNeeded();

app.use(cors());
app.use(bodyParser.json());
app.use(
  session({
    secret: 'ppms-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, maxAge: 1000 * 60 * 60 }
  })
);

app.use(express.static(path.join(__dirname, 'public')));

// Auth middleware
function requireAdmin(req, res, next) {
  if (req.session && req.session.admin) {
    return next();
  }
  return res.status(401).json({ message: 'Unauthorized' });
}

// Auth routes
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Missing username or password' });
  }
  db.get('SELECT * FROM admins WHERE username = ?', [username], async (err, admin) => {
    if (err) return res.status(500).json({ message: 'DB error' });
    if (!admin) return res.status(401).json({ message: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, admin.password_hash);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
    req.session.admin = { id: admin.id, username: admin.username };
    return res.json({ message: 'Logged in' });
  });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ message: 'Logged out' });
  });
});

// Fuel endpoints
app.get('/api/fuel', requireAdmin, (req, res) => {
  db.all('SELECT * FROM fuel_stock ORDER BY id', [], (err, rows) => {
    if (err) return res.status(500).json({ message: 'DB error' });
    res.json(rows);
  });
});

app.post('/api/fuel', requireAdmin, (req, res) => {
  const { type, price_per_liter, stock_liters } = req.body;
  if (!type || price_per_liter == null || stock_liters == null) {
    return res.status(400).json({ message: 'Missing fields' });
  }
  db.run(
    'INSERT INTO fuel_stock (type, price_per_liter, stock_liters) VALUES (?, ?, ?)',
    [type, price_per_liter, stock_liters],
    function (err) {
      if (err) return res.status(500).json({ message: 'DB error' });
      res.json({ id: this.lastID });
    }
  );
});

app.put('/api/fuel/:id', requireAdmin, (req, res) => {
  const id = req.params.id;
  const { price_per_liter, stock_liters } = req.body;
  db.run(
    'UPDATE fuel_stock SET price_per_liter = ?, stock_liters = ? WHERE id = ?',
    [price_per_liter, stock_liters, id],
    function (err) {
      if (err) return res.status(500).json({ message: 'DB error' });
      res.json({ updated: this.changes });
    }
  );
});

app.delete('/api/fuel/:id', requireAdmin, (req, res) => {
  const id = req.params.id;
  db.run('DELETE FROM fuel_stock WHERE id = ?', [id], function (err) {
    if (err) return res.status(500).json({ message: 'DB error' });
    res.json({ deleted: this.changes });
  });
});

// Employees endpoints
app.get('/api/employees', requireAdmin, (req, res) => {
  db.all('SELECT * FROM employees ORDER BY id', [], (err, rows) => {
    if (err) return res.status(500).json({ message: 'DB error' });
    res.json(rows);
  });
});

app.post('/api/employees', requireAdmin, (req, res) => {
  const { name, role, phone } = req.body;
  if (!name || !role) return res.status(400).json({ message: 'Missing fields' });
  db.run(
    'INSERT INTO employees (name, role, phone) VALUES (?, ?, ?)',
    [name, role, phone || null],
    function (err) {
      if (err) return res.status(500).json({ message: 'DB error' });
      res.json({ id: this.lastID });
    }
  );
});

app.put('/api/employees/:id', requireAdmin, (req, res) => {
  const id = req.params.id;
  const { name, role, phone } = req.body;
  db.run(
    'UPDATE employees SET name = ?, role = ?, phone = ? WHERE id = ?',
    [name, role, phone || null, id],
    function (err) {
      if (err) return res.status(500).json({ message: 'DB error' });
      res.json({ updated: this.changes });
    }
  );
});

app.delete('/api/employees/:id', requireAdmin, (req, res) => {
  const id = req.params.id;
  db.run('DELETE FROM employees WHERE id = ?', [id], function (err) {
    if (err) return res.status(500).json({ message: 'DB error' });
    res.json({ deleted: this.changes });
  });
});

// Sales endpoints
app.get('/api/sales', requireAdmin, (req, res) => {
  db.all(
    `SELECT s.id, s.fuel_id, f.type as fuel_type, s.quantity_liters, s.price_per_liter, s.total_amount, s.customer_name, s.created_at
     FROM sales s JOIN fuel_stock f ON f.id = s.fuel_id
     ORDER BY s.created_at DESC LIMIT 100`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ message: 'DB error' });
      res.json(rows);
    }
  );
});

app.post('/api/sales', requireAdmin, (req, res) => {
  const { fuel_id, quantity_liters, customer_name } = req.body;
  if (!fuel_id || !quantity_liters) return res.status(400).json({ message: 'Missing fields' });

  db.serialize(() => {
    db.get('SELECT * FROM fuel_stock WHERE id = ?', [fuel_id], (err, fuel) => {
      if (err) return res.status(500).json({ message: 'DB error' });
      if (!fuel) return res.status(404).json({ message: 'Fuel not found' });
      if (fuel.stock_liters < quantity_liters) {
        return res.status(400).json({ message: 'Insufficient stock' });
      }
      const pricePerLiter = fuel.price_per_liter;
      const totalAmount = Number((pricePerLiter * quantity_liters).toFixed(2));

      db.run('BEGIN TRANSACTION');
      db.run(
        'UPDATE fuel_stock SET stock_liters = stock_liters - ? WHERE id = ?',
        [quantity_liters, fuel_id],
        function (e1) {
          if (e1) {
            db.run('ROLLBACK');
            return res.status(500).json({ message: 'DB error' });
          }
          db.run(
            'INSERT INTO sales (fuel_id, quantity_liters, price_per_liter, total_amount, customer_name) VALUES (?, ?, ?, ?, ?)',
            [fuel_id, quantity_liters, pricePerLiter, totalAmount, customer_name || null],
            function (e2) {
              if (e2) {
                db.run('ROLLBACK');
                return res.status(500).json({ message: 'DB error' });
              }
              db.run('COMMIT');
              return res.json({ id: this.lastID, total_amount: totalAmount, price_per_liter: pricePerLiter });
            }
          );
        }
      );
    });
  });
});

// Health
app.get('/api/health', (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});


