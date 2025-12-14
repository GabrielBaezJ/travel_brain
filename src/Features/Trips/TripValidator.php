<?php
namespace App\Features\Trips;

use App\Core\Constants\ValidationRules;

final class TripValidator {
  
  /**
   * Normaliza los campos de entrada para aceptar camelCase o snake_case
   */
  public function normalize(array $data): array {
    // Mapeo de camelCase a snake_case
    $mapping = [
      'startDate' => 'start_date',
      'endDate' => 'end_date',
    ];
    
    foreach ($mapping as $camel => $snake) {
      if (isset($data[$camel]) && !isset($data[$snake])) {
        $data[$snake] = $data[$camel];
      }
    }
    
    return $data;
  }

  public function validateForCreate(array $data): void {
    $data = $this->normalize($data);
    $this->validateRequired($data);
    $this->validateTitle($data['title']);
    $this->validateDestination($data['destination']);
    $this->validateDates($data['start_date'], $data['end_date']);
    
    if (array_key_exists('budget', $data) && $data['budget'] !== null && $data['budget'] !== '') {
      $this->validateBudget($data['budget']);
    }
    
    if (isset($data['description'])) {
      $this->validateDescription($data['description']);
    }
  }

  public function validateForUpdate(array $data): void {
    $data = $this->normalize($data);
    
    if (isset($data['title'])) {
      $this->validateTitle($data['title']);
    }
    
    if (isset($data['destination'])) {
      $this->validateDestination($data['destination']);
    }
    
    if (isset($data['start_date']) || isset($data['end_date'])) {
      $startDate = $data['start_date'] ?? null;
      $endDate = $data['end_date'] ?? null;
      if ($startDate && $endDate) {
        $this->validateDates($startDate, $endDate);
      }
    }
    
    if (array_key_exists('budget', $data) && $data['budget'] !== null && $data['budget'] !== '') {
      $this->validateBudget($data['budget']);
    }
    
    if (isset($data['description'])) {
      $this->validateDescription($data['description']);
    }
  }

  private function validateRequired(array $data): void {
    $required = ['title', 'destination', 'start_date', 'end_date'];
    
    foreach ($required as $field) {
      if (!isset($data[$field]) || trim($data[$field]) === '') {
        throw new \InvalidArgumentException("El campo {$field} es requerido");
      }
    }
  }

  private function validateTitle(string $title): void {
    if (strlen($title) < ValidationRules::MIN_TITLE_LENGTH) {
      throw new \InvalidArgumentException('El título debe tener al menos ' . ValidationRules::MIN_TITLE_LENGTH . ' caracteres');
    }
    
    if (strlen($title) > ValidationRules::MAX_TITLE_LENGTH) {
      throw new \InvalidArgumentException('El título no puede exceder ' . ValidationRules::MAX_TITLE_LENGTH . ' caracteres');
    }
  }

  private function validateDestination(string $destination): void {
    if (strlen($destination) < ValidationRules::MIN_NAME_LENGTH) {
      throw new \InvalidArgumentException('El destino debe tener al menos ' . ValidationRules::MIN_NAME_LENGTH . ' caracteres');
    }
    
    if (strlen($destination) > ValidationRules::MAX_NAME_LENGTH) {
      throw new \InvalidArgumentException('El destino no puede exceder ' . ValidationRules::MAX_NAME_LENGTH . ' caracteres');
    }
  }

  private function validateDates(string $startDate, string $endDate): void {
    $start = \DateTime::createFromFormat('Y-m-d', $startDate);
    $end = \DateTime::createFromFormat('Y-m-d', $endDate);
    
    if (!$start || $start->format('Y-m-d') !== $startDate) {
      throw new \InvalidArgumentException('Fecha de inicio inválida');
    }
    
    if (!$end || $end->format('Y-m-d') !== $endDate) {
      throw new \InvalidArgumentException('Fecha de fin inválida');
    }
    
    if ($end < $start) {
      throw new \InvalidArgumentException('La fecha de fin debe ser posterior a la fecha de inicio');
    }
  }

  private function validateBudget($budget): void {
    if (!is_numeric($budget)) {
      throw new \InvalidArgumentException('El presupuesto debe ser un número válido');
    }
    
    if ((float)$budget < 0) {
      throw new \InvalidArgumentException('El presupuesto no puede ser negativo');
    }
  }

  private function validateDescription(string $description): void {
    if (strlen($description) > ValidationRules::MAX_DESCRIPTION_LENGTH) {
      throw new \InvalidArgumentException('La descripción no puede exceder ' . ValidationRules::MAX_DESCRIPTION_LENGTH . ' caracteres');
    }
  }
}
