<?php
header('Content-Type: application/json');
session_start();

if (!isset($_SESSION['user'])) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "non autenticato"]);
    exit;
}

// Svuota il carrello
$_SESSION['carrello'] = [];
echo json_encode(["success" => true, "message" => "acquisto completato"]);