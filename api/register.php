<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

require __DIR__.'/../vendor/PHPMailer-master/src/Exception.php';
require __DIR__.'/../vendor/PHPMailer-master/src/PHPMailer.php';
require __DIR__.'/../vendor/PHPMailer-master/src/SMTP.php';

header('Content-Type: application/json');
session_start();
require_once __DIR__ . "/../classes/database.php";

function handleError($e) {
    echo json_encode(["success" => false, "message" => "Errore: " . $e->getMessage()]);
    exit;
}

set_exception_handler('handleError');

$data = json_decode(file_get_contents("php://input"), true);
$user = $data['username'] ?? '';
$pass = $data['password'] ?? '';
$email = $data['email'] ?? '';

if (empty($user) || empty($pass) || empty($email)) {
    echo json_encode(["success" => false, "message" => "Tutti i campi sono obbligatori"]);
    exit;
}

$db = new database();

$stmt = $db->prepare("SELECT id FROM users WHERE username = ? OR email = ?");
$stmt->bind_param("ss", $user, $email);
$stmt->execute();

$result = $stmt->get_result();
if ($result->num_rows > 0) {
    echo json_encode(["success" => false, "message" => "Utente o email già esistente"]);
} else {
    $hash = password_hash($pass, PASSWORD_DEFAULT);
    $token = bin2hex(random_bytes(32));
    $verified = 0;
    $stmt2 = $db->prepare("INSERT INTO users (username, password, email, verified, verification_token) VALUES (?, ?, ?, ?, ?)");
    $stmt2->bind_param("sssis", $user, $hash, $email, $verified, $token);
    $stmt2->execute();

    $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
    $basePath = dirname($_SERVER['REQUEST_URI']);
    $verificationLink = $protocol . '://' . $host . $basePath . '/verify.php?token=' . $token;

    $url = "https://agora.ismonnet.it/sendMail/send.php";
    $mailData = [
        "mail_invio" => "esercizio-5binf@ismonnet.eu",
        "mail_destinazione" => $email,
        "oggetto" => "Verifica il tuo account - Casa Automobilistica",
        "body" => "Ciao $user,<br><br>Clicca sul link seguente per verificare il tuo account:<br><a href='$verificationLink'>Verifica Account</a><br><br>Se non hai richiesto questa registrazione, ignora questa email."
    ];

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ["Content-Type: application/json"]);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($mailData));

    $response = curl_exec($ch);
    $curlError = curl_errno($ch);
    curl_close($ch);

    if ($curlError) {
        echo json_encode(["success" => false, "message" => "Registrazione riuscita, ma errore invio email (cURL): " . $curlError . " - Response: " . $response]);
    } else {
        echo json_encode(["success" => true, "message" => "Registrazione effettuata. Controlla la tua email e clicca il link per verificare l'account. Response: " . $response]);
    }
}