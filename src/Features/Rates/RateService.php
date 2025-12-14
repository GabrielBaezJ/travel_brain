<?php
namespace App\Features\Rates;

final class RateService {
  private RateRepositoryMongo $repo;
  private RateValidator $validator;

  public function __construct(RateRepositoryMongo $repo) {
    $this->repo = $repo;
    $this->validator = new RateValidator();
  }

  /**
   * Lista calificaciones con paginación
   */
  public function list(int $page = 1, int $size = 20, ?string $userId = null, ?string $destinationId = null): array {
    return $this->repo->findAll($page, $size, $userId, $destinationId);
  }

  /**
   * Obtiene una calificación por ID
   */
  public function get(string $id): ?array {
    return $this->repo->findById($id);
  }

  /**
   * Obtiene la calificación de un usuario para un destino específico
   */
  public function getUserRateForDestination(string $userId, string $destinationId): ?array {
    return $this->repo->findByUserAndDestination($userId, $destinationId);
  }

  /**
   * Crea o actualiza una calificación
   */
  public function createOrUpdate(array $input, string $userId): array {
    $input['userId'] = $userId;
    $this->validator->validateForCreate($input);
    
    // Verificar si ya existe una calificación del usuario para este destino
    $existing = $this->repo->findByUserAndDestination($userId, $input['destinationId']);
    
    $data = [
      'userId' => $userId,
      'destinationId' => $input['destinationId'],
      'rating' => (int)$input['rating'],
      'favorite' => $this->normalizeFavorite($input['favorite'] ?? false),
      'comment' => isset($input['comment']) && trim($input['comment']) !== '' ? trim($input['comment']) : null
    ];
    
    if ($existing) {
      // Actualizar existente
      $this->repo->update($existing['_id'], $data);
      return array_merge($existing, $data, ['_id' => $existing['_id']]);
    } else {
      // Crear nuevo
      $id = $this->repo->create($data);
      return array_merge($data, ['_id' => $id]);
    }
  }

  /**
   * Actualiza una calificación existente
   */
  public function update(string $id, array $input, string $userId): bool {
    $existing = $this->repo->findById($id);
    
    if (!$existing) {
      throw new \DomainException('Calificación no encontrada');
    }
    
    // Verificar que el usuario es el dueño de la calificación
    if ($existing['userId'] !== $userId) {
      throw new \DomainException('No tienes permiso para editar esta calificación');
    }
    
    $this->validator->validateForUpdate($input);
    
    $data = [];
    
    if (isset($input['rating'])) {
      $data['rating'] = (int)$input['rating'];
    }
    
    if (isset($input['favorite'])) {
      $data['favorite'] = $this->normalizeFavorite($input['favorite']);
    }
    
    if (isset($input['comment'])) {
      $data['comment'] = trim($input['comment']) !== '' ? trim($input['comment']) : null;
    }
    
    return $this->repo->update($id, $data);
  }

  /**
   * Alterna el estado de favorito
   */
  public function toggleFavorite(string $destinationId, string $userId): array {
    $existing = $this->repo->findByUserAndDestination($userId, $destinationId);
    
    if ($existing) {
      // Toggle el favorito
      $newFavorite = !$existing['favorite'];
      $this->repo->update($existing['_id'], ['favorite' => $newFavorite]);
      return array_merge($existing, ['favorite' => $newFavorite]);
    } else {
      // Crear con favorito = true y rating por defecto = 5
      $data = [
        'userId' => $userId,
        'destinationId' => $destinationId,
        'rating' => 5,
        'favorite' => true,
        'comment' => null
      ];
      $id = $this->repo->create($data);
      return array_merge($data, ['_id' => $id]);
    }
  }

  /**
   * Elimina una calificación
   */
  public function delete(string $id, string $userId): bool {
    $existing = $this->repo->findById($id);
    
    if (!$existing) {
      throw new \DomainException('Calificación no encontrada');
    }
    
    // Verificar que el usuario es el dueño
    if ($existing['userId'] !== $userId) {
      throw new \DomainException('No tienes permiso para eliminar esta calificación');
    }
    
    return $this->repo->delete($id);
  }

  /**
   * Obtiene el promedio y total de calificaciones de un destino
   */
  public function getDestinationStats(string $destinationId): array {
    return $this->repo->getAverageRating($destinationId);
  }

  /**
   * Obtiene los destinos favoritos del usuario
   */
  public function getFavorites(string $userId): array {
    return $this->repo->getFavoritesByUser($userId);
  }

  /**
   * Normaliza el valor de favorite a booleano
   */
  private function normalizeFavorite($value): bool {
    if (is_bool($value)) {
      return $value;
    }
    
    if ($value === 1 || $value === '1' || $value === 'true') {
      return true;
    }
    
    return false;
  }
}
