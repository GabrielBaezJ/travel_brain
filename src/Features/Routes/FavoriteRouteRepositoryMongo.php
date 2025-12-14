<?php
namespace App\Features\Routes;

use App\Core\Database\MongoConnection;
use MongoDB\Collection;
use MongoDB\BSON\ObjectId;
use MongoDB\BSON\UTCDateTime;

final class FavoriteRouteRepositoryMongo {
	private Collection $collection;

	public function __construct(){
		$db = MongoConnection::client()->selectDatabase(getenv('MONGO_DB') ?: 'travel_brain');
		$this->collection = $db->selectCollection('favorite_routes');
	}

	public function insert(array $data): string {
		$res = $this->collection->insertOne($data);
		return (string)$res->getInsertedId();
	}

	public function delete(string $id, string $userId): bool {
		$res = $this->collection->deleteOne(['_id' => new ObjectId($id), 'userId' => $userId]);
		return $res->getDeletedCount() > 0;
	}

	public function listByUser(string $userId, int $skip, int $limit): array {
		$cursor = $this->collection->find(
			['userId' => $userId],
			['sort' => ['createdAt' => -1], 'skip' => $skip, 'limit' => $limit]
		);
		return array_map(fn($doc) => $this->formatDates((array)$doc), iterator_to_array($cursor));
	}

	public function countByUser(string $userId): int {
		return $this->collection->countDocuments(['userId' => $userId]);
	}

	/**
	 * Formatea fechas MongoDB a string legible
	 */
	private function formatDates(array $doc): array {
		$dateFields = ['createdAt', 'updatedAt'];
		
		// Convertir _id a string
		if (isset($doc['_id'])) {
			$doc['_id'] = (string)$doc['_id'];
		}
		
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

