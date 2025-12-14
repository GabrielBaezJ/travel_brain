<?php
namespace App\Core\Database;
use MongoDB\Client;

final class MongoConnection {
  private static ?Client $client = null;
  public static function client(): Client {
    if (!self::$client) {
      $uri = getenv('MONGO_URI') ?: 'mongodb://localhost:27017';
      self::$client = new Client($uri);
    }
    return self::$client;
  }
}
