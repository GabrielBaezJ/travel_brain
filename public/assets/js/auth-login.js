// public/assets/js/auth-login.js
(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const errorModal = document.getElementById('errorModal');
    const errorMessage = document.getElementById('errorMessage');
    const closeBtn = document.querySelector('.close-error');

    if (!loginForm) return;

    // Configurar validaciones del formulario
    const fieldRules = {
      username: { required: true, minLength: 3 },
      password: { required: true, minLength: 6 }
    };

    // Configurar validación en tiempo real
    if (window.ValidationUtils) {
      window.ValidationUtils.setupRealTimeValidation(loginForm, fieldRules);
    }

    const showError = (msg) => {
      if (window.ValidationUtils) {
        window.ValidationUtils.showError(msg || 'Error de autenticación');
      } else {
        errorMessage.textContent = msg || 'Error de autenticación';
        errorModal.style.display = 'block';
      }
    };

    const showSuccess = (msg) => {
      if (window.ValidationUtils) {
        window.ValidationUtils.showSuccess(msg);
      }
    };

    closeBtn?.addEventListener('click', () => {
      errorModal.style.display = 'none';
    });

    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Validar formulario antes de enviar
      if (window.ValidationUtils) {
        const isValid = window.ValidationUtils.validateForm(loginForm, fieldRules);
        if (!isValid) {
          window.ValidationUtils.showError('Por favor, corrige los errores en el formulario');
          return;
        }
      }

      const username = document.getElementById('l_username').value.trim();
      const password = document.getElementById('l_password').value.trim();

      // Validación básica si ValidationUtils no está disponible
      if (!username || !password) {
        showError('Todos los campos son obligatorios');
        return;
      }

      if (username.length < 3) {
        showError('El usuario debe tener al menos 3 caracteres');
        return;
      }

      if (password.length < 6) {
        showError('La contraseña debe tener al menos 6 caracteres');
        return;
      }

      try {
        if (!window.Auth || typeof window.Auth.login !== 'function') {
          showError('Error: módulo de autenticación no cargado.');
          return;
        }

        // Mostrar indicador de carga
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Iniciando sesión...';

        const res = await window.Auth.login({ username, password });

        // Restaurar botón
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;

        if (!res.ok) {
          showError(res.msg || 'Credenciales inválidas');
          return;
        }

        // Login exitoso
        showSuccess('¡Inicio de sesión exitoso!');
        
        if (typeof window.Auth.renderUserArea === 'function') {
          window.Auth.renderUserArea();
        }

        // Verificar si es admin y redirigir apropiadamente
        setTimeout(async () => {
          try {
            const meRes = await fetch('/api/auth/me', { credentials: 'include' });
            const meData = await meRes.json();
            if (meData.ok && meData.user && meData.user.role === 'ADMIN') {
              location.href = '/admin';
            } else {
              location.href = '/';
            }
          } catch (e) {
            location.href = '/';
          }
        }, 800);

      } catch (err) {
        console.error('Error en autenticación:', err);
        showError('Ocurrió un error inesperado. Intenta nuevamente.');
        
        // Restaurar botón en caso de error
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Iniciar sesión';
      }
    });
  });
})();
