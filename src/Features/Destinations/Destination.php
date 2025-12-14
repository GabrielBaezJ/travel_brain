<?php
namespace App\Features\Destinations;

final class Destination {
  public string $name;
  public string $country;
  public string $description;
  public ?float $lat;
  public ?float $lng;
  public ?string $img;
  public ?string $userId; // Para asociar destino al usuario que lo creó

  public function __construct(array $d) {
    $this->name = $d['name'];
    $this->country = $d['country'];
    $this->description = $d['description'] ?? '';
    $this->lat = isset($d['lat']) && $d['lat'] !== null ? (float)$d['lat'] : null;
    $this->lng = isset($d['lng']) && $d['lng'] !== null ? (float)$d['lng'] : null;
    $this->img = $d['img'] ?? null;
    $this->userId = $d['userId'] ?? null;
  }

  public function toArray(): array {
    return [
      'name' => $this->name,
      'country' => $this->country,
      'description' => $this->description,
      'lat' => $this->lat,
      'lng' => $this->lng,
      'img' => $this->img,
      'userId' => $this->userId
    ];
  }
}

