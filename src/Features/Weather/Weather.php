<?php
namespace App\Features\Weather;

use MongoDB\BSON\UTCDateTime;

final class Weather {
  public string $location;
  public string $country;
  public float $lat;
  public float $lon;
  public ?int $temp;          // °C
  public string $condition;   // descripción
  public ?int $humidity;      // %
  public ?float $windSpeed;   // km/h
  public ?int $pressure;      // hPa
  public int $precipitation;  // % aprox
  public UTCDateTime $createdAt;

  public function __construct(array $d){
    $this->location = (string)($d['location'] ?? '');
    $this->country = (string)($d['country'] ?? '');
    $this->lat = (float)($d['lat'] ?? 0);
    $this->lon = (float)($d['lon'] ?? 0);
    $this->temp = isset($d['temp']) ? (int)$d['temp'] : null;
    $this->condition = (string)($d['condition'] ?? '');
    $this->humidity = isset($d['humidity']) ? (int)$d['humidity'] : null;
    $this->windSpeed = isset($d['windSpeed']) ? (float)$d['windSpeed'] : null;
    $this->pressure = isset($d['pressure']) ? (int)$d['pressure'] : null;
    $this->precipitation = isset($d['precipitation']) ? (int)$d['precipitation'] : 0;
    $this->createdAt = (isset($d['createdAt']) && $d['createdAt'] instanceof UTCDateTime)
      ? $d['createdAt']
      : new UTCDateTime();
  }

  public function toArray(): array {
    return [
      'ok' => true,
      'location' => $this->location,
      'country' => $this->country,
      'lat' => $this->lat,
      'lon' => $this->lon,
      'temp' => $this->temp,
      'condition' => $this->condition,
      'humidity' => $this->humidity,
      'windSpeed' => $this->windSpeed,
      'pressure' => $this->pressure,
      'precipitation' => $this->precipitation,
      'createdAt' => $this->createdAt->toDateTime()->format(DATE_ATOM),
    ];
  }

  /** Construye el modelo a partir de la respuesta de OpenWeather */
  public static function fromOpenWeather(array $ow, string $fallbackLabel, float $lat, float $lon): self {
    $main = $ow['main'] ?? [];
    $wind = $ow['wind'] ?? [];
    $weatherArr = $ow['weather'] ?? [];
    $rain = $ow['rain'] ?? [];
    $snow = $ow['snow'] ?? [];
    $cond = is_array($weatherArr) && count($weatherArr) ? ($weatherArr[0]['description'] ?? 'Condición desconocida') : 'Condición desconocida';
    $precip = 0.0;
    if (isset($rain['1h'])) { $precip = (float)$rain['1h'] * 100; }
    elseif (isset($rain['3h'])) { $precip = (float)$rain['3h'] * 33.3; }
    elseif (isset($snow['1h'])) { $precip = (float)$snow['1h'] * 100; }
    elseif (isset($snow['3h'])) { $precip = (float)$snow['3h'] * 33.3; }

    return new self([
      'location' => $fallbackLabel !== '' ? $fallbackLabel : (string)($ow['name'] ?? ''),
      'country' => (string)($ow['sys']['country'] ?? ''),
      'lat' => $lat,
      'lon' => $lon,
      'temp' => isset($main['temp']) ? (int)round((float)$main['temp']) : null,
      'condition' => $cond,
      'humidity' => isset($main['humidity']) ? (int)$main['humidity'] : null,
      'windSpeed' => isset($wind['speed']) ? (float)round(((float)$wind['speed']) * 3.6, 1) : null,
      'pressure' => isset($main['pressure']) ? (int)$main['pressure'] : null,
      'precipitation' => (int)round($precip)
    ]);
  }
}
