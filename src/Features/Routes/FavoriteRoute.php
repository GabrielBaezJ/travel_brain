<?php
namespace App\Features\Routes;

use MongoDB\BSON\UTCDateTime;

final class FavoriteRoute {
	public string $_id = '';
	public string $userId = '';
	public string $name = '';
	public array $origin = [];
	public array $destination = [];
	public float $distanceKm = 0.0;
	public ?float $durationSec = null;
	public ?string $mode = null;
	public ?\DateTimeImmutable $createdAt = null;

	public static function fromDocument(array $doc): self {
		$i = new self();
		$i->_id = isset($doc['_id']) ? (string)$doc['_id'] : '';
		$i->userId = (string)($doc['userId'] ?? '');
		$i->name = (string)($doc['name'] ?? '');
		$i->origin = [
			'lat' => isset($doc['origin']['lat']) ? (float)$doc['origin']['lat'] : 0.0,
			'lon' => isset($doc['origin']['lon']) ? (float)$doc['origin']['lon'] : 0.0,
			'label' => (string)($doc['origin']['label'] ?? '')
		];
		$i->destination = [
			'lat' => isset($doc['destination']['lat']) ? (float)$doc['destination']['lat'] : 0.0,
			'lon' => isset($doc['destination']['lon']) ? (float)$doc['destination']['lon'] : 0.0,
			'label' => (string)($doc['destination']['label'] ?? '')
		];
		$i->distanceKm = isset($doc['distanceKm']) ? (float)$doc['distanceKm'] : 0.0;
		$i->durationSec = isset($doc['durationSec']) ? (float)$doc['durationSec'] : null;
		$i->mode = isset($doc['mode']) ? (string)$doc['mode'] : null;
		$i->createdAt = isset($doc['createdAt']) && $doc['createdAt'] instanceof UTCDateTime
			? \DateTimeImmutable::createFromFormat('U', (string)($doc['createdAt']->toDateTime()->getTimestamp()))
			: null;
		return $i;
	}

	public function toArray(): array {
		return [
			'_id' => $this->_id,
			'userId' => $this->userId,
			'name' => $this->name,
			'origin' => [
				'lat' => $this->origin['lat'] ?? 0.0,
				'lon' => $this->origin['lon'] ?? 0.0,
				'label' => $this->origin['label'] ?? ''
			],
			'destination' => [
				'lat' => $this->destination['lat'] ?? 0.0,
				'lon' => $this->destination['lon'] ?? 0.0,
				'label' => $this->destination['label'] ?? ''
			],
			'distanceKm' => $this->distanceKm,
			'durationSec' => $this->durationSec,
			'mode' => $this->mode,
			'createdAt' => $this->createdAt ? $this->createdAt->format(DATE_ATOM) : null,
		];
	}
}

