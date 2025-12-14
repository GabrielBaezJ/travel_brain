<?php
namespace App\Core\Constants;

final class UserStatus {
  public const ACTIVE = 'ACTIVE';
  public const DEACTIVATED = 'DEACTIVATED';

  public static function isValid(string $status): bool {
    return in_array($status, [self::ACTIVE, self::DEACTIVATED], true);
  }
}

