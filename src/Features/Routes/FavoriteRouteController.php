<?php
namespace App\Features\Routes;

use App\Core\Auth\AuthMiddleware;
use App\Core\Http\Request;
use App\Core\Http\Response;
use App\Core\Constants\ValidationRules;

final class FavoriteRouteController {
	private FavoriteRouteService $service;

	public function __construct(){
		$this->service = new FavoriteRouteService(new FavoriteRouteRepositoryMongo());
	}

	// POST /api/routes/favorites
	public function store(): void {
		try {
			$userId = AuthMiddleware::getUserId();
			if (!$userId) { Response::error('No autenticado', 401); return; }
			$body = Request::body();
			$id = $this->service->add($body, $userId);
			Response::json(['ok' => true, 'id' => $id], 201);
		} catch (\InvalidArgumentException $e) {
			Response::error($e->getMessage(), 400);
		} catch (\Throwable $e) {
			error_log('FavRoute store error: '.$e->getMessage());
			Response::error('Error al guardar ruta favorita', 500);
		}
	}

	// GET /api/routes/favorites/{page}/{size}
	public function index(string $page = '1', string $size = '10'): void {
		try {
			$userId = AuthMiddleware::getUserId();
			if (!$userId) { Response::error('No autenticado', 401); return; }
			$page = max(ValidationRules::DEFAULT_PAGE, (int)$page);
			$size = max(1, min(ValidationRules::MAX_PAGE_SIZE, (int)$size));
			$res = $this->service->list($userId, $page, $size);
			Response::json(['ok' => true, 'items' => $res['items'], 'page' => $page, 'size' => $size, 'total' => $res['total']]);
		} catch (\Throwable $e) {
			error_log('FavRoute index error: '.$e->getMessage());
			Response::error('Error al listar rutas favoritas', 500);
		}
	}

	// DELETE /api/routes/favorites/{id}
	public function destroy(string $id): void {
		try {
			$userId = AuthMiddleware::getUserId();
			if (!$userId) { Response::error('No autenticado', 401); return; }
			$ok = $this->service->remove($id, $userId);
			if (!$ok) { Response::error('Ruta favorita no encontrada', 404); return; }
			Response::json(['ok' => true]);
		} catch (\InvalidArgumentException $e) {
			Response::error($e->getMessage(), 400);
		} catch (\Throwable $e) {
			error_log('FavRoute destroy error: '.$e->getMessage());
			Response::error('Error al eliminar ruta favorita', 500);
		}
	}
}

