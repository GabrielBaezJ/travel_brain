<?php
namespace App\Features\Itinerary;

use MongoDB\BSON\ObjectId;
use MongoDB\BSON\UTCDateTime;

final class Itinerary {
  public ?ObjectId $id;
  public ObjectId $userId;
  public ObjectId $tripId;
  public ?ObjectId $destinationId;
  public int $totalDays;
  public array $days; // Array de días con actividades
  public string $interests;
  public string $budgetStyle;
  public string $generatedBy; // 'gemini' o 'basic'
  public ?string $notes;
  public UTCDateTime $createdAt;
  public UTCDateTime $updatedAt;

  public function __construct(
    ObjectId $userId,
    ObjectId $tripId,
    int $totalDays,
    array $days,
    string $interests = 'cultura',
    string $budgetStyle = 'medio',
    string $generatedBy = 'basic',
    ?ObjectId $destinationId = null,
    ?string $notes = null,
    ?ObjectId $id = null,
    ?UTCDateTime $createdAt = null,
    ?UTCDateTime $updatedAt = null
  ) {
    $this->id = $id;
    $this->userId = $userId;
    $this->tripId = $tripId;
    $this->destinationId = $destinationId;
    $this->totalDays = $totalDays;
    $this->days = $days;
    $this->interests = $interests;
    $this->budgetStyle = $budgetStyle;
    $this->generatedBy = $generatedBy;
    $this->notes = $notes;
    $this->createdAt = $createdAt ?? new UTCDateTime();
    $this->updatedAt = $updatedAt ?? new UTCDateTime();
  }

  public function toArray(): array {
    // Usar timezone configurado (America/Guayaquil = UTC-5)
    $tz = new \DateTimeZone(date_default_timezone_get());
    
    return [
      '_id' => $this->id ? (string)$this->id : null,
      'userId' => (string)$this->userId,
      'tripId' => (string)$this->tripId,
      'destinationId' => $this->destinationId ? (string)$this->destinationId : null,
      'totalDays' => $this->totalDays,
      'days' => $this->days,
      'interests' => $this->interests,
      'budgetStyle' => $this->budgetStyle,
      'generatedBy' => $this->generatedBy,
      'notes' => $this->notes,
      'createdAt' => $this->createdAt->toDateTime()->setTimezone($tz)->format('Y-m-d H:i:s'),
      'updatedAt' => $this->updatedAt->toDateTime()->setTimezone($tz)->format('Y-m-d H:i:s'),
    ];
  }

  public static function fromDocument(array $doc): self {
    return new self(
      userId: $doc['userId'] instanceof ObjectId ? $doc['userId'] : new ObjectId($doc['userId']),
      tripId: $doc['tripId'] instanceof ObjectId ? $doc['tripId'] : new ObjectId($doc['tripId']),
      totalDays: $doc['totalDays'],
      days: $doc['days'] ?? [],
      interests: $doc['interests'] ?? 'cultura',
      budgetStyle: $doc['budgetStyle'] ?? 'medio',
      generatedBy: $doc['generatedBy'] ?? 'basic',
      destinationId: isset($doc['destinationId']) && $doc['destinationId'] ? 
        ($doc['destinationId'] instanceof ObjectId ? $doc['destinationId'] : new ObjectId($doc['destinationId'])) : null,
      notes: $doc['notes'] ?? null,
      id: $doc['_id'] ?? null,
      createdAt: $doc['createdAt'] ?? null,
      updatedAt: $doc['updatedAt'] ?? null
    );
  }
}
