<?php
namespace App\Features\Users;
final class User {
  public string $username;
  public string $email;
  public string $name;
  public string $role;
  public string $status;
  public string $passwordHash;

  public function __construct(array $data) {
    $this->username = $data['username'] ?? '';
    $this->email = $data['email'];
    $this->name = $data['name'];
    $this->role = $data['role'] ?? \App\Core\Constants\UserRoles::REGISTERED;
    $this->status = $data['status'] ?? \App\Core\Constants\UserStatus::ACTIVE;
    $this->passwordHash = $data['passwordHash'];
  }

  public function toArray(): array {
    return [
      'username' => $this->username,
      'email' => $this->email,
      'name' => $this->name,
      'role' => $this->role,
      'status' => $this->status,
      'passwordHash' => $this->passwordHash
    ];
  }
}
