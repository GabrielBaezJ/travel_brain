<?php
namespace App\Features\Itinerary;

use App\Core\Database\MongoConnection;
use MongoDB\BSON\ObjectId;
use MongoDB\BSON\UTCDateTime;

class ItineraryRepositoryMongo {
  private $collection;

  public function __construct() {
    $mongoClient = MongoConnection::client();
    $db = $mongoClient->selectDatabase(getenv('MONGO_DB') ?: 'travel_brain');
    $this->collection = $db->itineraries;
  }

  public function create(Itinerary $itinerary): ?Itinerary {
    try {
      $document = [
        'userId' => $itinerary->userId,
        'tripId' => $itinerary->tripId,
        'destinationId' => $itinerary->destinationId,
        'totalDays' => $itinerary->totalDays,
        'days' => $itinerary->days,
        'interests' => $itinerary->interests,
        'budgetStyle' => $itinerary->budgetStyle,
        'generatedBy' => $itinerary->generatedBy,
        'notes' => $itinerary->notes,
        'createdAt' => $itinerary->createdAt,
        'updatedAt' => new UTCDateTime()
      ];

      $result = $this->collection->insertOne($document);
      $itinerary->id = $result->getInsertedId();
      return $itinerary;
    } catch (\Exception $e) {
      error_log("Error creating itinerary: " . $e->getMessage());
      return null;
    }
  }

  public function findById(string $id): ?Itinerary {
    try {
      $doc = $this->collection->findOne(['_id' => new ObjectId($id)]);
      return $doc ? Itinerary::fromDocument((array)$doc) : null;
    } catch (\Exception $e) {
      error_log("Error finding itinerary by ID: " . $e->getMessage());
      return null;
    }
  }

  public function findByTripId(string $tripId): ?Itinerary {
    try {
      $doc = $this->collection->findOne(['tripId' => new ObjectId($tripId)]);
      return $doc ? Itinerary::fromDocument((array)$doc) : null;
    } catch (\Exception $e) {
      error_log("Error finding itinerary by trip ID: " . $e->getMessage());
      return null;
    }
  }

  public function findByUserId(string $userId): array {
    try {
      $cursor = $this->collection->find(['userId' => new ObjectId($userId)]);
      $itineraries = [];
      foreach ($cursor as $doc) {
        $itineraries[] = Itinerary::fromDocument((array)$doc);
      }
      return $itineraries;
    } catch (\Exception $e) {
      error_log("Error finding itineraries by user ID: " . $e->getMessage());
      return [];
    }
  }

  public function update(string $id, array $data): ?Itinerary {
    try {
      $data['updatedAt'] = new UTCDateTime();
      
      $result = $this->collection->updateOne(
        ['_id' => new ObjectId($id)],
        ['$set' => $data]
      );

      if ($result->getModifiedCount() === 0) {
        return null;
      }

      return $this->findById($id);
    } catch (\Exception $e) {
      error_log("Error updating itinerary: " . $e->getMessage());
      return null;
    }
  }

  public function delete(string $id): bool {
    try {
      $result = $this->collection->deleteOne(['_id' => new ObjectId($id)]);
      return $result->getDeletedCount() > 0;
    } catch (\Exception $e) {
      error_log("Error deleting itinerary: " . $e->getMessage());
      return false;
    }
  }

  public function deleteByTripId(string $tripId): bool {
    try {
      $result = $this->collection->deleteMany(['tripId' => new ObjectId($tripId)]);
      return $result->getDeletedCount() > 0;
    } catch (\Exception $e) {
      error_log("Error deleting itineraries by trip ID: " . $e->getMessage());
      return false;
    }
  }

  public function getWithTripDetails(string $userId): array {
    try {
      $pipeline = [
        ['$match' => ['userId' => new ObjectId($userId)]],
        ['$lookup' => [
          'from' => 'trips',
          'localField' => 'tripId',
          'foreignField' => '_id',
          'as' => 'trip'
        ]],
        ['$unwind' => '$trip'],
        ['$lookup' => [
          'from' => 'destinations',
          'localField' => 'destinationId',
          'foreignField' => '_id',
          'as' => 'destination'
        ]],
        ['$unwind' => [
          'path' => '$destination',
          'preserveNullAndEmptyArrays' => true
        ]],
        ['$sort' => ['createdAt' => -1]]
      ];

      $cursor = $this->collection->aggregate($pipeline);
      $results = [];
      
      foreach ($cursor as $doc) {
        $docArray = (array)$doc;
        $itinerary = Itinerary::fromDocument($docArray);
        $itineraryArray = $itinerary->toArray();
        $itineraryArray['trip'] = isset($docArray['trip']) ? (array)$docArray['trip'] : null;
        $itineraryArray['destination'] = isset($docArray['destination']) ? (array)$docArray['destination'] : null;
        $results[] = $itineraryArray;
      }

      return $results;
    } catch (\Exception $e) {
      error_log("Error getting itineraries with trip details: " . $e->getMessage());
      return [];
    }
  }
}
