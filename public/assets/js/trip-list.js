const tripListContainer = document.getElementById("trip-list");

// Helpers para modo offline/local (sin API)
function getLocalTrips() {
  try {
    return JSON.parse(localStorage.getItem('trips')) || [];
  } catch (e) {
    return [];
  }
}

function saveLocalTrips(trips) {
  localStorage.setItem('trips', JSON.stringify(trips));
}

async function loadTrips() {
  tripListContainer.innerHTML = '<div class="empty-message">Cargando viajes...</div>';

  try {
    const response = await fetch('/api/trips/1/50');

    // Si la API está disponible y responde OK, usarla
    if (response.ok) {
      const data = await response.json();
      renderTrips(data.items || []);
      return;
    }

    // Si la API devuelve 401 o 403, indicar necesidad de login
    if (response.status === 401 || response.status === 403) {
      tripListContainer.innerHTML = '<div class="empty-message">Debes iniciar sesión para ver tus viajes.</div>';
      return;
    }

    // Si la API responde pero no está OK (p. ej. requiere API_KEY o devuelve 500), caemos al modo local
    console.warn('API trips no disponible, usando modo local. Código:', response.status);
  } catch (err) {
    // Error de red -> modo local
    console.warn('Error conectando a API trips, usando modo local:', err.message);
  }

  // Modo local: cargar desde localStorage
  const local = getLocalTrips();
  if (local.length === 0) {
    tripListContainer.innerHTML = '<div class="empty-message">No tienes viajes planificados aún (modo local).</div>';
  } else {
    renderTrips(local);
  }
}

function renderTrips(trips) {
  tripListContainer.innerHTML = "";

  if (trips.length === 0) {
    tripListContainer.innerHTML = '<div class="empty-message">No tienes viajes planificados aún.</div>';
    return;
  }

  trips.forEach(trip => {
    const card = document.createElement("div");
    card.classList.add("card");
    
    const startDate = new Date(trip.startDate).toLocaleDateString('es-ES');
    const endDate = new Date(trip.endDate).toLocaleDateString('es-ES');
    
    card.innerHTML = `
      <div class="card-header">
        <div>
          <div class="card-title">${escapeHtml(trip.title)}</div>
          <div class="card-destination">📍 ${escapeHtml(trip.destination)}</div>
          <div class="card-dates">📅 ${startDate} - ${endDate}</div>
        </div>
        <button class="delete-btn" onclick="deleteTrip('${trip._id}')">🗑️</button>
      </div>
      <div class="card-content">
        ${trip.budget ? `<div class="badge">💰 $${trip.budget.toLocaleString()}</div>` : ""}
        ${trip.description ? `<p class="card-description">${escapeHtml(trip.description)}</p>` : ""}
      </div>
    `;
    tripListContainer.appendChild(card);
  });
}

async function deleteTrip(id) {
  if (!confirm('¿Estás seguro de que deseas eliminar este viaje?')) {
    return;
  }
  try {
    const response = await fetch(`/api/trips/${id}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      alert('Viaje eliminado correctamente.');
      loadTrips();
      updateTripSelectorsAfterDelete();
      return;
    }

    // Si la API no está disponible o devuelve error, eliminar en localStorage
    console.warn('No se pudo eliminar en la API, eliminando localmente. Código:', response.status);
    const trips = getLocalTrips().filter(t => t._id !== id);
    saveLocalTrips(trips);
    alert('Viaje eliminado (modo local).');
    loadTrips();
    updateTripSelectorsAfterDelete();
  } catch (err) {
    console.warn('Error conectando a la API, eliminando localmente:', err.message);
    const trips = getLocalTrips().filter(t => t._id !== id);
    saveLocalTrips(trips);
    alert('Viaje eliminado (modo local).');
    loadTrips();
    updateTripSelectorsAfterDelete();
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Función para actualizar selectores de viajes después de eliminar
function updateTripSelectorsAfterDelete() {
  const selectors = document.querySelectorAll('#itTripSelect, select[name="trip"]');
  
  selectors.forEach(async (select) => {
    if (window.app && window.app.populateTripSelect) {
      await window.app.populateTripSelect(select.id || select.name);
    }
  });
}

// Cargar viajes al cargar la página
document.addEventListener("DOMContentLoaded", loadTrips);
