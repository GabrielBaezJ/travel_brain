<?php

// Si se ejecuta con el servidor embebido de PHP y el archivo solicitado existe
// dentro del directorio público, dejar que PHP lo sirva directamente (CSS/JS/IMG)
if (PHP_SAPI === 'cli-server') {
  $path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
  $file = realpath(__DIR__ . $path);
  if ($file && str_starts_with($file, realpath(__DIR__)) && is_file($file)) {
    return false; // delegar al servidor embebido
  }
}

// 1) Autoload de Composer
require __DIR__ . '/../vendor/autoload.php';
require __DIR__ . '/../config/env.php';

// 2) Arrancar Router
use App\Core\Http\Router;
use App\Core\Http\Response;
use App\Core\Http\Request;
use App\Core\Database\MongoConnection;
use App\Core\Constants\UserStatus;
use App\Core\Auth\AuthMiddleware;
use App\Features\Auth\AuthController;
use MongoDB\BSON\ObjectId;
use MongoDB\BSON\UTCDateTime;

$router = new Router();

// 3) Registrar rutas por feature
require __DIR__ . '/../src/Features/Users/UserRoutes.php';
require __DIR__ . '/../src/Features/Rates/RateRoutes.php';
require __DIR__ . '/../src/Features/Destinations/DestinationRoutes.php';
require __DIR__ . '/../src/Features/Trips/TripRoutes.php';
require __DIR__ . '/../src/Features/Routes/RouteFavoritesRoutes.php';
require __DIR__ . '/../src/Features/Currency/CurrencyRoutes.php';
require __DIR__ . '/../src/Features/Weather/WeatherRoutes.php';
require __DIR__ . '/../src/Features/Itinerary/ItineraryRoutes.php';

// ============ HELPERS ============
function requireAuth(): void {
  AuthMiddleware::startSession();
  if (!AuthMiddleware::isAuthenticated()) {
    http_response_code(401);
    header('Location: /auth/login');
    exit;
  }
}

function requireAdmin(): void {
  AuthMiddleware::startSession();
  AuthMiddleware::ensureAdmin();
}

/**
 * Formatea una fecha MongoDB a string legible (usando timezone configurado)
 */
function formatMongoDate($date): string {
  if ($date === null) return '';
  
  // Timezone configurado (America/Guayaquil = UTC-5)
  $tz = new \DateTimeZone(date_default_timezone_get());
  
  // Si es UTCDateTime de MongoDB
  if ($date instanceof \MongoDB\BSON\UTCDateTime) {
    return $date->toDateTime()->setTimezone($tz)->format('Y-m-d H:i:s');
  }
  
  // Si es un array con formato $date.$numberLong (JSON extendido)
  if (is_array($date) || is_object($date)) {
    $arr = (array)$date;
    if (isset($arr['$date'])) {
      $inner = (array)$arr['$date'];
      if (isset($inner['$numberLong'])) {
        $ts = (int)$inner['$numberLong'] / 1000;
        // date() ya usa el timezone por defecto de PHP
        return date('Y-m-d H:i:s', (int)$ts);
      }
    }
  }
  
  // Si ya es string
  if (is_string($date)) {
    return $date;
  }
  
  return '';
}

/**
 * Formatea fechas en un documento MongoDB
 */
function formatDocumentDates(array $doc): array {
  $dateFields = ['createdAt', 'updatedAt', 'startDate', 'endDate', 'date', 'searchedAt'];
  
  foreach ($dateFields as $field) {
    if (isset($doc[$field])) {
      $doc[$field] = formatMongoDate($doc[$field]);
    }
  }
  
  // Convertir _id a string
  if (isset($doc['_id'])) {
    $doc['_id'] = (string)$doc['_id'];
  }
  
  // Convertir userId a string
  if (isset($doc['userId'])) {
    $doc['userId'] = (string)$doc['userId'];
  }
  
  // Convertir tripId a string
  if (isset($doc['tripId'])) {
    $doc['tripId'] = (string)$doc['tripId'];
  }
  
  // Convertir destinationId a string
  if (isset($doc['destinationId'])) {
    $doc['destinationId'] = (string)$doc['destinationId'];
  }
  
  return $doc;
}

// ============ SESIÓN ============
AuthMiddleware::startSession();

// ============ CONEXIÓN MONGO ============
try {
  $mongoClient = MongoConnection::client();
  $mongoDb     = $mongoClient->selectDatabase(getenv('MONGO_DB') ?: 'travel_brain');
  $usersCol    = $mongoDb->selectCollection('users');
} catch (Exception $e) {
  http_response_code(500);
  Response::error('Error de conexión a la base de datos', 500);
  exit;
}

// ============ RUTAS PÚBLICAS ============
$router->get('/', function () {
  readfile(__DIR__ . '/../src/views/home/index.html');
});

$router->get('/auth/login', function () {
  readfile(__DIR__ . '/../src/views/auth/login.html');
});

$router->get('/auth/register', function () {
  readfile(__DIR__ . '/../src/views/auth/register.html');
});

// ============ RUTAS PROTEGIDAS ============
$router->get('/destinations', function () {
  requireAuth();
  readfile(__DIR__ . '/../src/views/destinations/destinations.html');
});

$router->get('/favorites', function () {
  requireAuth();
  readfile(__DIR__ . '/../src/views/destinations/favorites.html');
});

$router->get('/trips', function () {
  requireAuth();
  readfile(__DIR__ . '/../src/views/trips/trips-form.html');
});

$router->get('/budget', function () {
  requireAuth();
  readfile(__DIR__ . '/../src/views/trips/budget.html');
});

$router->get('/routes', function () {
  // Guest allowed: visualizar mapa y calcular rutas de ejemplo
  readfile(__DIR__ . '/../src/views/routes/route.html');
});

$router->get('/weather', function () {
  // Guest allowed: consultar clima simulado para un destino único
  readfile(__DIR__ . '/../src/views/weather/weather.html');
});

$router->get('/currency', function () {
  // Guest allowed: consultar tasas en línea mediante Frankfurter
  readfile(__DIR__ . '/../src/views/currency/currency.html');
});

$router->get('/itinerary', function () {
  requireAuth();
  readfile(__DIR__ . '/../src/views/itinerary/itinerary.html');
});

// ============ VISTA ADMIN ============
$router->get('/admin', function () {
  requireAdmin();
  readfile(__DIR__ . '/../src/views/admin/index.html');
});
$router->get('/admin/users', function () {
  requireAdmin();
  readfile(__DIR__ . '/../src/views/admin/users.html');
});

// ============ API AUTH ============
$authController = new AuthController();

// POST /api/auth/register
$router->post('/api/auth/register', [$authController, 'register']);

// POST /api/auth/login
$router->post('/api/auth/login', [$authController, 'login']);

// GET /api/auth/me
$router->get('/api/auth/me', [$authController, 'me']);

// POST /api/auth/logout
$router->post('/api/auth/logout', [$authController, 'logout']);

// ============ API ADMIN USUARIOS ============
// Resumen para métricas del dashboard
$router->get('/api/admin/metrics', function () use ($usersCol, $mongoDb) {
  try {
    requireAdmin();
    $destinationsCol = $mongoDb->selectCollection('destinations');
    $tripsCol = $mongoDb->selectCollection('trips');
    $itinsCol = $mongoDb->selectCollection('itineraries');
    $routesCol = $mongoDb->selectCollection('favorite_routes');

    $usersTotal = $usersCol->countDocuments();
    $usersActive = $usersCol->countDocuments(['status' => 'ACTIVE']);
    $usersDeactivated = $usersCol->countDocuments(['status' => 'DEACTIVATED']);
    $destinations = $destinationsCol->countDocuments();
    $trips = $tripsCol->countDocuments();
    $itineraries = $itinsCol->countDocuments();
    $routes = $routesCol->countDocuments();

    Response::json(['ok' => true, 'usersTotal' => $usersTotal, 'usersActive' => $usersActive, 'usersDeactivated' => $usersDeactivated, 'destinations' => $destinations, 'trips' => $trips, 'itineraries' => $itineraries, 'routes' => $routes]);
  } catch (Exception $e) {
    Response::error('Error métricas: ' . $e->getMessage(), 500);
  }
});
// GET /api/admin/users/{page}/{size}
$router->get('/api/admin/users/{page}/{size}', function ($page, $size) use ($usersCol) {
  try {
    requireAdmin();
    $page = max(1, (int)$page);
    $size = max(1, min(100, (int)$size));
    $skip = ($page - 1) * $size;
    
    $cursor = $usersCol->find([], [
      'projection' => ['passwordHash' => 0],
      'skip' => $skip,
      'limit' => $size,
      'sort' => ['createdAt' => -1]
    ]);
    
    $items = array_map(function($user) {
      return formatDocumentDates((array)$user);
    }, iterator_to_array($cursor));
    
    $total = $usersCol->countDocuments();
    Response::json([
      'ok' => true,
      'items' => $items,
      'page' => $page,
      'size' => $size,
      'total' => $total
    ]);
  } catch (Exception $e) {
    Response::error('Error al obtener usuarios: ' . $e->getMessage(), 500);
  }
});

// GET /api/admin/users/{id}
$router->get('/api/admin/users/{id}', function ($id) use ($usersCol) {
  try {
    requireAdmin();
    
    if (!$id || !preg_match('/^[0-9a-fA-F]{24}$/', $id)) {
      Response::error('ID inválido', 400);
      return;
    }
    
    $user = $usersCol->findOne(
      ['_id' => new \MongoDB\BSON\ObjectId($id)],
      ['projection' => ['passwordHash' => 0]]
    );
    
    if (!$user) {
      Response::error('Usuario no encontrado', 404);
      return;
    }
    
    $user = formatDocumentDates((array)$user);
    Response::json(['ok' => true, 'user' => $user]);
  } catch (Exception $e) {
    Response::error('Error al obtener usuario: ' . $e->getMessage(), 500);
  }
});

// PUT /api/admin/users/{id}
$router->put('/api/admin/users/{id}', function ($id) use ($usersCol) {
  try {
    requireAdmin();
    
    if (!$id || !preg_match('/^[0-9a-fA-F]{24}$/', $id)) {
      Response::error('ID inválido', 400);
      return;
    }
    
    $body = Request::body();
    if (!$body) {
      Response::error('Cuerpo de solicitud vacío', 400);
      return;
    }
    
    $allowedFields = ['email', 'username', 'name', 'role', 'status'];
    $updateData = [];
    
    foreach ($allowedFields as $field) {
      if (isset($body[$field]) && $body[$field] !== '') {
        $updateData[$field] = $body[$field];
      }
    }
    
    if (empty($updateData)) {
      Response::error('No hay campos válidos para actualizar', 400);
      return;
    }
    
    $result = $usersCol->updateOne(
      ['_id' => new \MongoDB\BSON\ObjectId($id)],
      ['$set' => $updateData]
    );
    
    if ($result->getMatchedCount() === 0) {
      Response::error('Usuario no encontrado', 404);
      return;
    }
    
    Response::json(['ok' => true]);
  } catch (Exception $e) {
    Response::error('Error al actualizar usuario: ' . $e->getMessage(), 500);
  }
});

// DELETE /api/admin/users/{id}  (soft delete -> status=DEACTIVATED)
$router->delete('/api/admin/users/{id}', function ($id) use ($usersCol) {
  try {
    requireAdmin();
    
    if (!$id || !preg_match('/^[0-9a-fA-F]{24}$/', $id)) {
      Response::error('ID inválido', 400);
      return;
    }
    
    $result = $usersCol->updateOne(
      ['_id' => new \MongoDB\BSON\ObjectId($id)],
      ['$set' => ['status' => UserStatus::DEACTIVATED]]
    );
    
    if ($result->getMatchedCount() === 0) {
      Response::error('Usuario no encontrado', 404);
      return;
    }
    
    Response::json(['ok' => true]);
  } catch (Exception $e) {
    Response::error('Error al desactivar usuario: ' . $e->getMessage(), 500);
  }
});

// ============ API ADMIN - DESTINOS ============
$router->get('/api/admin/destinations/{page}/{size}', function ($page, $size) use ($mongoDb) {
  try {
    requireAdmin();
    $page = max(1, (int)$page);
    $size = min(100, max(1, (int)$size));
    $skip = ($page - 1) * $size;
    
    $col = $mongoDb->selectCollection('destinations');
    $total = $col->countDocuments();
    $cursor = $col->find([], ['limit' => $size, 'skip' => $skip]);
    $items = array_map(fn($doc) => formatDocumentDates((array)$doc), iterator_to_array($cursor));
    
    Response::json(['ok' => true, 'items' => $items, 'total' => $total, 'page' => $page, 'size' => $size]);
  } catch (Exception $e) {
    Response::error('Error al cargar destinos: ' . $e->getMessage(), 500);
  }
});

// ============ API ADMIN - VIAJES ============
$router->get('/api/admin/trips/{page}/{size}', function ($page, $size) use ($mongoDb) {
  try {
    requireAdmin();
    $page = max(1, (int)$page);
    $size = min(100, max(1, (int)$size));
    $skip = ($page - 1) * $size;
    
    $col = $mongoDb->selectCollection('trips');
    $total = $col->countDocuments();
    $cursor = $col->find([], ['limit' => $size, 'skip' => $skip]);
    $items = array_map(fn($doc) => formatDocumentDates((array)$doc), iterator_to_array($cursor));
    
    Response::json(['ok' => true, 'items' => $items, 'total' => $total, 'page' => $page, 'size' => $size]);
  } catch (Exception $e) {
    Response::error('Error al cargar viajes: ' . $e->getMessage(), 500);
  }
});

// ============ API ADMIN - ITINERARIOS ============
$router->get('/api/admin/itineraries/{page}/{size}', function ($page, $size) use ($mongoDb) {
  try {
    requireAdmin();
    $page = max(1, (int)$page);
    $size = min(100, max(1, (int)$size));
    $skip = ($page - 1) * $size;
    
    $col = $mongoDb->selectCollection('itineraries');
    $total = $col->countDocuments();
    $cursor = $col->find([], ['limit' => $size, 'skip' => $skip]);
    $items = array_map(fn($doc) => formatDocumentDates((array)$doc), iterator_to_array($cursor));
    
    Response::json(['ok' => true, 'items' => $items, 'total' => $total, 'page' => $page, 'size' => $size]);
  } catch (Exception $e) {
    Response::error('Error al cargar itinerarios: ' . $e->getMessage(), 500);
  }
});

// ============ API ADMIN - RUTAS FAVORITAS ============
$router->get('/api/admin/routes/{page}/{size}', function ($page, $size) use ($mongoDb) {
  try {
    requireAdmin();
    $page = max(1, (int)$page);
    $size = min(100, max(1, (int)$size));
    $skip = ($page - 1) * $size;
    
    $col = $mongoDb->selectCollection('favorite_routes');
    $total = $col->countDocuments();
    $cursor = $col->find([], ['limit' => $size, 'skip' => $skip]);
    $items = array_map(fn($doc) => formatDocumentDates((array)$doc), iterator_to_array($cursor));
    
    Response::json(['ok' => true, 'items' => $items, 'total' => $total, 'page' => $page, 'size' => $size]);
  } catch (Exception $e) {
    Response::error('Error al cargar rutas: ' . $e->getMessage(), 500);
  }
});

// ============ API ADMIN - GASTOS ============
$router->get('/api/admin/expenses/{page}/{size}', function ($page, $size) use ($mongoDb) {
  try {
    requireAdmin();
    $page = max(1, (int)$page);
    $size = min(100, max(1, (int)$size));
    $skip = ($page - 1) * $size;
    
    $col = $mongoDb->selectCollection('expenses');
    $total = $col->countDocuments();
    $cursor = $col->find([], ['limit' => $size, 'skip' => $skip]);
    $items = array_map(fn($doc) => formatDocumentDates((array)$doc), iterator_to_array($cursor));
    
    Response::json(['ok' => true, 'items' => $items, 'total' => $total, 'page' => $page, 'size' => $size]);
  } catch (Exception $e) {
    Response::error('Error al cargar gastos: ' . $e->getMessage(), 500);
  }
});

// ============ API ADMIN - BÚSQUEDAS CLIMA ============
$router->get('/api/admin/weather/{page}/{size}', function ($page, $size) use ($mongoDb) {
  try {
    requireAdmin();
    $page = max(1, (int)$page);
    $size = min(100, max(1, (int)$size));
    $skip = ($page - 1) * $size;
    
    $col = $mongoDb->selectCollection('weather_searches');
    $total = $col->countDocuments();
    $cursor = $col->find([], ['limit' => $size, 'skip' => $skip]);
    $items = array_map(fn($doc) => formatDocumentDates((array)$doc), iterator_to_array($cursor));
    
    Response::json(['ok' => true, 'items' => $items, 'total' => $total, 'page' => $page, 'size' => $size]);
  } catch (Exception $e) {
    Response::error('Error al cargar búsquedas de clima: ' . $e->getMessage(), 500);
  }
});

// ============ API ADMIN - CALIFICACIONES (RATES) ============
$router->get('/api/admin/rates/{page}/{size}', function ($page, $size) use ($mongoDb) {
  try {
    requireAdmin();
    $page = max(1, (int)$page);
    $size = min(100, max(1, (int)$size));
    $skip = ($page - 1) * $size;
    
    $col = $mongoDb->selectCollection('rates');
    $total = $col->countDocuments();
    $cursor = $col->find([], ['limit' => $size, 'skip' => $skip, 'sort' => ['createdAt' => -1]]);
    $items = array_map(fn($doc) => formatDocumentDates((array)$doc), iterator_to_array($cursor));
    
    Response::json(['ok' => true, 'items' => $items, 'total' => $total, 'page' => $page, 'size' => $size]);
  } catch (Exception $e) {
    Response::error('Error al cargar calificaciones: ' . $e->getMessage(), 500);
  }
});

// ============ API ADMIN - ESTADÍSTICAS DE DESTINOS CON RATINGS ============
$router->get('/api/admin/destinations-stats', function () use ($mongoDb) {
  try {
    requireAdmin();
    
    // Agregación: obtener destinos con sus estadísticas de ratings
    $destinationsCol = $mongoDb->selectCollection('destinations');
    $ratesCol = $mongoDb->selectCollection('rates');
    
    // Obtener todos los destinos
    $destinations = iterator_to_array($destinationsCol->find([], ['limit' => 100]));
    
    $results = [];
    foreach ($destinations as $dest) {
      $destId = (string)$dest['_id'];
      
      // Calcular estadísticas de este destino
      $pipeline = [
        ['$match' => ['destinationId' => $destId]],
        ['$group' => [
          '_id' => '$destinationId',
          'avgRating' => ['$avg' => '$rating'],
          'totalRatings' => ['$sum' => 1],
          'totalFavorites' => ['$sum' => ['$cond' => [['$eq' => ['$favorite', true]], 1, 0]]]
        ]]
      ];
      
      $stats = iterator_to_array($ratesCol->aggregate($pipeline));
      
      $results[] = [
        '_id' => $destId,
        'name' => $dest['name'] ?? 'Sin nombre',
        'country' => $dest['country'] ?? '',
        'userId' => (string)($dest['userId'] ?? ''),
        'avgRating' => !empty($stats) ? round($stats[0]['avgRating'], 1) : 0,
        'totalRatings' => !empty($stats) ? $stats[0]['totalRatings'] : 0,
        'totalFavorites' => !empty($stats) ? $stats[0]['totalFavorites'] : 0,
        'createdAt' => formatMongoDate($dest['createdAt'] ?? null)
      ];
    }
    
    // Ordenar por avgRating descendente
    usort($results, fn($a, $b) => $b['avgRating'] <=> $a['avgRating']);
    
    Response::json([
      'ok' => true,
      'items' => $results,
      'total' => count($results)
    ]);
  } catch (Exception $e) {
    Response::error('Error al cargar estadísticas: ' . $e->getMessage(), 500);
  }
});

// GET /health
$router->get('/health', function () use ($mongoDb) {
  try {
    $mongoDb->command(['ping' => 1]);
    Response::json(['ok' => true, 'status' => 'healthy']);
  } catch (Exception $e) {
    Response::error('Base de datos no disponible', 503);
  }
});

// ============ CONFIG PÚBLICA (solo valores no sensibles) ============
$router->get('/config.js', function () {
  try {
    header('Content-Type: application/javascript');
    $mapboxToken = getenv('MAPBOX_TOKEN') ?: '';
    echo 'globalThis.__CONFIG__ = Object.assign(globalThis.__CONFIG__||{}, { MAPBOX_TOKEN: ' . json_encode($mapboxToken) . ' });';
  } catch (Exception $e) {
    http_response_code(500);
    echo 'console.error("Error loading config");';
  }
  exit;
});

// ============ DEBUG (opcional, requiere token) ============
$router->get('/api/_debug/auth', function () use ($mongoDb) {
  $tokenRequired = getenv('AUTH_DEBUG_TOKEN') ?: getenv('DEBUG_TOKEN') ?: '';
  $provided = Request::get('token', '');
  if ($tokenRequired === '' || !hash_equals($tokenRequired, $provided)) {
    Response::error('Forbidden', 403);
    return;
  }
  $identifier = trim((string)Request::get('user', ''));
  if ($identifier === '') {
    Response::error('user requerido', 400);
    return;
  }
  $col = $mongoDb->selectCollection('users');
  $doc = $col->findOne(['$or' => [['username' => $identifier], ['email' => $identifier]]]);
  if (!$doc) { Response::json(['ok' => true, 'exists' => false]); return; }
  $arr = $doc instanceof \MongoDB\Model\BSONDocument ? $doc->getArrayCopy() : (array)$doc;
  $hash = isset($arr['passwordHash']) && is_string($arr['passwordHash']) ? $arr['passwordHash'] : null;
  $probe = (string)Request::get('pass', '');
  $verify = ($hash && $probe !== '') ? password_verify($probe, $hash) : null;
  Response::json([
    'ok' => true,
    'exists' => true,
    'hasPasswordHash' => $hash !== null,
    'hashPrefix' => $hash ? substr($hash, 0, 7) : null,
    'verify' => $verify
  ]);
});

// ============ DESPACHAR ============
try {
  $router->dispatch($_SERVER['REQUEST_METHOD'], $_SERVER['REQUEST_URI']);
} catch (Exception $e) {
  Response::error('Error interno del servidor', 500);
}
