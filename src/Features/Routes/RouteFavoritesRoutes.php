<?php
use App\Features\Routes\FavoriteRouteController;

$favoriteRouteController = new FavoriteRouteController();

$router->get('/api/routes/favorites/{page}/{size}', [$favoriteRouteController, 'index']);
$router->post('/api/routes/favorites', [$favoriteRouteController, 'store']);
$router->delete('/api/routes/favorites/{id}', [$favoriteRouteController, 'destroy']);

