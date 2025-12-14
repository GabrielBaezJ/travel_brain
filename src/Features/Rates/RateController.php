<?php
namespace App\Features\Rates;

use App\Core\Http\Response;
use App\Core\Http\Request;
use App\Core\Auth\AuthMiddleware;

final class RateController {
  private RateService $service;

  public function __construct() {
    $repo = new RateRepositoryMongo();
    $this->service = new RateService($repo);
  }

  /**
   * GET /api/destinations/{destinationId}/rates/{page}/{size} - Lista calificaciones de un destino
   */
  public function index(string $destinationId, string $page = '1', string $size = '20'): void {
    try {
      $page = max(1, (int)$page);
      $size = max(1, min(100, (int)$size));
      
      $rates = $this->service->list($page, $size, null, $destinationId);
      $stats = $this->service->getDestinationStats($destinationId);
      
      Response::json([
        'ok' => true,
        'items' => $rates,
        'stats' => $stats,
        'page' => $page,
        'size' => $size
      ]);
    } catch (\Throwable $exception) {
      error_log('Error en index rates: ' . $exception->getMessage());
      Response::error('Error al obtener calificaciones', 500);
    }
  }

  /**
   * GET /api/destinations/{destinationId}/rates/stats - Estadísticas de calificación
   */
  public function stats(string $destinationId): void {
    try {
      $stats = $this->service->getDestinationStats($destinationId);
      
      Response::json([
        'ok' => true,
        'stats' => $stats
      ]);
    } catch (\Throwable $exception) {
      error_log('Error en stats: ' . $exception->getMessage());
      Response::error('Error al obtener estadísticas', 500);
    }
  }

  /**
   * POST /api/destinations/{destinationId}/rate - Calificar destino
   */
  public function rate(string $destinationId): void {
    try {
      AuthMiddleware::startSession();
      if (!AuthMiddleware::isAuthenticated()) {
        Response::error('No autenticado', 401);
        return;
      }
      
      $userId = AuthMiddleware::getUserId();
      $body = Request::body();
      $body['destinationId'] = $destinationId;
      
      $rate = $this->service->createOrUpdate($body, $userId);
      
      Response::json(['ok' => true, 'rate' => $rate], 201);
    } catch (\InvalidArgumentException $exception) {
      Response::error($exception->getMessage(), 400);
    } catch (\Throwable $exception) {
      error_log('Error en rate: ' . $exception->getMessage());
      Response::error('Error al calificar destino', 500);
    }
  }

  /**
   * GET /api/destinations/{destinationId}/my-rate - Obtiene mi calificación de un destino
   */
  public function myRate(string $destinationId): void {
    try {
      AuthMiddleware::startSession();
      if (!AuthMiddleware::isAuthenticated()) {
        Response::json(['ok' => true, 'rate' => null]);
        return;
      }
      
      $userId = AuthMiddleware::getUserId();
      $rate = $this->service->getUserRateForDestination($userId, $destinationId);
      
      Response::json(['ok' => true, 'rate' => $rate]);
    } catch (\Throwable $exception) {
      error_log('Error en myRate: ' . $exception->getMessage());
      Response::error('Error al obtener calificación', 500);
    }
  }

  /**
   * POST /api/destinations/{destinationId}/favorite - Toggle favorito
   */
  public function toggleFavorite(string $destinationId): void {
    try {
      AuthMiddleware::startSession();
      if (!AuthMiddleware::isAuthenticated()) {
        Response::error('No autenticado', 401);
        return;
      }
      
      $userId = AuthMiddleware::getUserId();
      $rate = $this->service->toggleFavorite($destinationId, $userId);
      
      Response::json(['ok' => true, 'rate' => $rate]);
    } catch (\Throwable $exception) {
      error_log('Error en toggleFavorite: ' . $exception->getMessage());
      Response::error('Error al actualizar favorito', 500);
    }
  }

  /**
   * GET /api/users/me/rates/{page}/{size} - Mis calificaciones
   */
  public function myRates(string $page = '1', string $size = '20'): void {
    try {
      AuthMiddleware::startSession();
      if (!AuthMiddleware::isAuthenticated()) {
        Response::error('No autenticado', 401);
        return;
      }
      
      $userId = AuthMiddleware::getUserId();
      $page = max(1, (int)$page);
      $size = max(1, min(100, (int)$size));
      
      $rates = $this->service->list($page, $size, $userId, null);
      
      Response::json([
        'ok' => true,
        'items' => $rates,
        'page' => $page,
        'size' => $size
      ]);
    } catch (\Throwable $exception) {
      error_log('Error en myRates: ' . $exception->getMessage());
      Response::error('Error al obtener calificaciones', 500);
    }
  }

  /**
   * GET /api/users/me/favorites - Mis destinos favoritos
   */
  public function myFavorites(): void {
    try {
      AuthMiddleware::startSession();
      if (!AuthMiddleware::isAuthenticated()) {
        Response::error('No autenticado', 401);
        return;
      }
      
      $userId = AuthMiddleware::getUserId();
      $favorites = $this->service->getFavorites($userId);
      
      Response::json([
        'ok' => true,
        'items' => $favorites
      ]);
    } catch (\Throwable $exception) {
      error_log('Error en myFavorites: ' . $exception->getMessage());
      Response::error('Error al obtener favoritos', 500);
    }
  }

  /**
   * PUT /api/rates/{id} - Actualizar calificación
   */
  public function update(string $id): void {
    try {
      AuthMiddleware::startSession();
      if (!AuthMiddleware::isAuthenticated()) {
        Response::error('No autenticado', 401);
        return;
      }
      
      $userId = AuthMiddleware::getUserId();
      $body = Request::body();
      
      $this->service->update($id, $body, $userId);
      
      Response::json(['ok' => true]);
    } catch (\InvalidArgumentException $exception) {
      Response::error($exception->getMessage(), 400);
    } catch (\DomainException $exception) {
      Response::error($exception->getMessage(), 403);
    } catch (\Throwable $exception) {
      error_log('Error en update rate: ' . $exception->getMessage());
      Response::error('Error al actualizar calificación', 500);
    }
  }

  /**
   * DELETE /api/rates/{id} - Eliminar calificación
   */
  public function delete(string $id): void {
    try {
      AuthMiddleware::startSession();
      if (!AuthMiddleware::isAuthenticated()) {
        Response::error('No autenticado', 401);
        return;
      }
      
      $userId = AuthMiddleware::getUserId();
      $this->service->delete($id, $userId);
      
      Response::json(['ok' => true]);
    } catch (\DomainException $exception) {
      Response::error($exception->getMessage(), 403);
    } catch (\Throwable $exception) {
      error_log('Error en delete rate: ' . $exception->getMessage());
      Response::error('Error al eliminar calificación', 500);
    }
  }
}
