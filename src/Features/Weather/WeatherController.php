<?php
namespace App\Features\Weather;

use App\Core\Http\Request;
use App\Core\Http\Response;
use App\Core\Auth\AuthMiddleware;

final class WeatherController {
  private WeatherService $service;

  public function __construct(){
    $this->service = new WeatherService(new WeatherRepositoryMongo());
  }

  // GET /api/weather/current/{lat}/{lon}/{log}
  public function current(string $lat, string $lon, string $log = '0'): void {
    try {
      // Asegurar sesión para poder obtener userId y registrar historial
      AuthMiddleware::startSession();
      $lat = (float)$lat;
      $lon = (float)$lon;
      $label = '';
      $logFlag = $log === '1';
      if ($lat === 0.0 && (Request::get('lat', '') === '')) { Response::error('Parámetros faltantes: lat', 400); return; }
      if ($lon === 0.0 && (Request::get('lon', '') === '')) { Response::error('Parámetros faltantes: lon', 400); return; }
      $userId = AuthMiddleware::isAuthenticated() ? AuthMiddleware::getUserId() : null;
  $weather = $this->service->getCurrent($lat, $lon, $label, $logFlag, $userId);
  // Nota: el modelo Weather siempre retorna un objeto; si no hay datos reales, condition tendrá el mensaje de error
  Response::json($weather->toArray());
    } catch (\Throwable $e) {
      Response::error('Error al consultar clima', 500);
    }
  }

  // GET /api/weather/history/{page}/{size}
  public function history(string $page = '1', string $size = '10'): void {
    try {
      AuthMiddleware::startSession();
      if (!AuthMiddleware::isAuthenticated()) { Response::error('No autenticado', 401); return; }
      $page = max(1, (int)$page);
      $size = max(1, min(50, (int)$size));
      $data = $this->service->history(AuthMiddleware::getUserId(), $page, $size);
      Response::json(['ok' => true, 'items' => $data['items'], 'page' => $page, 'size' => $size, 'total' => $data['total']]);
    } catch (\Throwable $e) {
      Response::error('Error al obtener historial', 500);
    }
  }
}
