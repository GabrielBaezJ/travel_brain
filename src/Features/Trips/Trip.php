<?php
namespace App\Features\Trips;

use MongoDB\BSON\ObjectId;
use MongoDB\BSON\UTCDateTime;

final class Trip {
  public ?ObjectId $id;
  public string $userId;
  public string $title;
  public string $destination;
  public UTCDateTime $startDate;
  public UTCDateTime $endDate;
  public ?float $budget;
  public ?string $description;
  public UTCDateTime $createdAt;
  public UTCDateTime $updatedAt;

  public function __construct(
    string $userId,
    string $title,
    string $destination,
    UTCDateTime $startDate,
    UTCDateTime $endDate,
    ?float $budget = null,
    ?string $description = null,
    ?ObjectId $id = null,
    ?UTCDateTime $createdAt = null,
    ?UTCDateTime $updatedAt = null
  ) {
    $this->id = $id;
    $this->userId = $userId;
    $this->title = $title;
    $this->destination = $destination;
    $this->startDate = $startDate;
    $this->endDate = $endDate;
    $this->budget = $budget;
    $this->description = $description;
    $this->createdAt = $createdAt ?? new UTCDateTime();
    $this->updatedAt = $updatedAt ?? new UTCDateTime();
  }

  public function toArray(): array {
    // Usar timezone configurado (America/Guayaquil = UTC-5)
    $tz = new \DateTimeZone(date_default_timezone_get());
    
    return [
      '_id' => $this->id ? (string)$this->id : null,
      'userId' => $this->userId,
      'title' => $this->title,
      'destination' => $this->destination,
      'startDate' => $this->startDate->toDateTime()->setTimezone($tz)->format('Y-m-d'),
      'endDate' => $this->endDate->toDateTime()->setTimezone($tz)->format('Y-m-d'),
      'budget' => $this->budget,
      'description' => $this->description,
      'createdAt' => $this->createdAt->toDateTime()->setTimezone($tz)->format('Y-m-d H:i:s'),
      'updatedAt' => $this->updatedAt->toDateTime()->setTimezone($tz)->format('Y-m-d H:i:s'),
    ];
  }

  public static function fromDocument(array $doc): self {
    return new self(
      userId: (string)$doc['userId'],
      title: $doc['title'],
      destination: $doc['destination'],
      startDate: $doc['startDate'],
      endDate: $doc['endDate'],
      budget: $doc['budget'] ?? null,
      description: $doc['description'] ?? null,
      id: $doc['_id'] ?? null,
      createdAt: $doc['createdAt'] ?? null,
      updatedAt: $doc['updatedAt'] ?? null
    );
  }
}
