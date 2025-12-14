<?php
use App\Core\Http\Router;
use App\Features\Users\UserController;

$c = new UserController();
$router->get('/users',        [$c,'index']);
$router->post('/users',       [$c,'store']);
$router->get('/users/{id}',   [$c,'show']);
$router->put('/users/{id}',   [$c,'update']);
$router->delete('/users/{id}', [$c,'destroy']);
