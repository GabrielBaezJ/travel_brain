<?php
namespace App\Core\Http;

final class Response {
  public static function json($data, int $status = 200): void {
    http_response_code($status);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
  }
  public static function error(string $message, int $status = 400): void {
    // Mantener compatibilidad: el frontend espera 'msg' en lugar de 'error'
    self::json(['ok' => false, 'msg' => $message], $status);
  }
}
