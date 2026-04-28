<?php
header('Content-Type: application/json');
require_once __DIR__ . "/../classes/database.php";

$db = new database();
$action = $_GET['action'] ?? '';

// lista di tutte le officine
if ($action === 'lista') {
    $res = $db->query("SELECT codice, denominazione, indirizzo, telefono, centrale FROM Officina ORDER BY denominazione");
    $data = [];
    while ($r = $res->fetch_assoc()) $data[] = $r;
    echo json_encode(["success" => true, "data" => $data]);
    exit;
}

// tutta la roba di un officina specifica
if ($action === 'inventario') {
    $codice = $_GET['codice'] ?? '';
    if (!$codice) { echo json_encode(["success"=>false,"data"=>[]]); exit; }

    $stmt = $db->prepare("SELECT codice_servizio AS codice, descrizione, costo_orario AS prezzo, NULL AS quantita, 'servizio' AS tipo FROM Servizio WHERE officina_codice=?");
    $stmt->bind_param("s", $codice); $stmt->execute();
    $res = $stmt->get_result();
    $data = [];
    while ($r = $res->fetch_assoc()) $data[] = $r;

    $stmt = $db->prepare("SELECT codice_pezzo AS codice, descrizione, costo_unitario AS prezzo, quantita, 'pezzo' AS tipo FROM Pezzo WHERE officina_codice=?");
    $stmt->bind_param("s", $codice); $stmt->execute();
    $res = $stmt->get_result();
    while ($r = $res->fetch_assoc()) $data[] = $r;

    $stmt = $db->prepare("SELECT codice_articolo AS codice, descrizione, costo_unitario AS prezzo, quantita, 'articolo' AS tipo FROM Articolo WHERE officina_codice=?");
    $stmt->bind_param("s", $codice); $stmt->execute();
    $res = $stmt->get_result();
    while ($r = $res->fetch_assoc()) $data[] = $r;

    echo json_encode(["success" => true, "data" => $data]);
    exit;
}

// officine disponibili dato una determinata cosa
if ($action === 'per_prodotto') {
    $tipo   = $_GET['tipo'] ?? '';
    $codice = $_GET['codice'] ?? '';
    if (!$tipo || !$codice) { echo json_encode(["success"=>false,"data"=>[]]); exit; }

    if ($tipo === 'servizio') {
        $sql = "SELECT o.codice, o.denominazione, o.indirizzo, o.telefono, o.centrale, s.costo_orario AS prezzo, NULL AS quantita
                FROM Officina o JOIN Servizio s ON s.officina_codice=o.codice WHERE s.codice_servizio=?";
    } elseif ($tipo === 'pezzo') {
        $sql = "SELECT o.codice, o.denominazione, o.indirizzo, o.telefono, o.centrale, p.costo_unitario AS prezzo, p.quantita
                FROM Officina o JOIN Pezzo p ON p.officina_codice=o.codice WHERE p.codice_pezzo=?";
    } elseif ($tipo === 'articolo') {
        $sql = "SELECT o.codice, o.denominazione, o.indirizzo, o.telefono, o.centrale, a.costo_unitario AS prezzo, a.quantita
                FROM Officina o JOIN Articolo a ON a.officina_codice=o.codice WHERE a.codice_articolo=?";
    } else { echo json_encode(["success"=>false,"data"=>[]]); exit; }

    $stmt = $db->prepare($sql);
    $stmt->bind_param("s", $codice); $stmt->execute();
    $res = $stmt->get_result();
    $data = [];
    while ($r = $res->fetch_assoc()) $data[] = $r;
    echo json_encode(["success" => true, "data" => $data]);
    exit;
}

echo json_encode(["success" => false, "error" => "action non valida"]);
?>