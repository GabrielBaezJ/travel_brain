<?php
namespace App\Features\Users;

use App\Core\Constants\ValidationRules;

final class UserValidator {
  public function validateForCreate(array $data): void {
    $this->validateUsername($data['username'] ?? '');
    $this->validateEmail($data['email'] ?? '');
    $this->validateName($data['name'] ?? '');
    $this->validatePassword($data['password'] ?? '');
    $this->validatePasswordConfirmation($data);
  }

  public function validateForUpdate(array $data): void {
    if (isset($data['email'])) {
      $this->validateEmail($data['email']);
    }
    if (isset($data['username'])) {
      $this->validateUsername($data['username']);
    }
  }

  private function validateUsername(string $username): void {
    if (empty($username)) {
      throw new \InvalidArgumentException('Usuario requerido');
    }

    $length = strlen($username);
    if ($length < ValidationRules::USERNAME_MIN_LENGTH || $length > ValidationRules::USERNAME_MAX_LENGTH) {
      throw new \InvalidArgumentException(
        sprintf(
          'Usuario debe tener entre %d y %d caracteres',
          ValidationRules::USERNAME_MIN_LENGTH,
          ValidationRules::USERNAME_MAX_LENGTH
        )
      );
    }

    if (!preg_match(ValidationRules::USERNAME_PATTERN, $username)) {
      throw new \InvalidArgumentException('Usuario solo puede contener letras, números, punto, guion y guion bajo');
    }
  }

  private function validateEmail(string $email): void {
    if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
      throw new \InvalidArgumentException('Email inválido');
    }
  }

  private function validateName(string $name): void {
    if (empty($name) || strlen(trim($name)) < ValidationRules::NAME_MIN_LENGTH) {
      throw new \InvalidArgumentException(
        sprintf('Nombre debe tener al menos %d caracteres', ValidationRules::NAME_MIN_LENGTH)
      );
    }
  }

  private function validatePassword(string $password): void {
    if (empty($password)) {
      throw new \InvalidArgumentException('Contraseña requerida');
    }

    if (strlen($password) < ValidationRules::PASSWORD_MIN_LENGTH) {
      throw new \InvalidArgumentException(
        sprintf('Contraseña debe tener al menos %d caracteres', ValidationRules::PASSWORD_MIN_LENGTH)
      );
    }
  }

  private function validatePasswordConfirmation(array $data): void {
    if (isset($data['password_confirm']) && $data['password'] !== $data['password_confirm']) {
      throw new \InvalidArgumentException('Las contraseñas no coinciden');
    }
  }
}
