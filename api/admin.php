<?php
header('Content-Type: application/json');
session_start();
require_once __DIR__ . "/../classes/database.php";

if (!isset($_SESSION['user']) || ($_SESSION['ruolo'] ?? '') !== 'admin') {
    http_response_code(403);
    echo json_encode(["success" => false, "error" => "accesso negato"]);
    exit;
}

$db = new database();
$method = $_SERVER['REQUEST_METHOD'];
$body = json_decode(file_get_contents("php://input"), true) ?? [];
$tipo = $_GET['tipo'] ?? $body['tipo'] ?? '';

// assicura colonna ruolo
$db->query("ALTER TABLE users ADD COLUMN IF NOT EXISTS ruolo VARCHAR(20) NOT NULL DEFAULT 'utente'");

// GET
if ($method === 'GET') {

    if ($tipo === 'officine') {
        $res  = $db->query("SELECT codice, denominazione, indirizzo, telefono, centrale FROM Officina ORDER BY denominazione");
        $data = [];
        while ($r = $res->fetch_assoc()) $data[] = $r;
        echo json_encode(["success" => true, "data" => $data]);
        exit;
    }

    if ($tipo === 'utenti') {
        $res  = $db->query("SELECT id, username, ruolo FROM users ORDER BY username");
        $data = [];
        while ($r = $res->fetch_assoc()) $data[] = $r;
        echo json_encode(["success" => true, "data" => $data]);
        exit;
    }
}

// POST
if ($method === 'POST') {

    if ($tipo === 'officina') {
        $codice  = strtoupper(trim($body['codice']));
        $denom   = $body['denominazione'];
        $ind     = $body['indirizzo'];
        $tel     = $body['telefono'] ?? '';
        $centrale = isset($body['centrale']) && $body['centrale'] ? 1 : 0;
        $stmt = $db->prepare("INSERT INTO Officina (codice, denominazione, indirizzo, telefono, centrale) VALUES (?,?,?,?,?)");
        $stmt->bind_param("ssssi", $codice, $denom, $ind, $tel, $centrale);
        if ($stmt->execute()) {
            echo json_encode(["success" => true]);
        } else {
            echo json_encode(["success" => false, "error" => "codice officina già esistente?"]);
        }
        exit;
    }

    if ($tipo === 'servizio') {
        $codice   = $body['codice_servizio'];
        $desc     = $body['descrizione'];
        $costo    = $body['costo_orario'];
        $officina = $body['officina_codice'];
        $stmt = $db->prepare("INSERT INTO Servizio (codice_servizio, descrizione, costo_orario, officina_codice) VALUES (?,?,?,?)");
        $stmt->bind_param("ssss", $codice, $desc, $costo, $officina);

    } elseif ($tipo === 'pezzo') {
        $codice   = $body['codice_pezzo'];
        $desc     = $body['descrizione'];
        $costo    = $body['costo_unitario'];
        $qta      = $body['quantita'];
        $officina = $body['officina_codice'];
        $stmt = $db->prepare("INSERT INTO Pezzo (codice_pezzo, descrizione, costo_unitario, quantita, officina_codice) VALUES (?,?,?,?,?)");
        $stmt->bind_param("sssss", $codice, $desc, $costo, $qta, $officina);

    } elseif ($tipo === 'articolo') {
        $codice   = $body['codice_articolo'];
        $desc     = $body['descrizione'];
        $costo    = $body['costo_unitario'];
        $qta      = $body['quantita'];
        $officina = $body['officina_codice'];
        $stmt = $db->prepare("INSERT INTO Articolo (codice_articolo, descrizione, costo_unitario, quantita, officina_codice) VALUES (?,?,?,?,?)");
        $stmt->bind_param("sssss", $codice, $desc, $costo, $qta, $officina);

    } else {
        echo json_encode(["success" => false, "error" => "tipo non valido"]);
        exit;
    }

    if ($stmt->execute()) {
        echo json_encode(["success" => true]);
    } else {
        echo json_encode(["success" => false, "error" => "errore: codice già esistente per questa officina?"]);
    }
    exit;
}

// PUT
if ($method === 'PUT' && $tipo === 'utente_ruolo') {
    $id    = (int) $body['id'];
    $ruolo = $body['ruolo'];
    $stmt  = $db->prepare("UPDATE users SET ruolo = ? WHERE id = ?");
    $stmt->bind_param("si", $ruolo, $id);
    $stmt->execute();
    echo json_encode(["success" => true]);
    exit;
}

// DELETE
if ($method === 'DELETE') {

    if ($tipo === 'officina') {
        $codice = $body['codice'];
        $stmt   = $db->prepare("DELETE FROM Officina WHERE codice = ?");
        $stmt->bind_param("s", $codice);
        $stmt->execute();
        echo json_encode(["success" => true]);
        exit;
    }

    $codice   = $body['codice'];
    $officina = $body['officina_codice'];

    if ($tipo === 'servizio') {
        $stmt = $db->prepare("DELETE FROM Servizio WHERE codice_servizio = ? AND officina_codice = ?");
    } elseif ($tipo === 'pezzo') {
        $stmt = $db->prepare("DELETE FROM Pezzo WHERE codice_pezzo = ? AND officina_codice = ?");
    } elseif ($tipo === 'articolo') {
        $stmt = $db->prepare("DELETE FROM Articolo WHERE codice_articolo = ? AND officina_codice = ?");
    } else {
        echo json_encode(["success" => false, "error" => "Tipo non valido"]);
        exit;
    }

    $stmt->bind_param("ss", $codice, $officina);
    $stmt->execute();
    echo json_encode(["success" => true]);
    exit;
}

echo json_encode(["success" => false, "error" => "Richiesta non valida"]);