<?php

use App\Features\Itinerary\ItineraryController;

$itineraryController = new ItineraryController();

// Create or update itinerary for a trip
$router->post('/api/trips/{tripId}/itinerary', [$itineraryController, 'create']);

// Get itinerary by trip ID
$router->get('/api/trips/{tripId}/itinerary', [$itineraryController, 'getByTripId']);

// Get all itineraries for current user (DEBE IR ANTES de /api/itineraries/{id})
$router->get('/api/users/me/itineraries/{page}/{size}', [$itineraryController, 'getUserItineraries']);

// Update specific day in itinerary (DEBE IR ANTES de /api/itineraries/{id})
$router->put('/api/itineraries/{id}/days/{dayNumber}', [$itineraryController, 'updateDay']);

// Update itinerary by ID
$router->put('/api/itineraries/{id}', [$itineraryController, 'update']);

// Delete itinerary
$router->delete('/api/itineraries/{id}', [$itineraryController, 'delete']);
