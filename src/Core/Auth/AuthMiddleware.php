<?php
namespace App\Core\Auth;

use App\Core\Http\Response;

final class AuthMiddleware {
  public static function ensureAuthenticated(): void {
    if (!self::isAuthenticated()) {
      Response::error('No autenticado', 401);
      exit;
    }
  }

  public static function ensureAdmin(): void {
    self::ensureAuthenticated();
    
    if (!self::isAdmin()) {
      Response::error('Acceso denegado. Se requiere rol ADMIN', 403);
      exit;
    }
  }

  public static function isAuthenticated(): bool {
    if (session_status() !== PHP_SESSION_ACTIVE) {
      session_start();
    }
    return !empty($_SESSION['uid']);
  }

  public static function getUserId(): ?string {
    if (!self::isAuthenticated()) {
      return null;
    }
    return $_SESSION['uid'];
  }

  public static function isAdmin(): bool {
    if (!self::isAuthenticated()) {
      return false;
    }

    try {
      $mongoClient = new \MongoDB\Client(getenv('MONGO_URI') ?: 'mongodb://localhost:27017');
      $mongoDb = $mongoClient->selectDatabase(getenv('MONGO_DB') ?: 'travel_brain');
      $usersCol = $mongoDb->selectCollection('users');
      
      $user = $usersCol->findOne(
        ['_id' => new \MongoDB\BSON\ObjectId($_SESSION['uid'])],
        ['projection' => ['role' => 1]]
      );

      if (!$user || !isset($user['role'])) {
        return false;
      }

      return strtoupper((string)$user['role']) === 'ADMIN';
    } catch (\Exception $e) {
      error_log('Error verificando rol admin: ' . $e->getMessage());
      return false;
    }
  }

  public static function startSession(): void {
    if (session_status() !== PHP_SESSION_ACTIVE) {
      $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
      session_set_cookie_params([
        'httponly' => true,
        'secure' => $isHttps,
        'samesite' => 'Lax'
      ]);
      session_start();
    }
  }

  public static function setUserId(string $userId): void {
    self::startSession();
    $_SESSION['uid'] = $userId;
  }

  public static function destroySession(): void {
    if (session_status() === PHP_SESSION_ACTIVE) {
      $_SESSION = [];
      if (session_id()) {
        session_destroy();
      }
    }
  }
}

