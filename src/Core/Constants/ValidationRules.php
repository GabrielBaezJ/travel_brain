<?php
namespace App\Core\Constants;

final class ValidationRules {
  // Username
  public const USERNAME_MIN_LENGTH = 3;
  public const USERNAME_MAX_LENGTH = 20;
  public const USERNAME_PATTERN = '/^[A-Za-z0-9._-]+$/';

  // Password
  public const PASSWORD_MIN_LENGTH = 6;

  // Name
  public const NAME_MIN_LENGTH = 2;

  // Coordinates
  public const LATITUDE_MIN = -90;
  public const LATITUDE_MAX = 90;
  public const LONGITUDE_MIN = -180;
  public const LONGITUDE_MAX = 180;

  // Pagination
  public const DEFAULT_PAGE_SIZE = 20;
  public const MAX_PAGE_SIZE = 100;
  public const DEFAULT_PAGE = 1;

  // Trips: texto y límites
  public const MIN_TITLE_LENGTH = 3;
  public const MAX_TITLE_LENGTH = 120;
  public const MIN_NAME_LENGTH = 2;
  public const MAX_NAME_LENGTH = 120;
  public const MAX_DESCRIPTION_LENGTH = 1000;
}

