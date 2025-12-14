<?php
namespace App\Core\Contracts;

interface DestinationRepositoryInterface {
  public function findAll(int $page = 1, int $size = 20, ?string $userId = null, ?string $search = null): array;
  public function findById(string $id): ?array;
  public function findByName(string $name, ?string $country = null): ?array;
  public function create(array $data): string;
  public function update(string $id, array $data): bool;
  public function delete(string $id): bool;
}

