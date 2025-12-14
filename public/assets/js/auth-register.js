(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('registerForm');
    if (!form) return;

    // Configurar validaciones del formulario
    const fieldRules = {
      firstname: { required: true, minLength: 2, name: true },
      lastname: { required: true, minLength: 2, name: true },
      username: { required: true, minLength: 3, maxLength: 20, username: true },
      email: { required: true, email: true },
      password: { required: true, minLength: 6, password: true },
      password2: { required: true, minLength: 6 },
      _passwordMatch: { password: 'password', confirm: 'password2' }
    };

    // Configurar validación en tiempo real
    if (window.ValidationUtils) {
      window.ValidationUtils.setupRealTimeValidation(form, fieldRules);
    }

    const showError = (msg) => {
      if (window.ValidationUtils) {
        window.ValidationUtils.showError(msg);
      } else {
        alert(msg);
      }
    };

    const showSuccess = (msg) => {
      if (window.ValidationUtils) {
        window.ValidationUtils.showSuccess(msg);
      }
    };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Validar formulario antes de enviar
      if (window.ValidationUtils) {
        const isValid = window.ValidationUtils.validateForm(form, fieldRules);
        if (!isValid) {
          window.ValidationUtils.showError('Por favor, corrige los errores en el formulario');
          return;
        }
      }

      const data = {
        username: document.getElementById('r_username').value.trim(),
        password: document.getElementById('r_password').value.trim(),
        password2: document.getElementById('r_password2').value.trim(),
        firstname: document.getElementById('r_firstname').value.trim(),
        lastname: document.getElementById('r_lastname').value.trim(),
        email: document.getElementById('r_email').value.trim()
      };

      // Componer name explícitamente para evitar rechazos de validación si el backend no lo arma
      if (!data.name) {
        const first = data.firstname || '';
        const last = data.lastname || '';
        const full = `${first} ${last}`.trim();
        if (full.length >= 2) data.name = full;
      }

      // Validación frontend básica si ValidationUtils no está disponible
      if (!window.ValidationUtils) {
        if (!data.firstname || data.firstname.length < 2) {
          showError('El nombre debe tener al menos 2 caracteres');
          return;
        }
        if (!data.lastname || data.lastname.length < 2) {
          showError('El apellido debe tener al menos 2 caracteres');
          return;
        }
        if (!data.username || data.username.length < 3) {
          showError('El usuario debe tener al menos 3 caracteres');
          return;
        }
        if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
          showError('Ingresa un correo electrónico válido');
          return;
        }
        if (!data.password || data.password.length < 6) {
          showError('La contraseña debe tener al menos 6 caracteres');
          return;
        }
        if (data.password !== data.password2) {
          showError('Las contraseñas no coinciden');
          return;
        }
      }

      try {
        // Mostrar indicador de carga
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Registrando...';

        const res = await window.Auth.register(data);

        // Restaurar botón
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;

        if (!res.ok) throw new Error(res.msg || 'Error en el registro');
        
        // Registro exitoso
        showSuccess('¡Registro exitoso! Redirigiendo...');
        
        // Auto-login: redirigir a home en lugar de login
        setTimeout(() => {
          location.href = '/';
        }, 1500);

      } catch (err) {
        // Manejar errores del servidor (400, 409, etc.)
        const errorMsg = err.message || 'Error en el registro';
        showError(errorMsg);
        
        // Restaurar botón en caso de error
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Registrarte';
      }
    });
  });
})();
