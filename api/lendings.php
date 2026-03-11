<?php
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        getLendings();
        break;
    case 'POST':
        createLending();
        break;
    case 'PUT':
        updateLending();
        break;
    case 'DELETE':
        deleteLending();
        break;
    default:
        jsonResponse(['error' => 'Method not allowed'], 405);
}

function getLendings() {
    global $pdo;

    $where = [];
    $params = [];

    if (!empty($_GET['status'])) {
        if ($_GET['status'] === 'overdue') {
            $where[] = "l.status = 'active' AND l.due_date < CURDATE()";
        } elseif ($_GET['status'] === 'active') {
            $where[] = "l.status = 'active'";
        } elseif ($_GET['status'] === 'returned') {
            $where[] = "l.status = 'returned'";
        }
    }

    if (!empty($_GET['search'])) {
        $where[] = '(a.name LIKE :search OR l.borrower LIKE :search2 OR l.department LIKE :search3)';
        $term = '%' . $_GET['search'] . '%';
        $params[':search'] = $term;
        $params[':search2'] = $term;
        $params[':search3'] = $term;
    }

    $sql = 'SELECT l.*, a.name AS asset_name, a.code AS asset_code
            FROM lendings l
            LEFT JOIN assets a ON l.asset_id = a.id';

    if ($where) {
        $sql .= ' WHERE ' . implode(' AND ', $where);
    }

    $sql .= ' ORDER BY l.id DESC';

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $lendings = $stmt->fetchAll();

    // Format for JS
    foreach ($lendings as &$l) {
        $l['id'] = (int)$l['id'];
        $l['assetId'] = (int)$l['asset_id'];
        $l['lendDate'] = $l['lend_date'];
        $l['dueDate'] = $l['due_date'];
        $l['returnDate'] = $l['return_date'];
        $l['assetName'] = $l['asset_name'] ?: 'Aset tidak ditemukan';
        $l['assetCode'] = $l['asset_code'] ?? '';
        // Cleanup snake_case keys
        unset($l['asset_id'], $l['lend_date'], $l['due_date'], $l['return_date'], $l['asset_name'], $l['asset_code']);
    }

    jsonResponse($lendings);
}

function createLending() {
    global $pdo;

    $data = json_decode(file_get_contents('php://input'), true);
    if (!$data) {
        jsonResponse(['error' => 'Invalid JSON'], 400);
    }

    $sql = 'INSERT INTO lendings (asset_id, borrower, department, lend_date, due_date, notes, status)
            VALUES (:asset_id, :borrower, :department, :lend_date, :due_date, :notes, \'active\')';

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':asset_id'   => $data['assetId'],
        ':borrower'   => $data['borrower'],
        ':department' => $data['department'],
        ':lend_date'  => $data['lendDate'],
        ':due_date'   => $data['dueDate'],
        ':notes'      => $data['notes'] ?? '',
    ]);

    $id = (int)$pdo->lastInsertId();

    jsonResponse(['success' => true, 'id' => $id], 201);
}

function updateLending() {
    global $pdo;

    $data = json_decode(file_get_contents('php://input'), true);
    if (!$data || empty($data['id'])) {
        jsonResponse(['error' => 'Missing ID'], 400);
    }

    // Return asset
    if (!empty($data['action']) && $data['action'] === 'return') {
        $sql = 'UPDATE lendings SET status = \'returned\', return_date = CURDATE() WHERE id = :id';
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':id' => $data['id']]);
        jsonResponse(['success' => true]);
    }

    jsonResponse(['error' => 'Unknown action'], 400);
}

function deleteLending() {
    global $pdo;

    $data = json_decode(file_get_contents('php://input'), true);
    if (!$data || empty($data['id'])) {
        jsonResponse(['error' => 'Missing ID'], 400);
    }

    $stmt = $pdo->prepare('DELETE FROM lendings WHERE id = :id');
    $stmt->execute([':id' => (int)$data['id']]);

    jsonResponse(['success' => true]);
}
