## Petrol Pump Management System (PPMS)

Stack: Node.js (Express), SQLite, HTML/CSS/JS

### Features
- Admin login (session-based)
- Manage fuel types (add/edit/delete; price and stock)
- Billing with auto total and stock deduction
- Sales history (recent 100 transactions)
- Manage employee details (add/edit/delete)

### Project Structure
- `server.js`: Express server and REST API
- `db/schema.sql`: SQL schema and seed data
- `public/`: Frontend pages and assets
- `scripts/resetDb.js`: Reset and seed database

### Getting Started
1. Install Node.js LTS.
2. Install dependencies:
```bash
npm install
```
3. Initialize/reset the database (creates `db/app.db`):
```bash
npm run db:reset
```
4. Start the server:
```bash
npm start
```
5. Open `http://localhost:3000/` in your browser.

Default admin: `admin` / `admin123`

### SQL Deliverables
- Schema and seed are in `db/schema.sql` and include tables:
  - `admins (id, username, password_hash)`
  - `fuel_stock (id, type, price_per_liter, stock_liters)`
  - `employees (id, name, role, phone)`
  - `sales (id, fuel_id, quantity_liters, price_per_liter, total_amount, customer_name, created_at)`

Common queries used by the app:
```sql
-- List fuel
SELECT * FROM fuel_stock ORDER BY id;

-- Update price and stock
UPDATE fuel_stock SET price_per_liter = ?, stock_liters = ? WHERE id = ?;

-- Insert sale and reduce stock (done transactionally by API)
INSERT INTO sales (fuel_id, quantity_liters, price_per_liter, total_amount, customer_name)
VALUES (?, ?, ?, ?, ?);
UPDATE fuel_stock SET stock_liters = stock_liters - ? WHERE id = ?;

-- Sales history
SELECT s.id, f.type AS fuel_type, s.quantity_liters, s.price_per_liter, s.total_amount, s.customer_name, s.created_at
FROM sales s JOIN fuel_stock f ON f.id = s.fuel_id
ORDER BY s.created_at DESC LIMIT 100;
```

### Frontend Pages
- `login.html`: Admin login with validation (`public/js/auth.js`)
- `admin.html`: Manage fuel and employees (`public/js/admin.js`)
- `billing.html`: Create sale; auto-calc total (`public/js/billing.js`)
- `sales.html`: Recent transactions (`public/js/sales.js`)

### Notes
- Sessions are HTTP-only cookies. If unauthorized, pages redirect back to login via API 401.
- Prices and totals are calculated in JS and validated on the server.


