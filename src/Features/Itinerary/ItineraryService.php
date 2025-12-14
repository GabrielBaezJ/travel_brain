<?php
namespace App\Features\Itinerary;

use MongoDB\BSON\ObjectId;

class ItineraryService {
  private ItineraryRepositoryMongo $repository;

  public function __construct(ItineraryRepositoryMongo $repository) {
    $this->repository = $repository;
  }

  public function createItinerary(
    string $userId,
    string $tripId,
    int $totalDays,
    array $days,
    string $interests = 'cultura',
    string $budgetStyle = 'medio',
    string $generatedBy = 'basic',
    ?string $destinationId = null,
    ?string $notes = null
  ): ?array {
    try {
      $itinerary = new Itinerary(
        userId: new ObjectId($userId),
        tripId: new ObjectId($tripId),
        totalDays: $totalDays,
        days: $days,
        interests: $interests,
        budgetStyle: $budgetStyle,
        generatedBy: $generatedBy,
        destinationId: $destinationId ? new ObjectId($destinationId) : null,
        notes: $notes
      );

      $created = $this->repository->create($itinerary);
      return $created ? $created->toArray() : null;
    } catch (\Exception $e) {
      error_log("Error creating itinerary: " . $e->getMessage());
      return null;
    }
  }

  public function getItineraryByTripId(string $tripId): ?array {
    $itinerary = $this->repository->findByTripId($tripId);
    return $itinerary ? $itinerary->toArray() : null;
  }

  public function getItineraryById(string $id): ?array {
    $itinerary = $this->repository->findById($id);
    return $itinerary ? $itinerary->toArray() : null;
  }

  public function getUserItineraries(string $userId): array {
    $itineraries = $this->repository->findByUserId($userId);
    return array_map(fn($it) => $it->toArray(), $itineraries);
  }

  public function getUserItinerariesWithDetails(string $userId): array {
    return $this->repository->getWithTripDetails($userId);
  }

  public function updateItinerary(string $id, array $data): ?array {
    try {
      $updateData = [];

      if (isset($data['totalDays'])) {
        $updateData['totalDays'] = (int)$data['totalDays'];
      }

      if (isset($data['days'])) {
        $updateData['days'] = $data['days'];
      }

      if (isset($data['interests'])) {
        $updateData['interests'] = $data['interests'];
      }

      if (isset($data['budgetStyle'])) {
        $updateData['budgetStyle'] = $data['budgetStyle'];
      }

      if (isset($data['notes'])) {
        $updateData['notes'] = $data['notes'];
      }

      if (isset($data['destinationId'])) {
        $updateData['destinationId'] = new ObjectId($data['destinationId']);
      }

      if (empty($updateData)) {
        return null;
      }

      $updated = $this->repository->update($id, $updateData);
      return $updated ? $updated->toArray() : null;
    } catch (\Exception $e) {
      error_log("Error updating itinerary: " . $e->getMessage());
      return null;
    }
  }

  public function updateDay(string $id, int $dayNumber, array $activities): ?array {
    try {
      $itinerary = $this->repository->findById($id);
      if (!$itinerary) {
        return null;
      }

      $days = $itinerary->days;
      $dayFound = false;

      foreach ($days as &$day) {
        if ($day['dayNumber'] === $dayNumber) {
          $day['activities'] = $activities;
          $dayFound = true;
          break;
        }
      }

      if (!$dayFound) {
        $days[] = [
          'dayNumber' => $dayNumber,
          'activities' => $activities
        ];
      }

      $updated = $this->repository->update($id, ['days' => $days]);
      return $updated ? $updated->toArray() : null;
    } catch (\Exception $e) {
      error_log("Error updating day: " . $e->getMessage());
      return null;
    }
  }

  public function deleteItinerary(string $id): bool {
    return $this->repository->delete($id);
  }

  public function deleteByTripId(string $tripId): bool {
    return $this->repository->deleteByTripId($tripId);
  }

  public function createOrUpdateByTripId(
    string $userId,
    string $tripId,
    int $totalDays,
    array $days,
    string $interests = 'cultura',
    string $budgetStyle = 'medio',
    string $generatedBy = 'basic',
    ?string $destinationId = null,
    ?string $notes = null
  ): ?array {
    $existing = $this->repository->findByTripId($tripId);

    if ($existing) {
      return $this->updateItinerary((string)$existing->id, [
        'totalDays' => $totalDays,
        'days' => $days,
        'interests' => $interests,
        'budgetStyle' => $budgetStyle,
        'generatedBy' => $generatedBy,
        'destinationId' => $destinationId,
        'notes' => $notes
      ]);
    }

    return $this->createItinerary(
      $userId,
      $tripId,
      $totalDays,
      $days,
      $interests,
      $budgetStyle,
      $generatedBy,
      $destinationId,
      $notes
    );
  }
}
