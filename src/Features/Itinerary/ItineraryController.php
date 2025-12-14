<?php
namespace App\Features\Itinerary;

use App\Core\Http\Response;
use App\Core\Http\Request;
use App\Core\Auth\AuthMiddleware;

final class ItineraryController {
  private ItineraryService $service;

  public function __construct() {
    $repo = new ItineraryRepositoryMongo();
    $this->service = new ItineraryService($repo);
  }

  /**
   * POST /api/trips/{tripId}/itinerary - Crear o actualizar itinerario
   */
  public function create(string $tripId): void {
    try {
      AuthMiddleware::startSession();
      if (!AuthMiddleware::isAuthenticated()) {
        Response::error('No autenticado', 401);
        return;
      }
      
      $userId = AuthMiddleware::getUserId();
      $body = Request::body();
      
      if (!$body || empty($body)) {
        Response::error('Datos requeridos', 400);
        return;
      }

      // Agregar tripId desde la URL
      $body['tripId'] = $tripId;
      
      $errors = ItineraryValidator::validateCreate($body);
      if (!empty($errors)) {
        Response::json(['ok' => false, 'errors' => $errors], 400);
        return;
      }

      $itinerary = $this->service->createOrUpdateByTripId(
        userId: $userId,
        tripId: $body['tripId'],
        totalDays: (int)($body['totalDays'] ?? 1),
        days: $body['days'] ?? [],
        interests: $body['interests'] ?? 'cultura',
        budgetStyle: $body['budgetStyle'] ?? 'medio',
        generatedBy: $body['generatedBy'] ?? 'basic',
        destinationId: $body['destinationId'] ?? null,
        notes: $body['notes'] ?? null
      );

      if (!$itinerary) {
        Response::error('Error al crear itinerario', 500);
        return;
      }

      Response::json(['ok' => true, 'itinerary' => $itinerary], 201);
      
    } catch (\InvalidArgumentException $e) {
      Response::error($e->getMessage(), 400);
    } catch (\Throwable $e) {
      error_log('Error en create itinerary: ' . $e->getMessage());
      Response::error('Error al crear itinerario', 500);
    }
  }

  /**
   * GET /api/trips/{tripId}/itinerary - Obtener itinerario por trip ID
   */
  public function getByTripId(string $tripId): void {
    try {
      AuthMiddleware::startSession();
      if (!AuthMiddleware::isAuthenticated()) {
        Response::error('No autenticado', 401);
        return;
      }
      
      $userId = AuthMiddleware::getUserId();
      $itinerary = $this->service->getItineraryByTripId($tripId);
      
      if (!$itinerary) {
        Response::error('Itinerario no encontrado', 404);
        return;
      }

      // Verificar que el itinerario pertenece al usuario
      if ($itinerary['userId'] !== $userId) {
        Response::error('No autorizado', 403);
        return;
      }

      Response::json(['ok' => true, 'itinerary' => $itinerary]);
      
    } catch (\Throwable $e) {
      error_log('Error en getByTripId: ' . $e->getMessage());
      Response::error('Error al obtener itinerario', 500);
    }
  }

  /**
   * GET /api/users/me/itineraries/{page}/{size} - Obtener todos los itinerarios del usuario
   */
  public function getUserItineraries(string $page = '1', string $size = '10'): void {
    try {
      AuthMiddleware::startSession();
      if (!AuthMiddleware::isAuthenticated()) {
        Response::error('No autenticado', 401);
        return;
      }
      
      $userId = AuthMiddleware::getUserId();
      $page = max(1, (int)$page);
      $size = max(1, min(100, (int)$size));
      $withDetails = Request::get('details', 'false') === 'true';

      if ($withDetails) {
        $itineraries = $this->service->getUserItinerariesWithDetails($userId);
      } else {
        $itineraries = $this->service->getUserItineraries($userId);
      }

      Response::json(['ok' => true, 'itineraries' => $itineraries]);
      
    } catch (\Throwable $e) {
      error_log('Error en getUserItineraries: ' . $e->getMessage());
      Response::error('Error al obtener itinerarios', 500);
    }
  }

  /**
   * PUT /api/itineraries/{id} - Actualizar itinerario
   */
  public function update(string $id): void {
    try {
      AuthMiddleware::startSession();
      if (!AuthMiddleware::isAuthenticated()) {
        Response::error('No autenticado', 401);
        return;
      }
      
      $userId = AuthMiddleware::getUserId();
      $existing = $this->service->getItineraryById($id);
      
      if (!$existing) {
        Response::error('Itinerario no encontrado', 404);
        return;
      }

      if ($existing['userId'] !== $userId) {
        Response::error('No autorizado', 403);
        return;
      }

      $body = Request::body();
      $errors = ItineraryValidator::validateUpdate($body);

      if (!empty($errors)) {
        Response::json(['ok' => false, 'errors' => $errors], 400);
        return;
      }

      $updated = $this->service->updateItinerary($id, $body);

      if (!$updated) {
        Response::error('Error al actualizar itinerario', 500);
        return;
      }

      Response::json(['ok' => true, 'itinerary' => $updated]);
      
    } catch (\Throwable $e) {
      error_log('Error en update itinerary: ' . $e->getMessage());
      Response::error('Error al actualizar itinerario', 500);
    }
  }

  /**
   * PUT /api/itineraries/{id}/days/{dayNumber} - Actualizar día específico
   */
  public function updateDay(string $id, string $dayNumber): void {
    try {
      AuthMiddleware::startSession();
      if (!AuthMiddleware::isAuthenticated()) {
        Response::error('No autenticado', 401);
        return;
      }
      
      $userId = AuthMiddleware::getUserId();
      $existing = $this->service->getItineraryById($id);
      
      if (!$existing) {
        Response::error('Itinerario no encontrado', 404);
        return;
      }

      if ($existing['userId'] !== $userId) {
        Response::error('No autorizado', 403);
        return;
      }

      $body = Request::body();
      
      if (!isset($body['activities']) || !is_array($body['activities'])) {
        Response::error('Se requiere array de actividades', 400);
        return;
      }

      $updated = $this->service->updateDay($id, (int)$dayNumber, $body['activities']);

      if (!$updated) {
        Response::error('Error al actualizar día', 500);
        return;
      }

      Response::json(['ok' => true, 'itinerary' => $updated]);
      
    } catch (\Throwable $e) {
      error_log('Error en updateDay: ' . $e->getMessage());
      Response::error('Error al actualizar día', 500);
    }
  }

  /**
   * DELETE /api/itineraries/{id} - Eliminar itinerario
   */
  public function delete(string $id): void {
    try {
      AuthMiddleware::startSession();
      if (!AuthMiddleware::isAuthenticated()) {
        Response::error('No autenticado', 401);
        return;
      }
      
      $userId = AuthMiddleware::getUserId();
      $existing = $this->service->getItineraryById($id);
      
      if (!$existing) {
        Response::error('Itinerario no encontrado', 404);
        return;
      }

      if ($existing['userId'] !== $userId) {
        Response::error('No autorizado', 403);
        return;
      }

      $deleted = $this->service->deleteItinerary($id);

      if (!$deleted) {
        Response::error('Error al eliminar itinerario', 500);
        return;
      }

      Response::json(['ok' => true, 'message' => 'Itinerario eliminado']);
      
    } catch (\Throwable $e) {
      error_log('Error en delete itinerary: ' . $e->getMessage());
      Response::error('Error al eliminar itinerario', 500);
    }
  }
}
