<?php
require_once __DIR__ . "/../classes/database.php";

$db     = new database();
$result = $db->query("SELECT * FROM Articolo WHERE quantita > 0");

$data = [];
while ($row = $result->fetch_assoc()) {
    $data[] = $row;
}

echo json_encode(["success" => true, "data" => $data]);