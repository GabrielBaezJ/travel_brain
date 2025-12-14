<?php
namespace App\Features\Routes;

use App\Core\Constants\ValidationRules;
use MongoDB\BSON\UTCDateTime;

final class FavoriteRouteService {
	public function __construct(private FavoriteRouteRepositoryMongo $repo) {}

	public function add(array $input, string $userId): string {
		$data = $this->validate($input, $userId);
		return $this->repo->insert($data);
	}

	public function remove(string $id, string $userId): bool {
		if (!preg_match('/^[0-9a-fA-F]{24}$/', $id)) {
			throw new \InvalidArgumentException('ID inválido');
		}
		return $this->repo->delete($id, $userId);
	}

	public function list(string $userId, int $page, int $size): array {
		$skip = ($page - 1) * $size;
		$docs = $this->repo->listByUser($userId, $skip, $size);
		$items = array_map(fn($d) => FavoriteRoute::fromDocument((array)$d)->toArray(), $docs);
		$total = $this->repo->countByUser($userId);
		return ['items' => $items, 'total' => $total];
	}

	private function validate(array $input, string $userId): array {
		$name = isset($input['name']) ? trim((string)$input['name']) : '';
		$origin = (array)($input['origin'] ?? []);
		$destination = (array)($input['destination'] ?? []);
		$distanceKm = isset($input['distanceKm']) ? (float)$input['distanceKm'] : 0.0;
		$durationSec = isset($input['durationSec']) ? (float)$input['durationSec'] : null;
		$mode = isset($input['mode']) ? trim((string)$input['mode']) : '';

		$olat = (float)($origin['lat'] ?? 0);
		$olon = (float)($origin['lon'] ?? 0);
		$dlat = (float)($destination['lat'] ?? 0);
		$dlon = (float)($destination['lon'] ?? 0);

		if ($olat < ValidationRules::LATITUDE_MIN || $olat > ValidationRules::LATITUDE_MAX) throw new \InvalidArgumentException('Latitud origen inválida');
		if ($olon < ValidationRules::LONGITUDE_MIN || $olon > ValidationRules::LONGITUDE_MAX) throw new \InvalidArgumentException('Longitud origen inválida');
		if ($dlat < ValidationRules::LATITUDE_MIN || $dlat > ValidationRules::LATITUDE_MAX) throw new \InvalidArgumentException('Latitud destino inválida');
		if ($dlon < ValidationRules::LONGITUDE_MIN || $dlon > ValidationRules::LONGITUDE_MAX) throw new \InvalidArgumentException('Longitud destino inválida');
		if ($distanceKm < 0) throw new \InvalidArgumentException('Distancia inválida');
		if ($durationSec !== null && $durationSec < 0) throw new \InvalidArgumentException('Duración inválida');

		$allowedModes = ['driving','walking','cycling','fallback',''];
		if (!in_array($mode, $allowedModes, true)) throw new \InvalidArgumentException('Modo de transporte inválido');

		return [
			'userId' => $userId,
			'name' => $name,
			'origin' => [
				'lat' => $olat, 'lon' => $olon, 'label' => (string)($origin['label'] ?? '')
			],
			'destination' => [
				'lat' => $dlat, 'lon' => $dlon, 'label' => (string)($destination['label'] ?? '')
			],
			'distanceKm' => $distanceKm,
			'durationSec' => $durationSec,
			'mode' => $mode ?: null,
			'createdAt' => new UTCDateTime(),
		];
	}
}

