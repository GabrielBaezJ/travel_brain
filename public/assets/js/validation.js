// public/assets/js/validation.js - Validaciones y notificaciones globales

// Configuración de Toastify
const ToastConfig = {
  success: {
    duration: 3000,
    gravity: "top",
    position: "right",
    backgroundColor: "linear-gradient(to right, #6bcf7f, #4ecdc4)",
    className: "toast-success"
  },
  error: {
    duration: 4000,
    gravity: "top", 
    position: "right",
    backgroundColor: "linear-gradient(to right, #ff4757, #ff6b6b)",
    className: "toast-error"
  },
  warning: {
    duration: 3500,
    gravity: "top",
    position: "right", 
    backgroundColor: "linear-gradient(to right, #ffd93d, #ff9ff3)",
    className: "toast-warning"
  },
  info: {
    duration: 3000,
    gravity: "top",
    position: "right",
    backgroundColor: "linear-gradient(to right, #4a90e2, #667eea)",
    className: "toast-info"
  }
};

// Funciones de notificación
function showToast(message, type = 'info') {
  if (!window.Toastify) {
    console.warn('Toastify no está disponible');
    alert(message);
    return;
  }
  
  const config = ToastConfig[type] || ToastConfig.info;
  Toastify({
    text: message,
    ...config
  }).showToast();
}

function showSuccess(message) {
  showToast(message, 'success');
}

function showError(message) {
  showToast(message, 'error');
}

function showWarning(message) {
  showToast(message, 'warning');
}

function showInfo(message) {
  showToast(message, 'info');
}

// Validaciones específicas
const Validators = {
  required: (value) => {
    return value && value.toString().trim().length > 0;
  },
  
  minLength: (value, minLen) => {
    return value && value.toString().trim().length >= minLen;
  },
  
  maxLength: (value, maxLen) => {
    return !value || value.toString().trim().length <= maxLen;
  },
  
  email: (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return !value || emailRegex.test(value.toString().trim());
  },
  
  username: (value) => {
    const usernameRegex = /^[A-Za-z0-9._\-]{3,20}$/;
    return !value || usernameRegex.test(value.toString().trim());
  },
  
  name: (value) => {
    const nameRegex = /^[A-Za-zÀ-ÿ'\-\s]{2,}$/;
    return !value || nameRegex.test(value.toString().trim());
  },
  
  password: (value) => {
    return !value || value.toString().length >= 6;
  },
  
  number: (value) => {
    return !value || !isNaN(parseFloat(value)) && isFinite(value);
  },
  
  positiveNumber: (value) => {
    return !value || (Validators.number(value) && parseFloat(value) >= 0);
  },
  
  url: (value) => {
    try {
      new URL(value.toString().trim());
      return true;
    } catch {
      return !value || value.toString().trim() === '';
    }
  },
  
  date: (value) => {
    return !value || !isNaN(Date.parse(value));
  },
  
  futureDate: (value) => {
    if (!value) return true;
    const inputDate = new Date(value);
    const today = new Date();
    today.setHours(0,0,0,0);
    return inputDate >= today;
  },
  
  dateRange: (startDate, endDate) => {
    if (!startDate || !endDate) return true;
    return new Date(startDate) <= new Date(endDate);
  }
};

// Mensajes de error en español
const ErrorMessages = {
  required: 'Este campo es obligatorio',
  minLength: (min) => `Debe tener al menos ${min} caracteres`,
  maxLength: (max) => `No puede tener más de ${max} caracteres`,
  email: 'Ingresa un correo electrónico válido',
  username: 'Usuario debe tener 3-20 caracteres (letras, números, punto, guion)',
  name: 'Solo letras, espacios y guiones. Mínimo 2 caracteres',
  password: 'La contraseña debe tener al menos 6 caracteres',
  passwordMatch: 'Las contraseñas no coinciden',
  number: 'Debe ser un número válido',
  positiveNumber: 'Debe ser un número positivo',
  url: 'Ingresa una URL válida',
  date: 'Ingresa una fecha válida',
  futureDate: 'La fecha debe ser futura',
  dateRange: 'La fecha de fin debe ser posterior a la de inicio'
};

// Función para validar un campo individual
function validateField(field, rules = {}) {
  const value = field.value;
  const fieldName = field.name || field.id || 'Campo';
  let isValid = true;
  let errorMessage = '';
  
  // Limpiar errores previos
  clearFieldError(field);
  
  // Validar required
  if (rules.required && !Validators.required(value)) {
    isValid = false;
    errorMessage = ErrorMessages.required;
  }
  
  // Solo validar otros campos si hay valor o es requerido
  if (value || rules.required) {
    // Validar minLength
    if (rules.minLength && !Validators.minLength(value, rules.minLength)) {
      isValid = false;
      errorMessage = ErrorMessages.minLength(rules.minLength);
    }
    
    // Validar maxLength
    if (rules.maxLength && !Validators.maxLength(value, rules.maxLength)) {
      isValid = false;
      errorMessage = ErrorMessages.maxLength(rules.maxLength);
    }
    
    // Validar email
    if (rules.email && !Validators.email(value)) {
      isValid = false;
      errorMessage = ErrorMessages.email;
    }
    
    // Validar username
    if (rules.username && !Validators.username(value)) {
      isValid = false;
      errorMessage = ErrorMessages.username;
    }
    
    // Validar name
    if (rules.name && !Validators.name(value)) {
      isValid = false;
      errorMessage = ErrorMessages.name;
    }
    
    // Validar password
    if (rules.password && !Validators.password(value)) {
      isValid = false;
      errorMessage = ErrorMessages.password;
    }
    
    // Validar number
    if (rules.number && !Validators.number(value)) {
      isValid = false;
      errorMessage = ErrorMessages.number;
    }
    
    // Validar positiveNumber
    if (rules.positiveNumber && !Validators.positiveNumber(value)) {
      isValid = false;
      errorMessage = ErrorMessages.positiveNumber;
    }
    
    // Validar URL
    if (rules.url && !Validators.url(value)) {
      isValid = false;
      errorMessage = ErrorMessages.url;
    }
    
    // Validar date
    if (rules.date && !Validators.date(value)) {
      isValid = false;
      errorMessage = ErrorMessages.date;
    }
    
    // Validar futureDate
    if (rules.futureDate && !Validators.futureDate(value)) {
      isValid = false;
      errorMessage = ErrorMessages.futureDate;
    }
  }
  
  // Aplicar estilos y mostrar errores
  if (isValid) {
    markFieldValid(field);
  } else {
    markFieldInvalid(field, errorMessage);
  }
  
  return isValid;
}

// Función para validar confirmación de contraseña
function validatePasswordMatch(passwordField, confirmField) {
  const isMatch = passwordField.value === confirmField.value;
  
  clearFieldError(confirmField);
  
  if (!isMatch && confirmField.value) {
    markFieldInvalid(confirmField, ErrorMessages.passwordMatch);
    return false;
  } else if (isMatch && confirmField.value) {
    markFieldValid(confirmField);
  }
  
  return isMatch;
}

// Función para validar rango de fechas
function validateDateRange(startField, endField) {
  if (!startField.value || !endField.value) return true;
  
  const isValidRange = Validators.dateRange(startField.value, endField.value);
  
  clearFieldError(endField);
  
  if (!isValidRange) {
    markFieldInvalid(endField, ErrorMessages.dateRange);
    return false;
  } else {
    markFieldValid(endField);
  }
  
  return isValidRange;
}

// Funciones auxiliares para manejo de estilos
function markFieldValid(field) {
  field.classList.remove('invalid', 'shake');
  field.classList.add('valid');
}

function markFieldInvalid(field, message) {
  field.classList.remove('valid');
  field.classList.add('invalid', 'shake');
  
  // Mostrar mensaje de error debajo del campo
  showFieldError(field, message);
  
  // Remover animación después de completarse
  setTimeout(() => {
    field.classList.remove('shake');
  }, 500);
}

function showFieldError(field, message) {
  // Buscar si ya existe un mensaje de error
  let errorSpan = field.parentNode.querySelector('.field-error');
  
  if (!errorSpan) {
    errorSpan = document.createElement('span');
    errorSpan.className = 'field-error';
    field.parentNode.appendChild(errorSpan);
  }
  
  errorSpan.textContent = message;
}

function clearFieldError(field) {
  const errorSpan = field.parentNode.querySelector('.field-error');
  if (errorSpan) {
    errorSpan.remove();
  }
  field.classList.remove('invalid', 'valid', 'shake');
}

// Función para validar todo un formulario
function validateForm(form, fieldRules = {}) {
  let isFormValid = true;
  const fields = form.querySelectorAll('input, textarea, select');
  
  fields.forEach(field => {
    const fieldName = field.name || field.id;
    const rules = fieldRules[fieldName] || {};
    
    // Solo validar campos visibles y habilitados
    if (field.offsetParent !== null && !field.disabled) {
      const isFieldValid = validateField(field, rules);
      if (!isFieldValid) {
        isFormValid = false;
      }
    }
  });
  
  // Validaciones especiales
  if (fieldRules._passwordMatch) {
    const { password, confirm } = fieldRules._passwordMatch;
    const passwordField = form.querySelector(`[name="${password}"], #${password}`);
    const confirmField = form.querySelector(`[name="${confirm}"], #${confirm}`);
    
    if (passwordField && confirmField) {
      const isMatch = validatePasswordMatch(passwordField, confirmField);
      if (!isMatch) isFormValid = false;
    }
  }
  
  if (fieldRules._dateRange) {
    const { start, end } = fieldRules._dateRange;
    const startField = form.querySelector(`[name="${start}"], #${start}`);
    const endField = form.querySelector(`[name="${end}"], #${end}`);
    
    if (startField && endField) {
      const isValidRange = validateDateRange(startField, endField);
      if (!isValidRange) isFormValid = false;
    }
  }
  
  return isFormValid;
}

// Función para configurar validación en tiempo real
function setupRealTimeValidation(form, fieldRules = {}) {
  const fields = form.querySelectorAll('input, textarea, select');
  
  fields.forEach(field => {
    const fieldName = field.name || field.id;
    const rules = fieldRules[fieldName] || {};
    
    // Validar al perder el foco
    field.addEventListener('blur', () => {
      validateField(field, rules);
    });
    
    // Limpiar errores al empezar a escribir
    field.addEventListener('input', () => {
      if (field.classList.contains('invalid')) {
        clearFieldError(field);
      }
    });
  });
  
  // Configurar validación de confirmación de contraseña
  if (fieldRules._passwordMatch) {
    const { password, confirm } = fieldRules._passwordMatch;
    const passwordField = form.querySelector(`[name="${password}"], #${password}`);
    const confirmField = form.querySelector(`[name="${confirm}"], #${confirm}`);
    
    if (passwordField && confirmField) {
      confirmField.addEventListener('blur', () => {
        validatePasswordMatch(passwordField, confirmField);
      });
      
      passwordField.addEventListener('input', () => {
        if (confirmField.value) {
          validatePasswordMatch(passwordField, confirmField);
        }
      });
    }
  }
  
  // Configurar validación de rango de fechas
  if (fieldRules._dateRange) {
    const { start, end } = fieldRules._dateRange;
    const startField = form.querySelector(`[name="${start}"], #${start}`);
    const endField = form.querySelector(`[name="${end}"], #${end}`);
    
    if (startField && endField) {
      [startField, endField].forEach(field => {
        field.addEventListener('blur', () => {
          validateDateRange(startField, endField);
        });
      });
    }
  }
}

// Exportar funciones globales
window.ValidationUtils = {
  showToast,
  showSuccess,
  showError,
  showWarning, 
  showInfo,
  validateField,
  validateForm,
  setupRealTimeValidation,
  validatePasswordMatch,
  validateDateRange,
  Validators,
  ErrorMessages
};