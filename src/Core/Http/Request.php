<?php
namespace App\Core\Http;

final class Request {
  public static function body(): array {
    return json_decode(file_get_contents('php://input'), true) ?? [];
  }

  public static function get(string $key, $default = null) {
    return $_GET[$key] ?? $default;
  }

  public static function post(string $key, $default = null) {
    return $_POST[$key] ?? $default;
  }

  public static function has(string $key): bool {
    return isset($_GET[$key]) || isset($_POST[$key]);
  }
}

