<?php
namespace App\Features\Itinerary;

class ItineraryValidator {
  public static function validateCreate(array $data): array {
    $errors = [];

    if (empty($data['tripId'])) {
      $errors[] = 'Trip ID is required';
    }

    if (!isset($data['totalDays']) || !is_numeric($data['totalDays']) || $data['totalDays'] < 1) {
      $errors[] = 'Total days must be a positive number';
    }

    if (isset($data['days']) && !is_array($data['days'])) {
      $errors[] = 'Days must be an array';
    }

    if (isset($data['interests']) && !in_array($data['interests'], ['cultura', 'aventura', 'relax', 'gastronomia', 'compras', 'naturaleza'])) {
      $errors[] = 'Invalid interests value';
    }

    if (isset($data['budgetStyle']) && !in_array($data['budgetStyle'], ['economico', 'medio', 'premium'])) {
      $errors[] = 'Invalid budget style value';
    }

    if (isset($data['generatedBy']) && !in_array($data['generatedBy'], ['gemini', 'basic'])) {
      $errors[] = 'Invalid generatedBy value';
    }

    if (isset($data['notes']) && strlen($data['notes']) > 1000) {
      $errors[] = 'Notes must not exceed 1000 characters';
    }

    return $errors;
  }

  public static function validateUpdate(array $data): array {
    $errors = [];

    if (isset($data['totalDays']) && (!is_numeric($data['totalDays']) || $data['totalDays'] < 1)) {
      $errors[] = 'Total days must be a positive number';
    }

    if (isset($data['days']) && !is_array($data['days'])) {
      $errors[] = 'Days must be an array';
    }

    if (isset($data['interests']) && !in_array($data['interests'], ['cultura', 'aventura', 'relax', 'gastronomia', 'compras', 'naturaleza'])) {
      $errors[] = 'Invalid interests value';
    }

    if (isset($data['budgetStyle']) && !in_array($data['budgetStyle'], ['economico', 'medio', 'premium'])) {
      $errors[] = 'Invalid budget style value';
    }

    if (isset($data['notes']) && strlen($data['notes']) > 1000) {
      $errors[] = 'Notes must not exceed 1000 characters';
    }

    return $errors;
  }

  public static function validateDayActivities(array $day): array {
    $errors = [];

    if (!isset($day['dayNumber']) || !is_numeric($day['dayNumber']) || $day['dayNumber'] < 1) {
      $errors[] = 'Day number must be a positive number';
    }

    if (isset($day['activities']) && !is_array($day['activities'])) {
      $errors[] = 'Activities must be an array';
    }

    return $errors;
  }
}
