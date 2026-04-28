<?php
header('Content-Type: application/json');
session_start();
require_once __DIR__ . "/../classes/database.php";

$data = json_decode(file_get_contents("php://input"), true);
$user = $data['username'] ?? '';
$pass = $data['password'] ?? '';

$db   = new database();
$stmt = $db->prepare("SELECT password, ruolo, verified FROM users WHERE username = ?");
$stmt->bind_param("s", $user);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    $row = $result->fetch_assoc();
    if (password_verify($pass, $row['password'])) {
        if ($row['verified']) {
            $_SESSION['user']  = $user;
            $_SESSION['ruolo'] = $row['ruolo'];
            echo json_encode(["success" => true, "ruolo" => $row['ruolo']]);
        } else {
            echo json_encode(["success" => false, "message" => "Account non ancora verificato. Controlla la tua email per il link di verifica."]);
        }
    } else {
        echo json_encode(["success" => false, "message" => "Password errata"]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Utente non trovato"]);
}