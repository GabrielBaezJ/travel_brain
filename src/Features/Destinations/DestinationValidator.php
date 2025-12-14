<?php
namespace App\Features\Destinations;

use App\Core\Constants\ValidationRules;

final class DestinationValidator {
  public function validateForCreate(array $data): void {
    $this->validateName($data['name'] ?? '');
    $this->validateCountry($data['country'] ?? '');
    $this->validateCoordinates($data);
    $this->validateImageUrl($data['img'] ?? null);
    $this->validateDescription($data['description'] ?? '');
  }

  public function validateForUpdate(array $data): void {
    if (isset($data['name'])) {
      $this->validateName($data['name']);
    }
    
    if (isset($data['country'])) {
      $this->validateCountry($data['country']);
    }

    $this->validateCoordinates($data);
    
    if (isset($data['img'])) {
      $this->validateImageUrl($data['img']);
    }

    if (isset($data['description'])) {
      $this->validateDescription($data['description']);
    }
  }

  private function validateName(string $name): void {
    if (empty($name) || strlen(trim($name)) < ValidationRules::NAME_MIN_LENGTH) {
      throw new \InvalidArgumentException(
        sprintf('Nombre debe tener al menos %d caracteres', ValidationRules::NAME_MIN_LENGTH)
      );
    }
  }

  private function validateCountry(string $country): void {
    if (empty($country) || strlen(trim($country)) < ValidationRules::NAME_MIN_LENGTH) {
      throw new \InvalidArgumentException(
        sprintf('País debe tener al menos %d caracteres', ValidationRules::NAME_MIN_LENGTH)
      );
    }
  }

  private function validateCoordinates(array $data): void {
    if (isset($data['lat']) && $data['lat'] !== null) {
      $this->validateLatitude((float)$data['lat']);
    }

    if (isset($data['lng']) && $data['lng'] !== null) {
      $this->validateLongitude((float)$data['lng']);
    }
  }

  private function validateLatitude(float $latitude): void {
    if ($latitude < ValidationRules::LATITUDE_MIN || $latitude > ValidationRules::LATITUDE_MAX) {
      throw new \InvalidArgumentException(
        sprintf(
          'Latitud debe estar entre %d y %d',
          ValidationRules::LATITUDE_MIN,
          ValidationRules::LATITUDE_MAX
        )
      );
    }
  }

  private function validateLongitude(float $longitude): void {
    if ($longitude < ValidationRules::LONGITUDE_MIN || $longitude > ValidationRules::LONGITUDE_MAX) {
      throw new \InvalidArgumentException(
        sprintf(
          'Longitud debe estar entre %d y %d',
          ValidationRules::LONGITUDE_MIN,
          ValidationRules::LONGITUDE_MAX
        )
      );
    }
  }

  private function validateImageUrl(?string $url): void {
    if ($url !== null && !empty($url) && !filter_var($url, FILTER_VALIDATE_URL)) {
      throw new \InvalidArgumentException('URL de imagen inválida');
    }
  }

  private function validateDescription(string $description): void {
    $trimmed = trim($description);
    if ($trimmed === '' || strlen($trimmed) < ValidationRules::NAME_MIN_LENGTH) {
      throw new \InvalidArgumentException(
        sprintf('Descripción debe tener al menos %d caracteres', ValidationRules::NAME_MIN_LENGTH)
      );
    }
    if (strlen($trimmed) > ValidationRules::MAX_DESCRIPTION_LENGTH) {
      throw new \InvalidArgumentException(
        sprintf('Descripción no puede exceder %d caracteres', ValidationRules::MAX_DESCRIPTION_LENGTH)
      );
    }
  }
}

