<?php
header('Content-Type: application/json');
session_start();
require_once __DIR__ . "/../classes/database.php";

if (!isset($_SESSION['user'])) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "non autenticato"]);
    exit;
}

$carrello = $_SESSION['carrello'] ?? [];

if (empty($carrello)) {
    echo json_encode(["success" => false, "message" => "carrello vuoto"]);
    exit;
}

$db = new database();
$success = true;
$errors = [];

// Processa ogni item nel carrello
foreach ($carrello as $item) {
    $id = $item['id'];
    $quantita = (int) $item['quantita'];
    
    // Parsa l'ID: formato è "tipo_codice_officina"
    // Es: "pezzo_123_OP01" o "articolo_456_OP02"
    $parts = explode('_', $id, 3);
    if (count($parts) < 3) continue;
    
    $tipo = $parts[0];
    $codice = $parts[1];
    $officina = $parts[2];
    
    // Aggiorna la quantità nel database solo per pezzo e articolo (non servizio)
    if ($tipo === 'pezzo') {
        $stmt = $db->prepare("UPDATE Pezzo SET quantita = quantita - ? WHERE codice_pezzo = ? AND officina_codice = ?");
        $stmt->bind_param("iss", $quantita, $codice, $officina);
        if (!$stmt->execute()) {
            $errors[] = "Errore nell'aggiornamento del pezzo $codice";
            $success = false;
        }
    } elseif ($tipo === 'articolo') {
        $stmt = $db->prepare("UPDATE Articolo SET quantita = quantita - ? WHERE codice_articolo = ? AND officina_codice = ?");
        $stmt->bind_param("iss", $quantita, $codice, $officina);
        if (!$stmt->execute()) {
            $errors[] = "Errore nell'aggiornamento dell'articolo $codice";
            $success = false;
        }
    }
    // Servizi non hanno quantità, quindi non vengono aggiornati
}

if (!$success) {
    echo json_encode(["success" => false, "message" => "Errore nell'elaborazione: " . implode(", ", $errors)]);
    exit;
}

// Svuota il carrello solo se tutto è andato bene
$_SESSION['carrello'] = [];
echo json_encode(["success" => true, "message" => "Acquisto completato"]);
?>