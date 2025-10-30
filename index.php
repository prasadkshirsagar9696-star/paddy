<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';

// Allow preflight if needed (optional; same-origin usually fine)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
  header('Access-Control-Allow-Headers: Content-Type');
  exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Expect path like /pandhari/public/api/... or /pandhari/api/ depending on docroot.
// Normalize by trimming up to 'api' segment
$segments = array_values(array_filter(explode('/', $path), fn($s) => $s !== ''));
$apiIndex = array_search('api', $segments);
if ($apiIndex === false) {
  json_response(['message' => 'Invalid API path'], 404);
}
$routeSegments = array_slice($segments, $apiIndex + 1);

$resource = $routeSegments[0] ?? '';
$id = $routeSegments[1] ?? null;

switch ($resource) {
  case 'login':
    if ($method !== 'POST') json_response(['message' => 'Method Not Allowed'], 405);
    $data = body_json();
    $username = trim($data['username'] ?? '');
    $password = trim($data['password'] ?? '');
    if ($username === '' || $password === '') json_response(['message' => 'Username and password required'], 400);
    $stmt = db()->prepare('SELECT id, password_hash FROM admins WHERE username = ? LIMIT 1');
    $stmt->bind_param('s', $username);
    $stmt->execute();
    $res = $stmt->get_result();
    if ($row = $res->fetch_assoc()) {
      $hash = $row['password_hash'];
      if (password_verify($password, $hash)) {
        $_SESSION['admin_id'] = (int)$row['id'];
        json_response(['message' => 'ok']);
      }
    }
    json_response(['message' => 'Invalid credentials'], 401);

  case 'logout':
    if ($method !== 'POST') json_response(['message' => 'Method Not Allowed'], 405);
    session_destroy();
    json_response(['message' => 'ok']);

  case 'fuel':
    require_auth();
    if ($method === 'GET' && !$id) {
      $rows = [];
      $q = db()->query('SELECT id, type, price_per_liter, stock_liters FROM fuel_stock ORDER BY id');
      while ($r = $q->fetch_assoc()) $rows[] = $r;
      json_response($rows);
    }
    if ($method === 'POST' && !$id) {
      $d = body_json();
      $type = trim($d['type'] ?? '');
      $price = floatval($d['price_per_liter'] ?? -1);
      $stock = floatval($d['stock_liters'] ?? -1);
      if ($type === '' || $price < 0 || $stock < 0) json_response(['message' => 'Invalid payload'], 400);
      $stmt = db()->prepare('INSERT INTO fuel_stock (type, price_per_liter, stock_liters) VALUES (?,?,?)');
      $stmt->bind_param('sdd', $type, $price, $stock);
      $stmt->execute();
      json_response(['id' => db()->insert_id], 201);
    }
    if ($id !== null) {
      $fuelId = (int)$id;
      if ($method === 'PUT') {
        $d = body_json();
        $price = isset($d['price_per_liter']) ? floatval($d['price_per_liter']) : null;
        $stock = isset($d['stock_liters']) ? floatval($d['stock_liters']) : null;
        if ($price === null && $stock === null) json_response(['message' => 'Nothing to update'], 400);
        if ($price !== null && $stock !== null) {
          $stmt = db()->prepare('UPDATE fuel_stock SET price_per_liter=?, stock_liters=? WHERE id=?');
          $stmt->bind_param('ddi', $price, $stock, $fuelId);
        } elseif ($price !== null) {
          $stmt = db()->prepare('UPDATE fuel_stock SET price_per_liter=? WHERE id=?');
          $stmt->bind_param('di', $price, $fuelId);
        } else {
          $stmt = db()->prepare('UPDATE fuel_stock SET stock_liters=? WHERE id=?');
          $stmt->bind_param('di', $stock, $fuelId);
        }
        $stmt->execute();
        json_response(['message' => 'ok']);
      }
      if ($method === 'DELETE') {
        $stmt = db()->prepare('DELETE FROM fuel_stock WHERE id=?');
        $stmt->bind_param('i', $fuelId);
        $stmt->execute();
        json_response(['message' => 'ok']);
      }
    }
    json_response(['message' => 'Not Found'], 404);

  case 'employees':
    require_auth();
    if ($method === 'GET' && !$id) {
      $rows = [];
      $q = db()->query('SELECT id, name, role, phone FROM employees ORDER BY id');
      while ($r = $q->fetch_assoc()) $rows[] = $r;
      json_response($rows);
    }
    if ($method === 'POST' && !$id) {
      $d = body_json();
      $name = trim($d['name'] ?? '');
      $role = trim($d['role'] ?? '');
      $phone = trim($d['phone'] ?? '');
      if ($name === '' || $role === '') json_response(['message' => 'Invalid payload'], 400);
      $stmt = db()->prepare('INSERT INTO employees (name, role, phone) VALUES (?,?,?)');
      $stmt->bind_param('sss', $name, $role, $phone);
      $stmt->execute();
      json_response(['id' => db()->insert_id], 201);
    }
    if ($id !== null) {
      $empId = (int)$id;
      if ($method === 'PUT') {
        $d = body_json();
        $name = trim($d['name'] ?? '');
        $role = trim($d['role'] ?? '');
        $phone = isset($d['phone']) ? trim($d['phone']) : null;
        if ($name === '' || $role === '') json_response(['message' => 'Invalid payload'], 400);
        $stmt = db()->prepare('UPDATE employees SET name=?, role=?, phone=? WHERE id=?');
        $stmt->bind_param('sssi', $name, $role, $phone, $empId);
        $stmt->execute();
        json_response(['message' => 'ok']);
      }
      if ($method === 'DELETE') {
        $stmt = db()->prepare('DELETE FROM employees WHERE id=?');
        $stmt->bind_param('i', $empId);
        $stmt->execute();
        json_response(['message' => 'ok']);
      }
    }
    json_response(['message' => 'Not Found'], 404);

  case 'sales':
    require_auth();
    if ($method === 'GET' && !$id) {
      $rows = [];
      $sql = 'SELECT s.id, s.fuel_id, f.type AS fuel_type, s.quantity_liters, s.price_per_liter, s.total_amount, s.customer_name, s.created_at
              FROM sales s INNER JOIN fuel_stock f ON s.fuel_id = f.id
              ORDER BY s.id DESC LIMIT 200';
      $q = db()->query($sql);
      while ($r = $q->fetch_assoc()) $rows[] = $r;
      json_response($rows);
    }
    if ($method === 'POST' && !$id) {
      $d = body_json();
      $fuel_id = (int)($d['fuel_id'] ?? 0);
      $quantity = floatval($d['quantity_liters'] ?? 0);
      $customer = trim($d['customer_name'] ?? '');
      if ($fuel_id <= 0 || $quantity <= 0) json_response(['message' => 'Invalid payload'], 400);

      // Get fuel price and stock
      $stmt = db()->prepare('SELECT price_per_liter, stock_liters FROM fuel_stock WHERE id=?');
      $stmt->bind_param('i', $fuel_id);
      $stmt->execute();
      $res = $stmt->get_result();
      if (!($fuel = $res->fetch_assoc())) json_response(['message' => 'Fuel not found'], 404);
      if (floatval($fuel['stock_liters']) < $quantity) json_response(['message' => 'Insufficient stock'], 400);

      $price = floatval($fuel['price_per_liter']);
      $total = $price * $quantity;

      // Transaction: insert sale and decrease stock
      db()->begin_transaction();
      try {
        $stmt = db()->prepare('INSERT INTO sales (fuel_id, quantity_liters, price_per_liter, total_amount, customer_name) VALUES (?,?,?,?,?)');
        $stmt->bind_param('iddds', $fuel_id, $quantity, $price, $total, $customer);
        $stmt->execute();

        $stmt2 = db()->prepare('UPDATE fuel_stock SET stock_liters = stock_liters - ? WHERE id=?');
        $stmt2->bind_param('di', $quantity, $fuel_id);
        $stmt2->execute();

        db()->commit();
        json_response(['message' => 'ok', 'total_amount' => $total], 201);
      } catch (Throwable $e) {
        db()->rollback();
        json_response(['message' => 'Failed to record sale'], 500);
      }
    }
    json_response(['message' => 'Not Found'], 404);

  default:
    json_response(['message' => 'Not Found'], 404);
}

?>


