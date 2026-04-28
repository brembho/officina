<?php
header('Content-Type: application/json');
session_start();
require_once __DIR__ . "/../classes/database.php";

$ruolo = $_SESSION['ruolo'] ?? '';
if (!isset($_SESSION['user']) || !in_array($ruolo, ['admin','dipendente'])) {
    http_response_code(403);
    echo json_encode(["success" => false, "error" => "accesso negato"]);
    exit;
}

$db = new database();
$method = $_SERVER['REQUEST_METHOD'];
$body = json_decode(file_get_contents("php://input"), true) ?? [];
$action = $_GET['action'] ?? $body['action'] ?? '';

// get, lista officine e inventario (filtrato per dipendente, o tutto per admin)
if ($method === 'GET') {
    if ($action === 'officine') {
        $res = $db->query("SELECT codice, denominazione, indirizzo, telefono, centrale FROM Officina ORDER BY denominazione");
        $data = [];
        while ($r = $res->fetch_assoc()) $data[] = $r;
        echo json_encode(["success" => true, "data" => $data]);
        exit;
    }

    if ($action === 'inventario') {
        $codice = $_GET['codice'] ?? '';
        if (!$codice) { echo json_encode(["success"=>false]); exit; }

        $data = [];
        foreach ([
            ["SELECT codice_servizio AS codice, descrizione, costo_orario AS prezzo, NULL AS quantita, 'servizio' AS tipo FROM Servizio WHERE officina_codice=?", $codice],
            ["SELECT codice_pezzo AS codice, descrizione, costo_unitario AS prezzo, quantita, 'pezzo' AS tipo FROM Pezzo WHERE officina_codice=?", $codice],
            ["SELECT codice_articolo AS codice, descrizione, costo_unitario AS prezzo, quantita, 'articolo' AS tipo FROM Articolo WHERE officina_codice=?", $codice]
        ] as [$sql, $cod]) {
            $stmt = $db->prepare($sql); $stmt->bind_param("s", $cod); $stmt->execute();
            $res = $stmt->get_result();
            while ($r = $res->fetch_assoc()) $data[] = $r;
        }
        echo json_encode(["success" => true, "data" => $data]);
        exit;
    }
}

// put, aggiorna quantità magazzino
if ($method === 'PUT' && $action === 'quantita') {
    $tipo   = $body['tipo'];   // pezzo o articolo
    $codice = $body['codice'];
    $officina = $body['officina_codice'];
    $qta    = (int)$body['quantita'];

    if ($tipo === 'pezzo') {
        $stmt = $db->prepare("UPDATE Pezzo SET quantita=? WHERE codice_pezzo=? AND officina_codice=?");
    } elseif ($tipo === 'articolo') {
        $stmt = $db->prepare("UPDATE Articolo SET quantita=? WHERE codice_articolo=? AND officina_codice=?");
    } else {
        echo json_encode(["success"=>false,"error"=>"tipo non valido"]); exit;
    }
    $stmt->bind_param("iss", $qta, $codice, $officina);
    $stmt->execute();
    echo json_encode(["success" => true]);
    exit;
}

echo json_encode(["success" => false, "error" => "richiesta non valida"]);