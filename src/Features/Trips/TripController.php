<?php
namespace App\Features\Trips;

use App\Core\Http\Response;
use App\Core\Http\Request;
use App\Core\Auth\AuthMiddleware;
use App\Core\Constants\ValidationRules;

final class TripController {
  private TripService $service;
  private const NOT_FOUND_MSG = 'Viaje no encontrado';

  public function __construct() {
    $repo = new TripRepositoryMongo();
    $this->service = new TripService($repo);
  }

  public function index(string $page = '1', string $size = '10'): void {
    try {
      $page = max(ValidationRules::DEFAULT_PAGE, (int)$page);
      $size = max(1, min(ValidationRules::MAX_PAGE_SIZE, (int)$size));
      $userId = AuthMiddleware::getUserId();

      if (!$userId) {
        Response::error('No autenticado', 401);
        return;
      }
      
      $trips = $this->service->list($page, $size, $userId);
      $total = $this->service->count($userId);
      
      Response::json([
        'ok' => true,
        'items' => $trips,
        'page' => $page,
        'size' => $size,
        'total' => $total
      ]);
    } catch (\Throwable $exception) {
      error_log('Error en index trips: ' . $exception->getMessage());
      Response::error('Error al obtener viajes', 500);
    }
  }

  public function show(string $id): void {
    try {
      $userId = AuthMiddleware::getUserId();
      
      if (!$userId) {
        Response::error('No autenticado', 401);
        return;
      }
      
      $trip = $this->service->get($id, $userId);
      
      if (!$trip) {
        Response::error(self::NOT_FOUND_MSG, 404);
        return;
      }
      
      Response::json(['ok' => true, 'trip' => $trip]);
    } catch (\DomainException $exception) {
      Response::error($exception->getMessage(), 403);
    } catch (\Throwable $exception) {
      error_log('Error en show trip: ' . $exception->getMessage());
      Response::error('Error al obtener viaje', 500);
    }
  }

  public function store(): void {
    try {
      $body = Request::body();
      $userId = AuthMiddleware::getUserId();
      
      if (!$userId) {
        Response::error('No autenticado', 401);
        return;
      }
      
      $tripId = $this->service->create($body, $userId);
      Response::json(['ok' => true, 'id' => $tripId], 201);
    } catch (\InvalidArgumentException $exception) {
      Response::error($exception->getMessage(), 400);
    } catch (\Throwable $exception) {
      error_log('Error en store trip: ' . $exception->getMessage());
      Response::error('Error al crear viaje', 500);
    }
  }

  public function update(string $id): void {
    try {
      $body = Request::body();
      $userId = AuthMiddleware::getUserId();
      
      if (!$userId) {
        Response::error('No autenticado', 401);
        return;
      }
      
      $success = $this->service->update($id, $body, $userId);
      
      if (!$success) {
        Response::error(self::NOT_FOUND_MSG, 404);
        return;
      }
      
      Response::json(['ok' => true]);
    } catch (\DomainException $exception) {
      Response::error($exception->getMessage(), 403);
    } catch (\InvalidArgumentException $exception) {
      Response::error($exception->getMessage(), 400);
    } catch (\Throwable $exception) {
      error_log('Error en update trip: ' . $exception->getMessage());
      Response::error('Error al actualizar viaje', 500);
    }
  }

  public function destroy(string $id): void {
    try {
      $userId = AuthMiddleware::getUserId();
      
      if (!$userId) {
        Response::error('No autenticado', 401);
        return;
      }
      
      $success = $this->service->delete($id, $userId);
      
      if (!$success) {
        Response::error(self::NOT_FOUND_MSG, 404);
        return;
      }
      
      Response::json(['ok' => true]);
    } catch (\DomainException $exception) {
      Response::error($exception->getMessage(), 403);
    } catch (\Throwable $exception) {
      error_log('Error en destroy trip: ' . $exception->getMessage());
      Response::error('Error al eliminar viaje', 500);
    }
  }
}
