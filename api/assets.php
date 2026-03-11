<?php
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        getAssets();
        break;
    case 'POST':
        createAsset();
        break;
    case 'PUT':
        updateAsset();
        break;
    case 'DELETE':
        deleteAsset();
        break;
    default:
        jsonResponse(['error' => 'Method not allowed'], 405);
}

function getAssets() {
    global $pdo;

    $where = [];
    $params = [];

    if (!empty($_GET['category'])) {
        $where[] = 'a.category = :category';
        $params[':category'] = $_GET['category'];
    }

    if (isset($_GET['condition']) && $_GET['condition'] !== '') {
        if ($_GET['condition'] === 'good') {
            $where[] = 'a.good = 1 AND a.broken = 0';
        } elseif ($_GET['condition'] === 'broken') {
            $where[] = 'a.broken = 1';
        }
    }

    if (!empty($_GET['pic'])) {
        $where[] = 'a.pic = :pic';
        $params[':pic'] = $_GET['pic'];
    }

    if (!empty($_GET['search'])) {
        $where[] = '(a.name LIKE :search OR a.category LIKE :search2 OR a.brand LIKE :search3 OR a.code LIKE :search4 OR a.pic LIKE :search5)';
        $term = '%' . $_GET['search'] . '%';
        $params[':search'] = $term;
        $params[':search2'] = $term;
        $params[':search3'] = $term;
        $params[':search4'] = $term;
        $params[':search5'] = $term;
    }

    $sql = 'SELECT a.*,
            CASE WHEN EXISTS (
                SELECT 1 FROM lendings l WHERE l.asset_id = a.id AND l.status = \'active\'
            ) THEN 1 ELSE 0 END AS lent
            FROM assets a';

    if ($where) {
        $sql .= ' WHERE ' . implode(' AND ', $where);
    }

    $sql .= ' ORDER BY a.id ASC';

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $assets = $stmt->fetchAll();

    // Cast numeric fields
    foreach ($assets as &$a) {
        $a['id'] = (int)$a['id'];
        $a['qty'] = (int)$a['qty'];
        $a['good'] = (bool)$a['good'];
        $a['broken'] = (bool)$a['broken'];
        $a['for_sale'] = (bool)$a['for_sale'];
        $a['obsolete'] = (bool)$a['obsolete'];
        $a['lent'] = (bool)$a['lent'];
        // Map snake_case to camelCase for JS compatibility
        $a['forSale'] = $a['for_sale'];
        unset($a['for_sale']);
    }

    jsonResponse($assets);
}

function createAsset() {
    global $pdo;

    $data = json_decode(file_get_contents('php://input'), true);
    if (!$data) {
        jsonResponse(['error' => 'Invalid JSON'], 400);
    }

    $sql = 'INSERT INTO assets (category, name, material, brand, code, qty, good, broken, pic, for_sale, obsolete)
            VALUES (:category, :name, :material, :brand, :code, :qty, :good, :broken, :pic, :for_sale, :obsolete)';

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':category' => $data['category'],
        ':name'     => $data['name'],
        ':material' => $data['material'] ?? '',
        ':brand'    => $data['brand'] ?? '',
        ':code'     => $data['code'] ?? '',
        ':qty'      => $data['qty'] ?? 1,
        ':good'     => $data['good'] ? 1 : 0,
        ':broken'   => $data['broken'] ? 1 : 0,
        ':pic'      => $data['pic'],
        ':for_sale' => !empty($data['forSale']) ? 1 : 0,
        ':obsolete' => !empty($data['obsolete']) ? 1 : 0,
    ]);

    $id = (int)$pdo->lastInsertId();

    jsonResponse(['success' => true, 'id' => $id], 201);
}

function updateAsset() {
    global $pdo;

    $data = json_decode(file_get_contents('php://input'), true);
    if (!$data || empty($data['id'])) {
        jsonResponse(['error' => 'Invalid data or missing ID'], 400);
    }

    $sql = 'UPDATE assets SET category = :category, name = :name, material = :material,
            brand = :brand, code = :code, qty = :qty, good = :good, broken = :broken,
            pic = :pic, for_sale = :for_sale, obsolete = :obsolete
            WHERE id = :id';

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':id'       => $data['id'],
        ':category' => $data['category'],
        ':name'     => $data['name'],
        ':material' => $data['material'] ?? '',
        ':brand'    => $data['brand'] ?? '',
        ':code'     => $data['code'] ?? '',
        ':qty'      => $data['qty'] ?? 1,
        ':good'     => $data['good'] ? 1 : 0,
        ':broken'   => $data['broken'] ? 1 : 0,
        ':pic'      => $data['pic'],
        ':for_sale' => !empty($data['forSale']) ? 1 : 0,
        ':obsolete' => !empty($data['obsolete']) ? 1 : 0,
    ]);

    jsonResponse(['success' => true]);
}

function deleteAsset() {
    global $pdo;

    $data = json_decode(file_get_contents('php://input'), true);
    if (!$data || empty($data['id'])) {
        jsonResponse(['error' => 'Missing ID'], 400);
    }

    $id = (int)$data['id'];

    // Check if asset is being lent
    $check = $pdo->prepare('SELECT COUNT(*) FROM lendings WHERE asset_id = :id AND status = \'active\'');
    $check->execute([':id' => $id]);
    if ($check->fetchColumn() > 0) {
        jsonResponse(['error' => 'Aset sedang dipinjam, tidak bisa dihapus!'], 409);
    }

    $stmt = $pdo->prepare('DELETE FROM assets WHERE id = :id');
    $stmt->execute([':id' => $id]);

    jsonResponse(['success' => true]);
}
