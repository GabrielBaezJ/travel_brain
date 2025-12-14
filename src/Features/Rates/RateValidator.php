<?php
namespace App\Features\Rates;

final class RateValidator {
  public function validateForCreate(array $data): void {
    $this->validateUserId($data['userId'] ?? '');
    $this->validateDestinationId($data['destinationId'] ?? '');
    $this->validateRating($data['rating'] ?? null);
    $this->validateFavorite($data['favorite'] ?? null);
    
    if (isset($data['comment'])) {
      $this->validateComment($data['comment']);
    }
  }

  public function validateForUpdate(array $data): void {
    if (isset($data['rating'])) {
      $this->validateRating($data['rating']);
    }
    
    if (isset($data['favorite'])) {
      $this->validateFavorite($data['favorite']);
    }
    
    if (isset($data['comment'])) {
      $this->validateComment($data['comment']);
    }
  }

  private function validateUserId(string $userId): void {
    if (empty($userId)) {
      throw new \InvalidArgumentException('Usuario requerido');
    }
    
    if (!preg_match('/^[0-9a-fA-F]{24}$/', $userId)) {
      throw new \InvalidArgumentException('ID de usuario inválido');
    }
  }

  private function validateDestinationId(string $destinationId): void {
    if (empty($destinationId)) {
      throw new \InvalidArgumentException('Destino requerido');
    }
    
    if (!preg_match('/^[0-9a-fA-F]{24}$/', $destinationId)) {
      throw new \InvalidArgumentException('ID de destino inválido');
    }
  }

  private function validateRating($rating): void {
    if ($rating === null || $rating === '') {
      throw new \InvalidArgumentException('Calificación requerida');
    }
    
    $ratingInt = (int)$rating;
    if ($ratingInt < 1 || $ratingInt > 5) {
      throw new \InvalidArgumentException('La calificación debe estar entre 1 y 5');
    }
  }

  private function validateFavorite($favorite): void {
    if ($favorite !== null && !is_bool($favorite) && $favorite !== 0 && $favorite !== 1 && $favorite !== '0' && $favorite !== '1') {
      throw new \InvalidArgumentException('El campo favorito debe ser verdadero o falso');
    }
  }

  private function validateComment(?string $comment): void {
    if ($comment === null || $comment === '') {
      return;
    }
    
    $length = strlen(trim($comment));
    if ($length > 500) {
      throw new \InvalidArgumentException('El comentario no puede exceder 500 caracteres');
    }
  }
}
