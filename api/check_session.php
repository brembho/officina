<?php
header('Content-Type: application/json');
session_start();
if (isset($_SESSION['user'])) {
    echo json_encode([
        "loggedIn" => true,
        "username" => $_SESSION['user'],
        "ruolo"    => $_SESSION['ruolo'] ?? 'utente'
    ]);
} else {
    echo json_encode(["loggedIn" => false, "username" => "", "ruolo" => ""]);
}