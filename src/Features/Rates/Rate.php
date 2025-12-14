<?php
namespace App\Features\Rates;

use MongoDB\BSON\ObjectId;
use MongoDB\BSON\UTCDateTime;

final class Rate {
  public ?ObjectId $id;
  public string $userId;
  public string $destinationId;
  public int $rating;
  public bool $favorite;
  public ?string $comment;
  public UTCDateTime $createdAt;
  public UTCDateTime $updatedAt;

  public function __construct(
    string $userId,
    string $destinationId,
    int $rating,
    bool $favorite = false,
    ?string $comment = null,
    ?ObjectId $id = null,
    ?UTCDateTime $createdAt = null,
    ?UTCDateTime $updatedAt = null
  ) {
    $this->id = $id;
    $this->userId = $userId;
    $this->destinationId = $destinationId;
    $this->rating = $rating;
    $this->favorite = $favorite;
    $this->comment = $comment;
    $this->createdAt = $createdAt ?? new UTCDateTime();
    $this->updatedAt = $updatedAt ?? new UTCDateTime();
  }

  public function toArray(): array {
    return [
      '_id' => $this->id,
      'userId' => $this->userId,
      'destinationId' => $this->destinationId,
      'rating' => $this->rating,
      'favorite' => $this->favorite,
      'comment' => $this->comment,
      'createdAt' => $this->createdAt,
      'updatedAt' => $this->updatedAt
    ];
  }

  public static function fromDocument($doc): self {
    $arr = $doc instanceof \MongoDB\Model\BSONDocument ? $doc->getArrayCopy() : (array)$doc;
    
    return new self(
      userId: (string)$arr['userId'],
      destinationId: (string)$arr['destinationId'],
      rating: (int)$arr['rating'],
      favorite: (bool)($arr['favorite'] ?? false),
      comment: $arr['comment'] ?? null,
      id: $arr['_id'] ?? null,
      createdAt: $arr['createdAt'] ?? null,
      updatedAt: $arr['updatedAt'] ?? null
    );
  }
}
