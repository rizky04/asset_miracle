<?php
require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

// Total stats
$stats = $pdo->query("
    SELECT
        COUNT(*) AS total,
        SUM(good = 1 AND broken = 0) AS good,
        SUM(broken = 1) AS broken,
        SUM(for_sale = 1) AS for_sale,
        SUM(obsolete = 1) AS obsolete
    FROM assets
")->fetch();

// Active lendings count
$lent = $pdo->query("SELECT COUNT(*) FROM lendings WHERE status = 'active'")->fetchColumn();

// Category counts
$categories = $pdo->query("
    SELECT category, COUNT(*) AS count
    FROM assets
    GROUP BY category
    ORDER BY count DESC
")->fetchAll();

// Active lendings detail
$activeLendings = $pdo->query("
    SELECT l.*, a.name AS asset_name
    FROM lendings l
    LEFT JOIN assets a ON l.asset_id = a.id
    WHERE l.status = 'active'
    ORDER BY l.due_date ASC
")->fetchAll();

foreach ($activeLendings as &$l) {
    $l['id'] = (int)$l['id'];
    $l['assetId'] = (int)$l['asset_id'];
    $l['lendDate'] = $l['lend_date'];
    $l['dueDate'] = $l['due_date'];
    $l['assetName'] = $l['asset_name'] ?: 'Aset tidak ditemukan';
    unset($l['asset_id'], $l['lend_date'], $l['due_date'], $l['return_date'], $l['asset_name']);
}

jsonResponse([
    'total'    => (int)$stats['total'],
    'good'     => (int)$stats['good'],
    'broken'   => (int)$stats['broken'],
    'forSale'  => (int)$stats['for_sale'],
    'obsolete' => (int)$stats['obsolete'],
    'lent'     => (int)$lent,
    'categories' => $categories,
    'activeLendings' => $activeLendings,
]);
