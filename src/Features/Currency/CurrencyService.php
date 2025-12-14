<?php
namespace App\Features\Currency;

final class CurrencyService {
  private const BASE_CURRENCY = 'USD';

  private const DEFAULTS = [
    'from' => 'USD',
    'to'   => 'EUR',
  ];

  /**
   * Metadata for the currencies supported by the application. Rates are
   * provided exclusively by the online Frankfurter API at runtime.
   */
  private const CURRENCIES = [
    'USD' => ['name' => 'Dólar estadounidense', 'symbol' => '$'],
    'EUR' => ['name' => 'Euro', 'symbol' => '€'],
    'GBP' => ['name' => 'Libra esterlina', 'symbol' => '£'],
    'JPY' => ['name' => 'Yen japonés', 'symbol' => '¥'],
    'CAD' => ['name' => 'Dólar canadiense', 'symbol' => 'C$'],
    'AUD' => ['name' => 'Dólar australiano', 'symbol' => 'A$'],
    'BRL' => ['name' => 'Real brasileño', 'symbol' => 'R$'],
    'CLP' => ['name' => 'Peso chileno', 'symbol' => '$'],
    'COP' => ['name' => 'Peso colombiano', 'symbol' => '$'],
    'MXN' => ['name' => 'Peso mexicano', 'symbol' => '$'],
    'ARS' => ['name' => 'Peso argentino', 'symbol' => '$'],
    'PEN' => ['name' => 'Sol peruano', 'symbol' => 'S/'],
  ];

  private string $apiBaseUrl;

  public function __construct(?string $apiBaseUrl = null) {
    $baseUrl = $apiBaseUrl ?? getenv('CURRENCY_API_BASE_URL') ?: 'https://api.frankfurter.app';
    $this->apiBaseUrl = rtrim($baseUrl, '/');
  }

  /**
   * Fallback estático de tasas (coincide con el modo offline del frontend).
   * @return array{base: array{code:string,name:string,symbol:?string}, updatedAt:string, defaults: array{from:string,to:string}, currencies: array<int, array{code:string,name:string,symbol:?string,rate:float}>, count:int, source:string, fallback:bool}
   */
  public function getOfflineRates(): array {
    $offline = [
      'updatedAt' => '2024-01-15T00:00:00Z',
      'base' => ['code' => 'USD', 'name' => 'Dólar estadounidense', 'symbol' => '$'],
      'currencies' => [
        ['code' => 'USD', 'name' => 'Dólar estadounidense', 'symbol' => '$',  'rate' => 1.0],
        ['code' => 'EUR', 'name' => 'Euro',                 'symbol' => '€',  'rate' => 0.92],
        ['code' => 'GBP', 'name' => 'Libra esterlina',       'symbol' => '£',  'rate' => 0.79],
        ['code' => 'JPY', 'name' => 'Yen japonés',           'symbol' => '¥',  'rate' => 146.5],
        ['code' => 'CAD', 'name' => 'Dólar canadiense',      'symbol' => 'C$', 'rate' => 1.34],
        ['code' => 'AUD', 'name' => 'Dólar australiano',     'symbol' => 'A$', 'rate' => 1.52],
        ['code' => 'BRL', 'name' => 'Real brasileño',        'symbol' => 'R$', 'rate' => 4.95],
        ['code' => 'CLP', 'name' => 'Peso chileno',          'symbol' => '$',  'rate' => 890.0],
        ['code' => 'COP', 'name' => 'Peso colombiano',       'symbol' => '$',  'rate' => 3925.0],
        ['code' => 'MXN', 'name' => 'Peso mexicano',         'symbol' => '$',  'rate' => 17.1],
        ['code' => 'ARS', 'name' => 'Peso argentino',        'symbol' => '$',  'rate' => 830.0],
        ['code' => 'PEN', 'name' => 'Sol peruano',           'symbol' => 'S/', 'rate' => 3.7],
      ],
    ];

    // Ordenar por código para consistencia
    usort($offline['currencies'], static fn($a,$b)=>strcmp($a['code'],$b['code']));

    return [
      'base'       => $offline['base'],
      'updatedAt'  => $offline['updatedAt'],
      'defaults'   => self::DEFAULTS,
      'currencies' => $offline['currencies'],
      'count'      => count($offline['currencies']),
      'source'     => 'offline-fallback',
      'fallback'   => true,
    ];
  }

  public function getRates(): array {
    $symbols = array_keys(self::CURRENCIES);

    try {
      $data = $this->fetchLatestRates($symbols);
      $rates = $data['rates'] ?? [];
      $updatedAt = $this->formatTimestamp($data['date'] ?? null);
      $source = 'frankfurter.app';
    } catch (\Throwable $exception) {
      throw new \RuntimeException('El servicio de tasas en línea no está disponible actualmente.', 0, $exception);
    }

    $currencies = [];
    foreach (self::CURRENCIES as $code => $info) {
      $rate = $rates[$code] ?? null;
      if ($rate === null) {
        continue;
      }

      $currencies[] = [
        'code'   => $code,
        'name'   => $info['name'],
        'symbol' => $info['symbol'] ?? null,
        'rate'   => (float)$rate,
      ];
    }

    usort($currencies, static fn(array $a, array $b): int => strcmp($a['code'], $b['code']));

    $baseInfo = self::CURRENCIES[self::BASE_CURRENCY] ?? ['name' => 'Desconocida'];

    return [
      'base' => [
        'code'   => self::BASE_CURRENCY,
        'name'   => $baseInfo['name'],
        'symbol' => $baseInfo['symbol'] ?? null,
      ],
      'updatedAt'  => $updatedAt,
      'defaults'   => self::DEFAULTS,
      'currencies' => $currencies,
      'count'      => count($currencies),
      'source'     => $source,
    ];
  }

  public function convert(string $from, string $to, float $amount): array {
    $fromCode = strtoupper($from);
    $toCode   = strtoupper($to);

    if (!isset(self::CURRENCIES[$fromCode])) {
      throw new \InvalidArgumentException('Moneda de origen no soportada');
    }
    if (!isset(self::CURRENCIES[$toCode])) {
      throw new \InvalidArgumentException('Moneda de destino no soportada');
    }
    if (!is_finite($amount) || $amount < 0) {
      throw new \InvalidArgumentException('El monto debe ser mayor o igual a cero');
    }

    try {
      $data = $this->fetchLatestRates([$fromCode, $toCode]);
      $rates = $data['rates'] ?? [];
      $updatedAt = $this->formatTimestamp($data['date'] ?? null);
      $source = 'frankfurter.app';
    } catch (\Throwable $exception) {
      throw new \RuntimeException('El servicio de tasas en línea no está disponible actualmente.', 0, $exception);
    }

    $fromInfo = self::CURRENCIES[$fromCode];
    $toInfo   = self::CURRENCIES[$toCode];

    $fromRate = $rates[$fromCode] ?? null;
    $toRate   = $rates[$toCode]   ?? null;

    if ($fromRate === null) {
      throw new \RuntimeException('No se pudo obtener la tasa de cambio para la moneda de origen.');
    }
    if ($toRate === null) {
      throw new \RuntimeException('No se pudo obtener la tasa de cambio para la moneda de destino.');
    }

    // Convertir a USD (moneda base) y luego a destino
    $amountInUsd     = $fromRate > 0 ? $amount / $fromRate : 0.0;
    $convertedAmount = $amountInUsd * $toRate;
    $conversionRate  = $amount > 0 ? $convertedAmount / $amount
                                   : ($fromCode === $toCode ? 1.0 : $toRate / $fromRate);

    $baseInfo = self::CURRENCIES[self::BASE_CURRENCY];

    return [
      'from' => [
        'code'   => $fromCode,
        'name'   => $fromInfo['name'],
        'symbol' => $fromInfo['symbol'] ?? null,
        'amount' => round($amount, 2),
      ],
      'to' => [
        'code'   => $toCode,
        'name'   => $toInfo['name'],
        'symbol' => $toInfo['symbol'] ?? null,
        'amount' => round($convertedAmount, 2),
      ],
      'rate'         => round($conversionRate, 6),
      'base' => [
        'code'   => self::BASE_CURRENCY,
        'name'   => $baseInfo['name'],
        'symbol' => $baseInfo['symbol'] ?? null,
      ],
      'amountInBase' => round($amountInUsd, 2),
      'updatedAt'    => $updatedAt,
      'source'       => $source,
    ];
  }

  /**
   * Conversión usando las tasas del fallback offline, cuando el servicio online no responde.
   */
  public function convertOffline(string $from, string $to, float $amount): array {
    $fromCode = strtoupper($from);
    $toCode   = strtoupper($to);

    // Construir mapa de tasas desde el fallback
    $fallback = $this->getOfflineRates();
    $rates = [];
    foreach ($fallback['currencies'] as $c) {
      $rates[$c['code']] = (float)$c['rate'];
    }

    if (!isset($rates[$fromCode])) {
      throw new \RuntimeException('No se encontró tasa offline para la moneda de origen.');
    }
    if (!isset($rates[$toCode])) {
      throw new \RuntimeException('No se encontró tasa offline para la moneda de destino.');
    }

    $fromRate = $rates[$fromCode];
    $toRate   = $rates[$toCode];
    $amountInBase = $fromRate > 0 ? $amount / $fromRate : 0.0;
    $convertedAmount = $amountInBase * $toRate;
    $conversionRate  = $amount > 0 ? $convertedAmount / $amount
                                   : ($fromCode === $toCode ? 1.0 : $toRate / $fromRate);

    $fromInfo = self::CURRENCIES[$fromCode] ?? ['name'=>$fromCode];
    $toInfo   = self::CURRENCIES[$toCode]   ?? ['name'=>$toCode];
    $baseInfo = $fallback['base'];

    return [
      'from' => [
        'code'   => $fromCode,
        'name'   => $fromInfo['name'] ?? $fromCode,
        'symbol' => $fromInfo['symbol'] ?? null,
        'amount' => round($amount, 2),
      ],
      'to' => [
        'code'   => $toCode,
        'name'   => $toInfo['name'] ?? $toCode,
        'symbol' => $toInfo['symbol'] ?? null,
        'amount' => round($convertedAmount, 2),
      ],
      'rate'         => round($conversionRate, 6),
      'base' => [
        'code'   => $baseInfo['code'],
        'name'   => $baseInfo['name'],
        'symbol' => $baseInfo['symbol'] ?? null,
      ],
      'amountInBase' => round($amountInBase, 2),
      'updatedAt'    => $fallback['updatedAt'],
      'source'       => 'offline-fallback',
      'fallback'     => true,
    ];
  }

  /**
   * @param array<int, string> $symbols
   * @return array<string, mixed>
   */
  private function fetchLatestRates(array $symbols): array {
    $uniqueSymbols = array_unique(array_filter(array_map('strtoupper', $symbols)));

    // Frankfurter: /latest?from=USD&to=EUR,GBP
    $query = ['from' => self::BASE_CURRENCY];

    if ($uniqueSymbols !== []) {
      $symbolsWithoutBase = array_filter(
        $uniqueSymbols,
        static fn(string $code): bool => $code !== self::BASE_CURRENCY
      );

      if ($symbolsWithoutBase !== []) {
        $query['to'] = implode(',', $symbolsWithoutBase);
      }
    }

    $response = $this->request('latest', $query);

    if (!is_array($response)) {
      throw new \RuntimeException('Respuesta inválida del servicio de tasas de cambio.');
    }

    if (isset($response['error'])) {
      $message = is_array($response['error'])
        ? ($response['error']['message'] ?? 'Error desconocido en el servicio de tasas de cambio.')
        : (string)$response['error'];
      throw new \RuntimeException('El servicio de tasas de cambio no pudo completar la solicitud: ' . $message);
    }

    $rates = $response['rates'] ?? [];
    if (!is_array($rates)) {
      throw new \RuntimeException('El servicio de tasas de cambio envió datos incompletos.');
    }

    // Asegurar que la moneda base tenga tasa 1.0
    $rates[self::BASE_CURRENCY] = 1.0;
    $response['rates'] = $rates;

    return $response;
  }

  /**
   * @return array<string, mixed>
   */
  private function request(string $endpoint, array $query = []): array {
    $url = $this->apiBaseUrl . '/' . ltrim($endpoint, '/');

    if ($query !== []) {
      $url .= '?' . http_build_query($query);
    }

    $context = stream_context_create([
      'http' => [
        'timeout'       => 8,
        'ignore_errors' => true,
      ],
    ]);

    $raw = @file_get_contents($url, false, $context);

    if ($raw === false) {
      throw new \RuntimeException('No se pudo conectar con el servicio de tasas de cambio en línea.');
    }

    $data = json_decode($raw, true);
    if (!is_array($data)) {
      throw new \RuntimeException('No se pudo interpretar la respuesta del servicio de tasas de cambio.');
    }

    return $data;
  }

  private function formatTimestamp(?string $date): string {
    if ($date === null || $date === '') {
      return (new \DateTimeImmutable())->format(DATE_ATOM);
    }

    try {
      $dateTime = new \DateTimeImmutable($date);
      return $dateTime->setTime(0, 0)->format(DATE_ATOM);
    } catch (\Exception $exception) {
      return (new \DateTimeImmutable())->format(DATE_ATOM);
    }
  }
}
