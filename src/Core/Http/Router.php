<?php
namespace App\Core\Http;

final class Router {
  private array $routes = [];
  
  public function get(string $path, callable $handler): void {
    $this->routes['GET'][$path] = $handler;
  }
  
  public function post(string $path, callable $handler): void {
    $this->routes['POST'][$path] = $handler;
  }
  
  public function put(string $path, callable $handler): void {
    $this->routes['PUT'][$path] = $handler;
  }
  
  public function delete(string $path, callable $handler): void {
    $this->routes['DELETE'][$path] = $handler;
  }
  
  public function dispatch(string $method, string $uri): void {
    $uriPath = parse_url($uri, PHP_URL_PATH);
    
    if ($this->dispatchExactRoute($method, $uriPath)) {
      return;
    }
    
    if ($this->dispatchDynamicRoute($method, $uriPath)) {
      return;
    }
    
    $this->notFound();
  }

  private function dispatchExactRoute(string $method, string $uriPath): bool {
    if (!isset($this->routes[$method][$uriPath])) {
      return false;
    }

    $handler = $this->routes[$method][$uriPath];
    if (is_callable($handler)) {
      call_user_func($handler);
      return true;
    }

    return false;
  }

  private function dispatchDynamicRoute(string $method, string $uriPath): bool {
    if (!isset($this->routes[$method])) {
      return false;
    }

    foreach ($this->routes[$method] as $pattern => $handler) {
      $matches = [];
      if (!$this->matchesPattern($pattern, $uriPath, $matches)) {
        continue;
      }

      if (is_callable($handler)) {
        array_shift($matches);
        call_user_func_array($handler, $matches);
        return true;
      }
    }

    return false;
  }

  // Build a safe regex from a route pattern like "/api/users/{id}" supporting dynamic segments.
  private function buildRegex(string $pattern): string {
    $regex = '';
    $len = strlen($pattern);
    for ($i = 0; $i < $len; $i++) {
      $ch = $pattern[$i];
      if ($ch === '{') {
        $end = strpos($pattern, '}', $i);
        if ($end === false) {
          // unmatched '{', escape it
          $regex .= '\\{';
        } else {
          // parameter name (optional, we don't use the name here)
          // $name = substr($pattern, $i + 1, $end - $i - 1);
          $regex .= '([^/]+)';
          $i = $end; // jump after '}'
        }
      } else {
        // Escape regex special characters
        if (preg_match('#[.\\+*?\[\]^$(){}=!<>|:\-]#', $ch)) {
          $regex .= '\\' . $ch;
        } else if ($ch === '#') {
          $regex .= '\\#';
        } else {
          $regex .= $ch;
        }
      }
    }
    return '#^' . $regex . '$#';
  }

  private function matchesPattern(string $pattern, string $uriPath, ?array &$matches = null): bool {
    $regex = $this->buildRegex($pattern);
    $local = [];
    $ok = (bool)preg_match($regex, $uriPath, $local);
    // Ensure $matches is always an array reference for callers
    if ($matches === null) {
      $matches = $local;
    } else {
      $matches = $local;
    }
    return $ok;
  }

  private function notFound(): void {
    http_response_code(404);
    echo '404 Not Found';
  }
}
