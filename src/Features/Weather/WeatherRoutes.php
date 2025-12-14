<?php

use App\Features\Weather\WeatherController;

$weatherController = new WeatherController();

$router->get('/api/weather/current/{lat}/{lon}', [$weatherController, 'current']);
$router->get('/api/weather/current/{lat}/{lon}/{log}', [$weatherController, 'current']);
$router->get('/api/weather/history/{page}/{size}', [$weatherController, 'history']);
