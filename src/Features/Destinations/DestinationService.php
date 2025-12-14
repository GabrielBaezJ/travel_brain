<?php
namespace App\Features\Destinations;

use App\Core\Contracts\DestinationRepositoryInterface;

final class DestinationService {
  private DestinationRepositoryInterface $repo;
  private DestinationValidator $validator;

  public function __construct(DestinationRepositoryInterface $repo) {
    $this->repo = $repo;
    $this->validator = new DestinationValidator();
  }

  public function list(
    int $page = \App\Core\Constants\ValidationRules::DEFAULT_PAGE,
    int $size = \App\Core\Constants\ValidationRules::DEFAULT_PAGE_SIZE,
    ?string $userId = null,
    ?string $search = null
  ): array {
    return $this->repo->findAll($page, $size, $userId, $search);
  }

  public function get(string $id): ?array {
    return $this->repo->findById($id);
  }

  public function create(array $input, ?string $userId = null): string {
    // Normalizar nombre/país desde entradas tipo "Ciudad, Provincia, País"
    $input = $this->normalizePlaceInput($input);
    $this->validator->validateForCreate($input);
    
    $name = trim($input['name']);
    $country = trim($input['country']);
    
    // DESTINOS COMPARTIDOS: Buscar si ya existe un destino con el mismo nombre y país
    $existing = $this->repo->findByName($name, $country);
    if ($existing) {
      // Retornar el ID del destino existente para que todos los usuarios compartan el mismo
      return $existing['_id'];
    }
    
    // Si no existe, crear uno nuevo (sin userId para que sea compartido)
    $data = [
      'name' => $name,
      'country' => $country,
      'description' => trim($input['description'] ?? ''),
      'lat' => isset($input['lat']) && $input['lat'] !== '' ? (float)$input['lat'] : null,
      'lng' => isset($input['lng']) && $input['lng'] !== '' ? (float)$input['lng'] : null,
      'img' => !empty($input['img']) ? trim($input['img']) : null,
      'userId' => null  // Destinos compartidos no tienen dueño
    ];

    return $this->repo->create((new Destination($data))->toArray());
  }

  public function update(string $id, array $input): bool {
    // Normalizar si viene name con formato compuesto y/o ajustar country
    $input = $this->normalizePlaceInput($input);
    $this->validator->validateForUpdate($input);
    
    $data = $this->extractUpdateData($input);
    return $this->repo->update($id, $data);
  }

  private function extractUpdateData(array $input): array {
    $data = [];
    
    if (isset($input['name'])) {
      $data['name'] = trim($input['name']);
    }
    
    if (isset($input['country'])) {
      $data['country'] = trim($input['country']);
    }
    
    if (isset($input['description'])) {
      $data['description'] = trim($input['description']);
    }
    
    if (isset($input['lat'])) {
      $data['lat'] = $input['lat'] !== '' ? (float)$input['lat'] : null;
    }
    
    if (isset($input['lng'])) {
      $data['lng'] = $input['lng'] !== '' ? (float)$input['lng'] : null;
    }
    
    if (isset($input['img'])) {
      $data['img'] = !empty($input['img']) ? trim($input['img']) : null;
    }
    // Si sólo vino 'name' con comas, intentar extraer country
    if (!isset($data['country']) && isset($data['name'])) {
      [$city, $country] = $this->splitCityCountry($data['name']);
      if ($country) {
        $data['name'] = $city;
        $data['country'] = $country;
      }
    }
    return $data;
  }

  /**
   * Acepta entradas donde 'name' pueda venir como "Ciudad, Provincia, País".
   * Reasigna $input['name'] a "Ciudad" y $input['country'] a "País" cuando aplique.
   */
  private function normalizePlaceInput(array $input): array {
    $name = isset($input['name']) ? trim((string)$input['name']) : '';
    $country = isset($input['country']) ? trim((string)$input['country']) : '';
    if ($name !== '') {
      [$city, $detectedCountry] = $this->splitCityCountry($name);
      if ($detectedCountry !== '') {
        $input['name'] = $city;
        if ($country === '' || strcasecmp($country, $detectedCountry) !== 0) {
          $input['country'] = $detectedCountry;
        }
      }
    }
    return $input;
  }

  /**
   * Devuelve [city, country] desde un string con comas. Si no detecta país, country=''.
   */
  private function splitCityCountry(string $text): array {
    $parts = array_values(array_filter(array_map('trim', explode(',', $text)), fn($s)=>$s!==''));
    if (count($parts) >= 2) {
      $city = $parts[0];
      $country = $parts[count($parts)-1];
      // Evitar duplicaciones tipo "Colombia, Huila, Colombia" -> city=Colombia? No; mantener city=first literal, country=last
      return [$city, $country];
    }
    return [$text, ''];
  }

  public function delete(string $id): bool {
    return $this->repo->delete($id);
  }
}

