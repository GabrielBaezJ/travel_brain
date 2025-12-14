<?php
namespace App\Core\Constants;

final class UserRoles {
  public const REGISTERED = 'REGISTERED';
  public const ADMIN = 'ADMIN';

  public static function isValid(string $role): bool {
    return in_array($role, [self::REGISTERED, self::ADMIN], true);
  }
}

