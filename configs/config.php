<?php
require_once __DIR__ . '/../vendor/autoload.php';

use Dotenv\Dotenv;

$dotenv = Dotenv::createImmutable(__DIR__ . '/../');
$dotenv->load();

class Config {
    static public $hostname;
    static public $username;
    static public $password;
    static public $database;
    static public $port;
}

Config::$hostname = $_ENV['DB_HOSTNAME'] ?? 'localhost';
Config::$username = $_ENV['DB_USERNAME'] ?? '';
Config::$password = $_ENV['DB_PASSWORD'] ?? '';
Config::$database = $_ENV['DB_DATABASE'] ?? '';
Config::$port = $_ENV['DB_PORT'] ?? 3306;
?>
