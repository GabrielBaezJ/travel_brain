<?php
$uri = urldecode(parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH));

$documentRoot = __DIR__;
$requestedPath = realpath($documentRoot . $uri);

if ($uri !== '/' && $requestedPath !== false && str_starts_with($requestedPath, $documentRoot) && is_file($requestedPath)) {
    return false;
}

require $documentRoot . '/index.php';
