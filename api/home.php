<?php
$uri = $_SERVER['REQUEST_URI'];
if ($uri === '/' || $uri === '/index.html' || $uri === '/index.php') {
    header('Location: index.html');
    exit;
}