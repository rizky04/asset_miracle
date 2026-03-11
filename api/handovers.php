<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':    handleGet($pdo); break;
    case 'POST':   handlePost($pdo); break;
    case 'PUT':    handlePut($pdo); break;
    case 'DELETE': handleDelete($pdo); break;
    default:       jsonResponse(['error' => 'Method not allowed'], 405);
}

function handleGet($pdo) {
    $id   = $_GET['id']   ?? null;
    $type = $_GET['type'] ?? null;

    if ($id) {
        $stmt = $pdo->prepare("SELECT * FROM handovers WHERE id = ?");
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        if (!$row) jsonResponse(['error' => 'Not found'], 404);

        // decode JSON fields
        $row['software_list']    = json_decode($row['software_list']    ?? '[]', true) ?: [];
        $row['accessories_list'] = json_decode($row['accessories_list'] ?? '[]', true) ?: [];
        jsonResponse($row);
    } else {
        $sql  = "SELECT id, doc_number, type, handover_date, from_name, to_name, to_department, device_label, merek, type_device FROM handovers";
        $args = [];
        if ($type) { $sql .= " WHERE type = ?"; $args[] = $type; }
        $sql .= " ORDER BY handover_date DESC, id DESC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($args);
        jsonResponse($stmt->fetchAll());
    }
}

function handlePost($pdo) {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!$data) jsonResponse(['error' => 'Invalid JSON'], 400);

    foreach (['handoverDate', 'fromName', 'toName', 'toDepartment'] as $f) {
        if (empty($data[$f])) jsonResponse(['error' => "Field '$f' wajib diisi"], 400);
    }

    $type  = ($data['type'] ?? 'laptop') === 'add_on' ? 'add_on' : 'laptop';
    $year  = date('Y');
    $month = date('m');
    $stmt  = $pdo->prepare("SELECT COUNT(*) AS cnt FROM handovers WHERE YEAR(created_at) = ? AND type = ?");
    $stmt->execute([$year, $type]);
    $seq = ($stmt->fetch()['cnt'] ?? 0) + 1;
    $prefix    = $type === 'add_on' ? 'ST-AO' : 'ST-LP';
    $docNumber = "{$prefix}/{$year}/{$month}/" . str_pad($seq, 3, '0', STR_PAD_LEFT);

    $stmt = $pdo->prepare("
        INSERT INTO handovers
            (doc_number, type, handover_date,
             from_name, from_position, from_department, dept_head,
             to_name, to_position, to_department, to_address,
             device_label, merek, type_device, serial_number,
             processor, storage, ram, screen_size, os, office_sw,
             software_list, accessories_list)
        VALUES (?,?,?,  ?,?,?,?,  ?,?,?,?,  ?,?,?,?,  ?,?,?,?,?,?,  ?,?)
    ");
    $stmt->execute([
        $docNumber, $type, $data['handoverDate'],
        $data['fromName'],       $data['fromPosition']  ?? '',
        $data['fromDepartment'] ?? 'IT', $data['deptHead'] ?? '',
        $data['toName'],         $data['toPosition']    ?? '',
        $data['toDepartment'],   $data['toAddress']     ?? '',
        $data['deviceLabel']     ?? '',
        $data['merek']           ?? '',
        $data['typeDevice']      ?? '',
        $data['serialNumber']    ?? '',
        $data['processor']       ?? '',
        $data['storage']         ?? '',
        $data['ram']             ?? '',
        $data['screenSize']      ?? '',
        $data['os']              ?? '',
        $data['officeSw']        ?? '',
        json_encode($data['softwareList']    ?? [], JSON_UNESCAPED_UNICODE),
        json_encode($data['accessoriesList'] ?? [], JSON_UNESCAPED_UNICODE),
    ]);

    jsonResponse(['success' => true, 'id' => (int)$pdo->lastInsertId(), 'docNumber' => $docNumber]);
}

function handlePut($pdo) {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!$data) jsonResponse(['error' => 'Invalid JSON'], 400);

    $id = $data['id'] ?? null;
    if (!$id) jsonResponse(['error' => 'ID diperlukan'], 400);

    foreach (['handoverDate', 'fromName', 'toName', 'toDepartment'] as $f) {
        if (empty($data[$f])) jsonResponse(['error' => "Field '$f' wajib diisi"], 400);
    }

    $stmt = $pdo->prepare("
        UPDATE handovers SET
            handover_date   = ?,
            from_name       = ?, from_position  = ?, from_department = ?, dept_head    = ?,
            to_name         = ?, to_position    = ?, to_department   = ?, to_address   = ?,
            device_label    = ?, merek          = ?, type_device     = ?, serial_number= ?,
            processor       = ?, storage        = ?, ram             = ?, screen_size  = ?,
            os              = ?, office_sw      = ?,
            software_list   = ?, accessories_list = ?
        WHERE id = ?
    ");
    $stmt->execute([
        $data['handoverDate'],
        $data['fromName'],        $data['fromPosition']   ?? '',
        $data['fromDepartment']  ?? 'IT', $data['deptHead'] ?? '',
        $data['toName'],          $data['toPosition']     ?? '',
        $data['toDepartment'],    $data['toAddress']      ?? '',
        $data['deviceLabel']      ?? '',
        $data['merek']            ?? '',
        $data['typeDevice']       ?? '',
        $data['serialNumber']     ?? '',
        $data['processor']        ?? '',
        $data['storage']          ?? '',
        $data['ram']              ?? '',
        $data['screenSize']       ?? '',
        $data['os']               ?? '',
        $data['officeSw']         ?? '',
        json_encode($data['softwareList']    ?? [], JSON_UNESCAPED_UNICODE),
        json_encode($data['accessoriesList'] ?? [], JSON_UNESCAPED_UNICODE),
        (int)$id,
    ]);

    jsonResponse(['success' => true]);
}

function handleDelete($pdo) {
    $data = json_decode(file_get_contents('php://input'), true);
    $id   = $data['id'] ?? null;
    if (!$id) jsonResponse(['error' => 'ID diperlukan'], 400);

    $stmt = $pdo->prepare("DELETE FROM handovers WHERE id = ?");
    $stmt->execute([$id]);
    jsonResponse(['success' => true]);
}
