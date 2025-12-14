<?php
namespace App\Features\Destinations;

use App\Core\Contracts\DestinationRepositoryInterface;
use App\Core\Database\MongoConnection;
use MongoDB\BSON\ObjectId;
use MongoDB\BSON\UTCDateTime;

final class DestinationRepositoryMongo implements DestinationRepositoryInterface {
  private $col;

  public function __construct() {
    $db = MongoConnection::client()->selectDatabase(getenv('MONGO_DB') ?: 'travel_brain');
    $this->col = $db->selectCollection('destinations');
  }

  public function findAll(int $page = 1, int $size = 20, ?string $userId = null, ?string $search = null): array {
    $query = [];
    
    // Filtrar por usuario si se especifica
    if ($userId) {
      $query['userId'] = $userId;
    }
    
    // Búsqueda por nombre o país
    if ($search) {
      $query['$or'] = [
        ['name' => ['$regex' => $search, '$options' => 'i']],
        ['country' => ['$regex' => $search, '$options' => 'i']]
      ];
    }

    $opts = [
      'skip' => ($page - 1) * $size,
      'limit' => $size,
      'sort' => ['name' => 1]
    ];

    $cursor = $this->col->find($query, $opts);
    return array_map(function($d) {
      $arr = (array)$d;
      $arr['_id'] = (string)$arr['_id'];
      return $this->formatDates($arr);
    }, iterator_to_array($cursor));
  }

  public function findById(string $id): ?array {
    try {
      $doc = $this->col->findOne(['_id' => new ObjectId($id)]);
      if (!$doc) return null;
      
      $arr = (array)$doc;
      $arr['_id'] = (string)$arr['_id'];
      return $this->formatDates($arr);
    } catch (\Exception $e) {
      return null;
    }
  }

  /**
   * Busca un destino por nombre exacto (case-insensitive) y opcionalmente país
   */
  public function findByName(string $name, ?string $country = null): ?array {
    $query = [
      'name' => ['$regex' => '^' . preg_quote($name, '/') . '$', '$options' => 'i']
    ];
    
    if ($country) {
      $query['country'] = ['$regex' => '^' . preg_quote($country, '/') . '$', '$options' => 'i'];
    }
    
    $doc = $this->col->findOne($query);
    if (!$doc) return null;
    
    $arr = (array)$doc;
    $arr['_id'] = (string)$arr['_id'];
    return $this->formatDates($arr);
  }

  public function create(array $data): string {
    $payload = array_merge($data, [
      'createdAt' => new UTCDateTime(),
      'updatedAt' => new UTCDateTime()
    ]);
    
    $res = $this->col->insertOne($payload);
    return (string)$res->getInsertedId();
  }

  public function update(string $id, array $data): bool {
    unset($data['_id'], $data['createdAt']);
    $data['updatedAt'] = new UTCDateTime();
    
    try {
      $res = $this->col->updateOne(
        ['_id' => new ObjectId($id)],
        ['$set' => $data]
      );
      return $res->getModifiedCount() > 0;
    } catch (\Exception $e) {
      return false;
    }
  }

  public function delete(string $id): bool {
    try {
      $res = $this->col->deleteOne(['_id' => new ObjectId($id)]);
      return $res->getDeletedCount() > 0;
    } catch (\Exception $e) {
      return false;
    }
  }

  /**
   * Formatea fechas MongoDB a string legible
   */
  private function formatDates(array $doc): array {
    $dateFields = ['createdAt', 'updatedAt'];
    foreach ($dateFields as $field) {
      if (isset($doc[$field])) {
        $doc[$field] = $this->formatDate($doc[$field]);
      }
    }
    return $doc;
  }

  private function formatDate($date): string {
    if ($date === null) return '';
    
    if ($date instanceof UTCDateTime) {
      return $date->toDateTime()->format('Y-m-d H:i:s');
    }
    
    if (is_array($date) || is_object($date)) {
      $arr = (array)$date;
      if (isset($arr['$date'])) {
        $inner = (array)$arr['$date'];
        if (isset($inner['$numberLong'])) {
          $ts = (int)$inner['$numberLong'] / 1000;
          return date('Y-m-d H:i:s', (int)$ts);
        }
      }
    }
    
    return is_string($date) ? $date : '';
  }
}

