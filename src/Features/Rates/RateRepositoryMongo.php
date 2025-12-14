<?php
namespace App\Features\Rates;

use App\Core\Database\MongoConnection;
use MongoDB\BSON\ObjectId;
use MongoDB\BSON\UTCDateTime;

final class RateRepositoryMongo {
  private $collection;

  public function __construct() {
    $db = MongoConnection::client()->selectDatabase(getenv('MONGO_DB') ?: 'travel_brain');
    $this->collection = $db->selectCollection('rates');
  }

  /**
   * Formatea un documento para respuesta JSON (convierte fechas)
   */
  private function formatForResponse(array $arr): array {
    // Formatear createdAt
    if (isset($arr['createdAt'])) {
      $arr['createdAt'] = $this->formatDate($arr['createdAt']);
    }
    // Formatear updatedAt
    if (isset($arr['updatedAt'])) {
      $arr['updatedAt'] = $this->formatDate($arr['updatedAt']);
    }
    return $arr;
  }

  /**
   * Convierte UTCDateTime o fecha MongoDB a string legible (usando timezone configurado)
   */
  private function formatDate($date): string {
    // Timezone configurado (America/Guayaquil = UTC-5)
    $tz = new \DateTimeZone(date_default_timezone_get());
    
    if ($date instanceof UTCDateTime) {
      return $date->toDateTime()->setTimezone($tz)->format('Y-m-d H:i:s');
    }
    if (is_object($date) && method_exists($date, 'toDateTime')) {
      return $date->toDateTime()->setTimezone($tz)->format('Y-m-d H:i:s');
    }
    if (is_array($date) && isset($date['$date'])) {
      if (isset($date['$date']['$numberLong'])) {
        $timestamp = (int)$date['$date']['$numberLong'] / 1000;
        // date() ya usa el timezone por defecto de PHP
        return date('Y-m-d H:i:s', $timestamp);
      }
    }
    return (string)$date;
  }

  /**
   * Encuentra todas las calificaciones con paginación
   */
  public function findAll(int $page = 1, int $size = 20, ?string $userId = null, ?string $destinationId = null): array {
    $query = [];
    
    if ($userId) {
      $query['userId'] = $userId;
    }
    
    if ($destinationId) {
      $query['destinationId'] = $destinationId;
    }
    
    $skip = ($page - 1) * $size;
    
    $cursor = $this->collection->find($query, [
      'skip' => $skip,
      'limit' => $size,
      'sort' => ['createdAt' => -1]
    ]);
    
    $items = [];
    foreach ($cursor as $doc) {
      $rate = Rate::fromDocument($doc);
      $arr = $rate->toArray();
      $arr['_id'] = (string)$arr['_id'];
      $items[] = $this->formatForResponse($arr);
    }
    
    return $items;
  }

  /**
   * Encuentra una calificación por ID
   */
  public function findById(string $id): ?array {
    try {
      $doc = $this->collection->findOne(['_id' => new ObjectId($id)]);
      if (!$doc) {
        return null;
      }
      
      $rate = Rate::fromDocument($doc);
      $arr = $rate->toArray();
      $arr['_id'] = (string)$arr['_id'];
      return $this->formatForResponse($arr);
    } catch (\Exception $e) {
      return null;
    }
  }

  /**
   * Encuentra calificación por usuario y destino
   */
  public function findByUserAndDestination(string $userId, string $destinationId): ?array {
    $doc = $this->collection->findOne([
      'userId' => $userId,
      'destinationId' => $destinationId
    ]);
    
    if (!$doc) {
      return null;
    }
    
    $rate = Rate::fromDocument($doc);
    $arr = $rate->toArray();
    $arr['_id'] = (string)$arr['_id'];
    return $this->formatForResponse($arr);
  }

  /**
   * Crea una nueva calificación
   */
  public function create(array $data): string {
    $now = new UTCDateTime();
    $data['createdAt'] = $now;
    $data['updatedAt'] = $now;
    
    $result = $this->collection->insertOne($data);
    return (string)$result->getInsertedId();
  }

  /**
   * Actualiza una calificación existente
   */
  public function update(string $id, array $data): bool {
    try {
      $data['updatedAt'] = new UTCDateTime();
      
      $result = $this->collection->updateOne(
        ['_id' => new ObjectId($id)],
        ['$set' => $data]
      );
      
      return $result->getModifiedCount() > 0;
    } catch (\Exception $e) {
      return false;
    }
  }

  /**
   * Elimina una calificación
   */
  public function delete(string $id): bool {
    try {
      $result = $this->collection->deleteOne(['_id' => new ObjectId($id)]);
      return $result->getDeletedCount() > 0;
    } catch (\Exception $e) {
      return false;
    }
  }

  /**
   * Calcula el promedio de calificaciones para un destino
   */
  public function getAverageRating(string $destinationId): array {
    $pipeline = [
      ['$match' => ['destinationId' => $destinationId]],
      ['$group' => [
        '_id' => '$destinationId',
        'avgRating' => ['$avg' => '$rating'],
        'totalRatings' => ['$sum' => 1],
        'totalFavorites' => ['$sum' => ['$cond' => [['$eq' => ['$favorite', true]], 1, 0]]]
      ]]
    ];
    
    $result = $this->collection->aggregate($pipeline)->toArray();
    
    if (empty($result)) {
      return [
        'avgRating' => 0, 
        'totalRatings' => 0, 
        'totalFavorites' => 0,
        'distribution' => ['1' => 0, '2' => 0, '3' => 0, '4' => 0, '5' => 0]
      ];
    }
    
    // Obtener distribución de ratings
    $distribution = $this->getRatingDistribution($destinationId);
    
    return [
      'avgRating' => round($result[0]['avgRating'], 1),
      'totalRatings' => $result[0]['totalRatings'],
      'totalFavorites' => $result[0]['totalFavorites'],
      'distribution' => $distribution
    ];
  }

  /**
   * Obtiene la distribución de calificaciones (1-5 estrellas)
   */
  public function getRatingDistribution(string $destinationId): array {
    $pipeline = [
      ['$match' => ['destinationId' => $destinationId]],
      ['$group' => [
        '_id' => '$rating',
        'count' => ['$sum' => 1]
      ]]
    ];
    
    $result = $this->collection->aggregate($pipeline)->toArray();
    
    // Inicializar distribución con 0s
    $distribution = ['1' => 0, '2' => 0, '3' => 0, '4' => 0, '5' => 0];
    
    foreach ($result as $item) {
      $rating = (string)$item['_id'];
      if (isset($distribution[$rating])) {
        $distribution[$rating] = $item['count'];
      }
    }
    
    return $distribution;
  }

  /**
   * Cuenta el total de calificaciones
   */
  public function count(?string $userId = null, ?string $destinationId = null): int {
    $query = [];
    
    if ($userId) {
      $query['userId'] = $userId;
    }
    
    if ($destinationId) {
      $query['destinationId'] = $destinationId;
    }
    
    return $this->collection->countDocuments($query);
  }

  /**
   * Obtiene destinos favoritos del usuario
   */
  public function getFavoritesByUser(string $userId): array {
    $cursor = $this->collection->find(
      ['userId' => $userId, 'favorite' => true],
      ['sort' => ['updatedAt' => -1]]
    );
    
    $items = [];
    foreach ($cursor as $doc) {
      $rate = Rate::fromDocument($doc);
      $arr = $rate->toArray();
      $arr['_id'] = (string)$arr['_id'];
      $items[] = $this->formatForResponse($arr);
    }
    
    return $items;
  }
}
