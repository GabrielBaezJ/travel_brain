<?php
namespace App\Features\Weather;

final class WeatherService {
  public function __construct(private WeatherRepositoryMongo $repo) {}

  /**
   * Normaliza una etiqueta libre a "Ciudad, País" (sin provincia o estado).
   * Devuelve [city, country, label]
   */
  private function extractCityCountry(string $raw, string $countryCode = ''): array {
    $raw = trim($raw);
    $city = '';
    $country = '';
    if ($raw !== '') {
      $parts = array_map('trim', explode(',', $raw));
      if (count($parts) >= 2) {
        $city = $parts[0];
        // Tomar siempre el último segmento como país para evitar provincia/estado.
        $country = $parts[count($parts)-1];
      } else {
        $city = $raw;
      }
    }
    if ($country === '' && $countryCode !== '') { $country = $countryCode; }
    return [$city, $country];
  }

  /**
   * Consulta OpenWeather por lat/lon y opcionalmente registra la búsqueda.
   */
  public function getCurrent(float $lat, float $lon, string $label = '', bool $log = false, ?string $userId = null): Weather {
    // Normalizar etiqueta a "Ciudad, País" (sin provincia) para UI y registro

    $apiKey = getenv('OPENWEATHER_API_KEY') ?: '';
    if ($apiKey === '') {
      // Servicio externo no configurado
      [$city,$country] = $this->extractCityCountry($label);
      return new Weather([
        'location' => $city !== '' && $country !== '' ? ($city . ', ' . $country) : ($city ?: 'Ubicación'),
        'country' => $country,
        'lat' => $lat,
        'lon' => $lon,
        'temp' => null,
        'condition' => 'Servicio meteo no configurado',
        'humidity' => null,
        'windSpeed' => null,
        'pressure' => null,
        'precipitation' => 0,
      ]);
    }

    $url = sprintf(
      'https://api.openweathermap.org/data/2.5/weather?lat=%s&lon=%s&appid=%s&units=metric&lang=es',
      urlencode((string)$lat), urlencode((string)$lon), urlencode($apiKey)
    );

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 8);
    $raw = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if ($raw === false || $code >= 400) {
      [$city,$country] = $this->extractCityCountry($label);
      return new Weather([
        'location' => $city !== '' && $country !== '' ? ($city . ', ' . $country) : ($city ?: 'Ubicación'),
        'country' => $country,
        'lat' => $lat,
        'lon' => $lon,
        'temp' => null,
        'condition' => 'No se pudo obtener clima actual',
        'humidity' => null,
        'windSpeed' => null,
        'pressure' => null,
        'precipitation' => 0,
      ]);
    }
    $ow = json_decode($raw, true) ?: [];
  $countryCode = (string)($ow['sys']['country'] ?? '');
  [$city,$country] = $this->extractCityCountry($label, $countryCode);
    $display = $city !== '' && $country !== '' ? ($city . ', ' . $country) : ($city ?: 'Ubicación');
    $weather = Weather::fromOpenWeather($ow, $display, $lat, $lon);

    if ($log && $userId) {
      try {
        // Guardar ciudad y país + métricas (sin label explícito)
        $this->repo->logWeather($userId, $weather, $city, $country);
      } catch (\Throwable $e) {
        error_log('No se pudo registrar weather_search: ' . $e->getMessage());
      }
    }

    return $weather;
  }

  /** @return array{items: array<int,array>, total:int} */
  public function history(string $userId, int $page, int $size): array {
    return $this->repo->history($userId, $page, $size);
  }
}
