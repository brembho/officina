<?php
header('Content-Type: application/json');
session_start();

if (!isset($_SESSION['user'])) {
    http_response_code(401);
    echo json_encode(["success" => false, "error" => "non autenticato"]);
    exit;
}

if (!isset($_SESSION['carrello'])) {
    $_SESSION['carrello'] = [];
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {

    case 'GET':
        echo json_encode(["success" => true, "data" => array_values($_SESSION['carrello'])]);
        break;

    case 'POST':
        $body   = json_decode(file_get_contents("php://input"), true);
        // la chiave include tipo + codice + officina, così servizi e ricambi non si scontrano
        $id     = $body['prodotto_id'];
        $nome   = $body['nome'];
        $prezzo = (float) $body['prezzo'];
        $qtaDisp = isset($body['quantita_disponibile']) ? (int) $body['quantita_disponibile'] : null;

        if (isset($_SESSION['carrello'][$id])) {
            // se il prodotto è già nel carrello e ha limite di quantità, controlla
            $qtaAttualeDisp = $_SESSION['carrello'][$id]['quantita_disponibile'] ?? $qtaDisp;
            if ($qtaAttualeDisp !== null && $_SESSION['carrello'][$id]['quantita'] >= $qtaAttualeDisp) {
                echo json_encode(["success" => false, "error" => "Quantità massima disponibile raggiunta"]);
                break;
            }
            $_SESSION['carrello'][$id]['quantita']++;
            // aggiorna quantita_disponibile se passato
            if ($qtaDisp !== null) {
                $_SESSION['carrello'][$id]['quantita_disponibile'] = $qtaDisp;
            }
        } else {
            $_SESSION['carrello'][$id] = [
                'id'       => $id,
                'nome'     => $nome,
                'prezzo'   => $prezzo,
                'quantita' => 1,
                'quantita_disponibile' => $qtaDisp
            ];
        }
        echo json_encode(["success" => true, "data" => array_values($_SESSION['carrello'])]);
        break;

    case 'PUT':
        // cambia quantità di un item (+1 o -1)
        $body = json_decode(file_get_contents("php://input"), true);
        $id   = $body['prodotto_id'];
        $op   = $body['op']; // 'inc' o 'dec'

        if (isset($_SESSION['carrello'][$id])) {
            if ($op === 'inc') {
                $qtaDisp = isset($_SESSION['carrello'][$id]['quantita_disponibile']) ? $_SESSION['carrello'][$id]['quantita_disponibile'] : null;
                // controlla se c'è limite di disponibilità
                if ($qtaDisp !== null && $_SESSION['carrello'][$id]['quantita'] >= $qtaDisp) {
                    echo json_encode(["success" => false, "error" => "Quantità massima disponibile raggiunta"]);
                    break;
                }
                $_SESSION['carrello'][$id]['quantita']++;
            } elseif ($op === 'dec') {
                $_SESSION['carrello'][$id]['quantita']--;
                if ($_SESSION['carrello'][$id]['quantita'] <= 0) {
                    unset($_SESSION['carrello'][$id]);
                }
            }
        }
        echo json_encode(["success" => true, "data" => array_values($_SESSION['carrello'])]);
        break;

    case 'DELETE':
        $body = json_decode(file_get_contents("php://input"), true);
        unset($_SESSION['carrello'][$body['prodotto_id']]);
        echo json_encode(["success" => true, "data" => array_values($_SESSION['carrello'])]);
        break;

    default:
        http_response_code(405);
        echo json_encode(["success" => false, "error" => "metodo non supportato"]);
}