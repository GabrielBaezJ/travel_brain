<?php

use App\Features\Rates\RateController;

$rateController = new RateController();

// IMPORTANTE: Las rutas más específicas deben ir ANTES que las genéricas
// para evitar que {id} capture "stats" o "me"

// Estadísticas de un destino (DEBE IR ANTES de /api/destinations/{id}/rates)
$router->get('/api/destinations/{id}/rates/stats', [$rateController, 'stats']);

// Mi calificación de un destino (DEBE IR ANTES de /api/destinations/{id}/rates)
$router->get('/api/destinations/{id}/rates/me', [$rateController, 'myRate']);

// Calificaciones de un destino específico
$router->get('/api/destinations/{id}/rates/{page}/{size}', [$rateController, 'index']);
$router->post('/api/destinations/{id}/rate', [$rateController, 'rate']);
$router->post('/api/destinations/{id}/favorite', [$rateController, 'toggleFavorite']);
$router->delete('/api/destinations/{id}/rates/me', [$rateController, 'delete']);

// Mis calificaciones y favoritos
$router->get('/api/users/me/rates/{page}/{size}', [$rateController, 'myRates']);
$router->get('/api/users/me/favorites', [$rateController, 'myFavorites']);

// CRUD de calificaciones individuales (por ID de rate)
$router->put('/api/rates/{id}', [$rateController, 'update']);
