<?php
namespace App\Features\Trips;

use App\Core\Database\MongoConnection;
use MongoDB\Collection;
use MongoDB\BSON\ObjectId;
use MongoDB\BSON\UTCDateTime;

final class TripRepositoryMongo {
  private Collection $collection;

  public function __construct() {
    $db = MongoConnection::client()->selectDatabase(getenv('MONGO_DB') ?: 'travel_brain');
    $this->collection = $db->selectCollection('trips');
  }

  public function findById(string $id): ?array {
    try {
      $trip = $this->collection->findOne(['_id' => new ObjectId($id)]);
      return $trip ? (array)$trip : null;
    } catch (\Exception $e) {
      error_log('Error finding trip by id: ' . $e->getMessage());
      return null;
    }
  }

  public function findByUserId(string $userId, int $skip, int $limit): array {
    try {
      $cursor = $this->collection->find(
        ['userId' => $userId],
        [
          'sort' => ['createdAt' => -1],
          'skip' => $skip,
          'limit' => $limit
        ]
      );
      
      return array_map(fn($doc) => (array)$doc, iterator_to_array($cursor));
    } catch (\Exception $e) {
      error_log('Error finding trips by user: ' . $e->getMessage());
      return [];
    }
  }

  public function countByUserId(string $userId): int {
    try {
      return $this->collection->countDocuments(['userId' => $userId]);
    } catch (\Exception $e) {
      error_log('Error counting trips: ' . $e->getMessage());
      return 0;
    }
  }

  public function create(array $data): string {
    try {
      // Debug log of payload (no passwords or sensitive data here)
      error_log('TripRepositoryMongo.create inserting: ' . json_encode([
        'userId' => $data['userId'] ?? null,
        'title' => $data['title'] ?? null,
        'destination' => $data['destination'] ?? null,
        'startDateType' => isset($data['startDate']) ? get_class($data['startDate']) : null,
        'endDateType' => isset($data['endDate']) ? get_class($data['endDate']) : null,
      ]));
      $result = $this->collection->insertOne($data);
      return (string)$result->getInsertedId();
    } catch (\Exception $e) {
      error_log('Error creating trip: ' . $e->getMessage() . ' TRACE: ' . $e->getTraceAsString());
      throw new \RuntimeException('Error al crear el viaje');
    }
  }

  public function update(string $id, array $data): bool {
    try {
      $result = $this->collection->updateOne(
        ['_id' => new ObjectId($id)],
        ['$set' => $data]
      );
      
      return $result->getModifiedCount() > 0;
    } catch (\Exception $e) {
      error_log('Error updating trip: ' . $e->getMessage());
      return false;
    }
  }

  public function delete(string $id): bool {
    try {
      $result = $this->collection->deleteOne(['_id' => new ObjectId($id)]);
      return $result->getDeletedCount() > 0;
    } catch (\Exception $e) {
      error_log('Error deleting trip: ' . $e->getMessage());
      return false;
    }
  }
}
