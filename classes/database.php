<?php
require_once __DIR__ . "/../configs/config.php";

class database {
    private $conn;

    public function __construct() {
        $host = Config::$hostname;
        $user = Config::$username;
        $pass = Config::$password;
        $db = Config::$database;
        $port = Config::$port ?? 3306;

        $this->conn = new mysqli($host, $user, $pass, $db, $port);
        if ($this->conn->connect_error) {
            die(json_encode(["error" => "connessione DB fallita: " . $this->conn->connect_error]));
        }
    }

    public function query($sql) {
        return $this->conn->query($sql);
    }

    public function prepare($sql) {
        return $this->conn->prepare($sql);
    }

    public function __destruct() {
        $this->conn->close();
    }
}