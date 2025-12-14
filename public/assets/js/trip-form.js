const form = document.getElementById("tripForm");
const message = document.getElementById("message");
const submitBtn = document.getElementById("submitBtn");

// Configurar validaciones del formulario
const fieldRules = {
  title: { required: true, minLength: 2, maxLength: 100 },
  destination: { required: true, minLength: 2, maxLength: 100 },
  start_date: { required: true, date: true, futureDate: true },
  end_date: { required: true, date: true },
  budget: { positiveNumber: true },
  description: { maxLength: 500 },
  _dateRange: { start: 'start_date', end: 'end_date' }
};

// Configurar validación en tiempo real cuando esté disponible
document.addEventListener('DOMContentLoaded', () => {
  if (window.ValidationUtils) {
    window.ValidationUtils.setupRealTimeValidation(form, fieldRules);
  }
});

// Wire Mapbox autocomplete to destination input (if available)
try {
  if (globalThis.MapboxAutocomplete && typeof MapboxAutocomplete.wire === 'function') {
    MapboxAutocomplete.wire('destination', 'destinationList', (feature, meta) => {
      try {
        const placeName = feature.place_name || '';
        const parts = placeName.split(',').map(s => s.trim()).filter(Boolean);
        const city = parts[0] || '';
        const country = (meta && meta.country) ? meta.country : (parts.length > 1 ? parts[parts.length - 1] : '');
        const destEl = document.getElementById('destination');
        if (destEl) {
          destEl.value = city + (country ? ', ' + country : '');
          // Limpiar error de validación al seleccionar desde autocomplete
          if (window.ValidationUtils) {
            destEl.classList.remove('invalid');
            const errorSpan = destEl.parentNode.querySelector('.field-error');
            if (errorSpan) errorSpan.remove();
          }
        }
      } catch (e) { console.warn('Mapbox select failed in trip-form:', e); }
    });
  }
} catch (e) { /* silent */ }

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Validar formulario antes de enviar
  if (window.ValidationUtils) {
    const isValid = window.ValidationUtils.validateForm(form, fieldRules);
    if (!isValid) {
      window.ValidationUtils.showError('Por favor, corrige los errores en el formulario');
      return;
    }
  }

  const title = document.getElementById("title").value;
  const destination = document.getElementById("destination").value;
  const start_date = document.getElementById("start_date").value;
  const end_date = document.getElementById("end_date").value;
  const budget = document.getElementById("budget").value;
  const description = document.getElementById("description").value;

  // Validación básica si ValidationUtils no está disponible
  if (!window.ValidationUtils) {
    if (!title || title.trim().length < 2) {
      showMessage('El nombre del viaje es obligatorio (mín. 2 caracteres)', 'error');
      return;
    }
    if (!destination || destination.trim().length < 2) {
      showMessage('El destino es obligatorio (mín. 2 caracteres)', 'error');
      return;
    }
    if (!start_date) {
      showMessage('La fecha de inicio es obligatoria', 'error');
      return;
    }
    if (!end_date) {
      showMessage('La fecha de fin es obligatoria', 'error');
      return;
    }
    if (new Date(start_date) > new Date(end_date)) {
      showMessage('La fecha de fin debe ser posterior a la de inicio', 'error');
      return;
    }
    if (budget && (isNaN(parseFloat(budget)) || parseFloat(budget) < 0)) {
      showMessage('El presupuesto debe ser un número positivo', 'error');
      return;
    }
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Creando...";

  try {
    const response = await fetch('/api/trips', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        title,
        destination,
        start_date,
        end_date,
        budget: budget ? parseFloat(budget) : null,
        description: description || null
      })
    });

    const data = await response.json();

    if (!response.ok) {
      // Si la API rechaza, usamos modo local (mostrar mensaje real si viene en 'msg')
      const serverMsg = (data && (data.msg || data.error)) ? (data.msg || data.error) : '';
      console.warn('API trips no disponible o denegada, guardando localmente:', serverMsg || response.status);
      saveLocalTrip({
        _id: Date.now().toString(),
        title,
        destination,
        startDate: start_date,
        endDate: end_date,
        budget: budget ? parseFloat(budget) : null,
        description: description || ''
      });
  showMessage('Guardado en modo local (sin API): ' + (serverMsg || 'Operación local'), 'success');
    } else {
      showMessage("¡Viaje creado exitosamente!", "success");
      form.reset();
      
      // Recargar la lista de viajes si existe
      if (typeof loadTrips === 'function') {
        setTimeout(() => loadTrips(), 500);
      }
      
      // Actualizar selectores de viajes en otras páginas
      updateTripSelectors();
    }
  } catch (err) {
    // Error de red: fallback a localStorage
    console.warn('Error conectando a la API, guardando en modo local:', err.message);
    saveLocalTrip({
      _id: Date.now().toString(),
      title,
      destination,
      startDate: start_date,
      endDate: end_date,
      budget: budget ? parseFloat(budget) : null,
      description: description || ''
    });
    showMessage('Guardado en modo local (sin conexión): ' + err.message, 'success');
    // Actualizar selectores de viajes
    updateTripSelectors();
  }

  resetButton();
});

function showMessage(text, type) {
  // Usar Toastify si está disponible
  if (window.ValidationUtils) {
    if (type === 'success') {
      window.ValidationUtils.showSuccess(text);
    } else if (type === 'error') {
      window.ValidationUtils.showError(text);
    } else {
      window.ValidationUtils.showInfo(text);
    }
  } else {
    // Fallback al método anterior
    message.textContent = text;
    message.className = type;
  }
}

function resetButton() {
  submitBtn.disabled = false;
  submitBtn.textContent = "Crear Viaje";
}

// Local storage helper para fallback
function saveLocalTrip(trip) {
  try {
    const all = JSON.parse(localStorage.getItem('trips')) || [];
    all.unshift(trip);
    localStorage.setItem('trips', JSON.stringify(all));
    // Si la lista está cargada, recargar
    if (typeof loadTrips === 'function') {
      setTimeout(() => loadTrips(), 300);
    }
  } catch (e) {
    console.error('No se pudo guardar el viaje localmente:', e.message);
  }
}

// Función para actualizar selectores de viajes en otras páginas
function updateTripSelectors() {
  // Buscar selectores de viajes en la página actual
  const selectors = document.querySelectorAll('#itTripSelect, select[name="trip"]');
  
  selectors.forEach(async (select) => {
    if (window.app && window.app.populateTripSelect) {
      await window.app.populateTripSelect(select.id || select.name);
    }
  });
}
