<?php
declare(strict_types=1);

// Sessions for auth
if (session_status() === PHP_SESSION_NONE) {
  session_start();
}

// Database connection (adjust credentials if needed)
$DB_HOST = getenv('DB_HOST') ?: '127.0.0.1';
$DB_NAME = getenv('DB_NAME') ?: 'pandhari';
$DB_USER = getenv('DB_USER') ?: 'root';
$DB_PASS = getenv('DB_PASS') ?: '';

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

function db(): mysqli {
  static $conn = null;
  global $DB_HOST, $DB_NAME, $DB_USER, $DB_PASS;
  if ($conn === null) {
    $conn = new mysqli($DB_HOST, $DB_USER, $DB_PASS, $DB_NAME);
    $conn->set_charset('utf8mb4');
  }
  return $conn;
}

function json_response($data, int $status = 200): void {
  http_response_code($status);
  header('Content-Type: application/json');
  echo json_encode($data);
  exit;
}

function require_auth(): void {
  if (!isset($_SESSION['admin_id'])) {
    json_response(['message' => 'Unauthorized'], 401);
  }
}

function body_json(): array {
  $raw = file_get_contents('php://input');
  $data = json_decode($raw, true);
  return is_array($data) ? $data : [];
}

?>


