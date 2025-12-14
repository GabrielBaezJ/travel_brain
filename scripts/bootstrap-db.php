<?php
require __DIR__ . '/../vendor/autoload.php';
require __DIR__ . '/../config/env.php';

$client = new MongoDB\Client(getenv('MONGO_URI') ?: 'mongodb://localhost:27017');
$db = $client->selectDatabase(getenv('MONGO_DB') ?: 'travel_brain');
$users = $db->selectCollection('users');

// Verifica si ya existe un admin
$admin = $users->findOne(['role' => 'ADMIN']);
if ($admin) {
  echo "✓ Admin ya existe.\n";
  exit(0);
}

// Crear admin de desarrollo
$res = $users->insertOne([
  'username' => 'admin',
  'email' => 'admin@travel.local',
  'passwordHash' => password_hash('admin123', PASSWORD_BCRYPT),
  'name' => 'Admin Travel',
  'role' => 'ADMIN',
  'status' => 'ACTIVE',
  'createdAt' => new MongoDB\BSON\UTCDateTime(),
  'lastLogin' => null
]);

echo "✓ Admin creado con ID: " . $res->getInsertedId() . "\n";
