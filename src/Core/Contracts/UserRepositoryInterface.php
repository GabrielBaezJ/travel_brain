<?php
namespace App\Core\Contracts;

interface UserRepositoryInterface {
  public function findAll(int $page=1,int $size=20): array;
  public function findById(string $id): ?array;
  public function create(array $data): string;
  public function update(string $id, array $data): bool;
  public function delete(string $id): bool; // recomendado: borrado lógico en servicio
  public function findByEmail(string $email): ?array;
  public function findByUsername(string $username): ?array;
}
