<?php
namespace App\Features\Users;

use App\Core\Http\Response;
use App\Core\Http\Request;
use App\Core\Auth\AuthMiddleware;

final class UserController {
  private UserService $service;

  public function __construct() {
    $repository = new UserRepositoryMongo();
    $this->service = new UserService($repository);
  }

  public function index(): void {
    // Solo administradores pueden listar usuarios
    AuthMiddleware::startSession();
    if (!AuthMiddleware::ensureAdmin()) {
      Response::error('Acceso denegado. Se requieren permisos de administrador', 403);
      return;
    }
    
    $users = $this->service->list();
    Response::json($users);
  }

  public function show(string $id): void {
    // Usuarios autenticados pueden ver su propio perfil o admins pueden ver cualquiera
    AuthMiddleware::startSession();
    if (!AuthMiddleware::isAuthenticated()) {
      Response::error('No autenticado', 401);
      return;
    }
    
    $currentUserId = AuthMiddleware::getUserId();
    $isAdmin = AuthMiddleware::isAdmin();
    
    // Solo puede ver su propio perfil o ser admin
    if ($currentUserId !== $id && !$isAdmin) {
      Response::error('Acceso denegado', 403);
      return;
    }
    
    $user = $this->service->get($id);
    
    if (!$user) {
      Response::error('Usuario no encontrado', 404);
      return;
    }

    Response::json($user);
  }

  public function store(): void {
    // Solo administradores pueden crear usuarios directamente
    AuthMiddleware::startSession();
    if (!AuthMiddleware::ensureAdmin()) {
      Response::error('Acceso denegado. Use /api/auth/register para registro público', 403);
      return;
    }
    
    try {
      $body = Request::body();
      $sessionId = $_COOKIE['sid'] ?? null;
      
      $userId = $this->service->create($body, $sessionId);
      Response::json(['id' => $userId], 201);
    } catch (\Throwable $exception) {
      Response::error($exception->getMessage(), 400);
    }
  }

  public function update(string $id, bool $asAdmin = false): void {
    AuthMiddleware::startSession();
    if (!AuthMiddleware::isAuthenticated()) {
      Response::error('No autenticado', 401);
      return;
    }
    
    $currentUserId = AuthMiddleware::getUserId();
    $isAdmin = AuthMiddleware::isAdmin();
    
    // Solo puede actualizar su propio perfil o ser admin
    if ($currentUserId !== $id && !$isAdmin) {
      Response::error('Acceso denegado', 403);
      return;
    }
    
    try {
      $body = Request::body();
      $success = $this->service->update($id, $body, $isAdmin);
      
      Response::json(['updated' => $success]);
    } catch (\Throwable $exception) {
      Response::error($exception->getMessage(), 400);
    }
  }

  public function destroy(string $id): void {
    // Solo administradores pueden eliminar usuarios
    AuthMiddleware::startSession();
    if (!AuthMiddleware::ensureAdmin()) {
      Response::error('Acceso denegado. Se requieren permisos de administrador', 403);
      return;
    }
    
    $deleted = $this->service->delete($id);
    Response::json(['deleted' => $deleted]);
  }
}
