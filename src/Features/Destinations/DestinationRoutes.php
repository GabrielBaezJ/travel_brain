<?php
use App\Core\Http\Router;
use App\Features\Destinations\DestinationController;

$controller = new DestinationController();

// CRUD completo de destinos
$router->get('/api/destinations/{page}/{size}', [$controller, 'index']);
$router->get('/api/destinations/{page}/{size}/{search}', [$controller, 'index']);
$router->post('/api/destinations', [$controller, 'store']);
$router->get('/api/destinations/{id}', [$controller, 'show']);
$router->put('/api/destinations/{id}', [$controller, 'update']);
$router->delete('/api/destinations/{id}', [$controller, 'destroy']);

