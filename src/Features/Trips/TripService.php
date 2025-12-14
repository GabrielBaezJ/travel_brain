<?php
namespace App\Features\Trips;

use MongoDB\BSON\UTCDateTime;

final class TripService {
  private TripRepositoryMongo $repository;
  private TripValidator $validator;

  public function __construct(TripRepositoryMongo $repository) {
    $this->repository = $repository;
    $this->validator = new TripValidator();
  }

  public function list(int $page, int $size, string $userId): array {
    $skip = ($page - 1) * $size;
    $documents = $this->repository->findByUserId($userId, $skip, $size);
    
    return array_map(function ($doc) {
      return Trip::fromDocument((array)$doc)->toArray();
    }, $documents);
  }

  public function get(string $id, string $userId): ?array {
    $doc = $this->repository->findById($id);
    
    if (!$doc) {
      return null;
    }
    
    // Verificar que el trip pertenece al usuario
    if ($doc['userId'] !== $userId) {
      throw new \DomainException('No tienes permiso para ver este viaje');
    }
    
    return Trip::fromDocument($doc)->toArray();
  }

  public function create(array $input, string $userId): string {
    // Normalizar campos (acepta camelCase o snake_case)
    $input = $this->validator->normalize($input);
    $this->validator->validateForCreate($input);
    
  $startDate = \DateTime::createFromFormat('Y-m-d', $input['start_date']);
  $endDate = \DateTime::createFromFormat('Y-m-d', $input['end_date']);
    
    $data = [
      'userId' => $userId,
      'title' => trim($input['title']),
      'destination' => trim($input['destination']),
  // Guardar como BSON UTCDateTime (milisegundos desde epoch)
  'startDate' => new UTCDateTime(((int)$startDate->format('U')) * 1000),
  'endDate' => new UTCDateTime(((int)$endDate->format('U')) * 1000),
      'budget' => isset($input['budget']) && $input['budget'] !== '' ? (float)$input['budget'] : null,
      'description' => isset($input['description']) ? trim($input['description']) : null,
      'createdAt' => new UTCDateTime(),
      'updatedAt' => new UTCDateTime(),
    ];
    
    return $this->repository->create($data);
  }

  public function update(string $id, array $input, string $userId): bool {
    $existing = $this->repository->findById($id);
    
    if (!$existing) {
      return false;
    }
    
    // Verificar que el trip pertenece al usuario
    if ($existing['userId'] !== $userId) {
      throw new \DomainException('No tienes permiso para editar este viaje');
    }
    
    // Normalizar campos (acepta camelCase o snake_case)
    $input = $this->validator->normalize($input);
    $this->validator->validateForUpdate($input);
    
    $updateData = ['updatedAt' => new UTCDateTime()];
    
    if (isset($input['title'])) {
      $updateData['title'] = trim($input['title']);
    }
    
    if (isset($input['destination'])) {
      $updateData['destination'] = trim($input['destination']);
    }
    
    if (isset($input['start_date'])) {
      $startDate = \DateTime::createFromFormat('Y-m-d', $input['start_date']);
      $updateData['startDate'] = new UTCDateTime(((int)$startDate->format('U')) * 1000);
    }
    
    if (isset($input['end_date'])) {
      $endDate = \DateTime::createFromFormat('Y-m-d', $input['end_date']);
      $updateData['endDate'] = new UTCDateTime(((int)$endDate->format('U')) * 1000);
    }
    
    if (isset($input['budget'])) {
      $updateData['budget'] = $input['budget'] !== '' ? (float)$input['budget'] : null;
    }
    
    if (isset($input['description'])) {
      $updateData['description'] = trim($input['description']);
    }
    
    return $this->repository->update($id, $updateData);
  }

  public function delete(string $id, string $userId): bool {
    $existing = $this->repository->findById($id);
    
    if (!$existing) {
      return false;
    }
    
    // Verificar que el trip pertenece al usuario
    if ($existing['userId'] !== $userId) {
      throw new \DomainException('No tienes permiso para eliminar este viaje');
    }
    
    return $this->repository->delete($id);
  }

  public function count(string $userId): int {
    return $this->repository->countByUserId($userId);
  }
}
