<?php
header('Content-Type: text/html; charset=UTF-8');

require_once __DIR__ . "/../classes/database.php";

$token = $_GET['token'] ?? '';

if (empty($token)) {
    echo "Token non valido";
    exit;
}

$db = new database();
$stmt = $db->prepare("SELECT id FROM users WHERE verification_token = ? AND verified = 0");
$stmt->bind_param("s", $token);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    $row = $result->fetch_assoc();
    $verified = 1;
    $stmt2 = $db->prepare("UPDATE users SET verified = 1, verification_token = NULL WHERE id = ?");
    $stmt2->bind_param("i", $row['id']);
    $stmt2->execute();
    ?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Account verificato</title>
    <link rel="stylesheet" href="style/style.css">
</head>
<body style="display:flex;justify-content:center;align-items:center;min-height:100vh;">
    <div style="text-align:center;padding:40px;background:white;border-radius:8px;box-shadow:0 2px 10px rgba(0,0,0,0.1);">
        <h1 style="color:green;">Account verificato!</h1>
        <p>Il tuo account è stato attivato.</p>
        <p>Ora puoi chiudere questa pagina e accedere</p>
    </div>
</body>
</html>
    <?php
} else {
    ?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Errore verifica</title>
    <link rel="stylesheet" href="style/style.css">
</head>
<body style="display:flex;justify-content:center;align-items:center;min-height:100vh;">
    <div style="text-align:center;padding:40px;background:white;border-radius:8px;box-shadow:0 2px 10px rgba(0,0,0,0.1);">
        <h1 style="color:red;">Errore</h1>
        <p>Token non valido o già verificato.</p>
    </div>
</body>
</html>
    <?php
}
