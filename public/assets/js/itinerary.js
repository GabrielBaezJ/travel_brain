// public/assets/js/itinerary.js
(function () {
  let selectedTrip = null; // Guardar el viaje seleccionado completo
  
  document.addEventListener('DOMContentLoaded', async () => {
    // Poblado de viajes disponibles
    if (window.app?.populateTripSelect) {
      await window.app.populateTripSelect('itTripSelect');
    }

    const genBtn = document.getElementById('genItBtn');
    const saveBtn = document.getElementById('saveItBtn');
    const exportBtn = document.getElementById('exportItBtn');
    const view = document.getElementById('itineraryView');
    const tripSelect = document.getElementById('itTripSelect');
    const tripInfoBox = document.getElementById('tripInfoBox');
    const tripInfo = document.getElementById('tripInfo');
    const daysInput = document.getElementById('itDays');
    
    // Auto-completar información al seleccionar viaje
    tripSelect.addEventListener('change', async (e) => {
      const tripId = e.target.value;
      
      if (!tripId) {
        tripInfoBox.style.display = 'none';
        daysInput.value = 3;
        selectedTrip = null;
        return;
      }
      
      try {
        // Obtener información completa del viaje
        const response = await fetch(`/api/trips/${tripId}`, {
          credentials: 'include'
        });
        
        if (!response.ok) throw new Error('No se pudo cargar el viaje');
        
        const data = await response.json();
        selectedTrip = data.trip;
        
        // Calcular días automáticamente
        const startDate = new Date(selectedTrip.startDate);
        const endDate = new Date(selectedTrip.endDate);
        const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
        
        // Auto-llenar días
        daysInput.value = days;
        
        // Mostrar información del viaje
        tripInfo.innerHTML = `
          <div style="display: grid; gap: 8px;">
            <p style="margin: 0;"><strong>📍 Destino:</strong> ${selectedTrip.destination}</p>
            <p style="margin: 0;"><strong>📅 Inicio:</strong> ${startDate.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p style="margin: 0;"><strong>📅 Fin:</strong> ${endDate.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p style="margin: 0;"><strong>⏱️ Duración:</strong> ${days} ${days === 1 ? 'día' : 'días'}</p>
            ${selectedTrip.budget ? `<p style="margin: 0;"><strong>💰 Presupuesto:</strong> $${selectedTrip.budget.toFixed(2)}</p>` : ''}
            ${selectedTrip.description ? `<p style="margin: 8px 0 0 0; color: #666;"><em>${selectedTrip.description}</em></p>` : ''}
          </div>
        `;
        
        tripInfoBox.style.display = 'block';
        
      } catch (error) {
        console.error('Error cargando información del viaje:', error);
        if (window.ValidationUtils) {
          window.ValidationUtils.showError('Error al cargar información del viaje');
        }
        tripInfoBox.style.display = 'none';
      }
    });

    // Configurar validaciones
    const fieldRules = {
      itTripSelect: { required: true },
      itDays: { required: true, number: true, positiveNumber: true }
    };

    if (window.ValidationUtils) {
      window.ValidationUtils.setupRealTimeValidation(document.body, fieldRules);
    }

    genBtn.addEventListener('click', async () => {
      const tripId = document.getElementById('itTripSelect').value;
      const days = parseInt(document.getElementById('itDays').value || '1', 10);
      const interests = document.getElementById('itInterests')?.value || 'cultura';
      const budgetStyle = document.getElementById('itBudgetStyle')?.value || 'medio';
      
      // Validaciones
      if (!tripId) {
        if (window.ValidationUtils) {
          window.ValidationUtils.showError('Por favor, selecciona un viaje');
          document.getElementById('itTripSelect').classList.add('invalid', 'shake');
          setTimeout(() => document.getElementById('itTripSelect').classList.remove('shake'), 500);
        } else {
          alert('Selecciona un viaje');
        }
        document.getElementById('itTripSelect').focus();
        return;
      }

      if (!days || isNaN(days) || days < 1 || days > 30) {
        if (window.ValidationUtils) {
          window.ValidationUtils.showError('Los días deben ser un número entre 1 y 30');
          document.getElementById('itDays').classList.add('invalid', 'shake');
          setTimeout(() => document.getElementById('itDays').classList.remove('shake'), 500);
        } else {
          alert('Los días deben ser un número entre 1 y 30');
        }
        document.getElementById('itDays').focus();
        return;
      }

      // Limpiar errores de validación
      document.getElementById('itTripSelect').classList.remove('invalid');
      document.getElementById('itDays').classList.remove('invalid');

      // Mostrar indicador de carga
      view.innerHTML = '<div class="loading"><p>🤖 Generando itinerario inteligente...</p><p><em>Esto puede tomar unos segundos</em></p></div>';

      // Deshabilitar botón durante la generación
      const originalText = genBtn.textContent;
      genBtn.disabled = true;
      genBtn.textContent = 'Generando...';

      try {
        const it = window.app?.generateItinerary
          ? await window.app.generateItinerary(tripId, days, interests, budgetStyle)
          : { html: '<p>No hay generador disponible.</p>', data: null };

        view.innerHTML = it.html;
        window.currentItinerary = it;
        saveBtn.style.display = 'inline-block';
        exportBtn.style.display = 'inline-block';
        
        // Mostrar mensaje de éxito
        if (window.ValidationUtils) {
          window.ValidationUtils.showSuccess('Itinerario generado exitosamente');
        }
        
      } catch (error) {
        console.error('Error generando itinerario:', error);
        view.innerHTML = '<div class="error"><p>❌ Error generando el itinerario</p><p>Inténtalo de nuevo en unos segundos.</p></div>';
        
        if (window.ValidationUtils) {
          window.ValidationUtils.showError('Error generando el itinerario. Inténtalo de nuevo.');
        }
      } finally {
        // Restaurar botón
        genBtn.disabled = false;
        genBtn.textContent = originalText;
      }
    });

    saveBtn.addEventListener('click', () => {
      if (!window.currentItinerary) {
        if (window.ValidationUtils) {
          window.ValidationUtils.showError('Genera un itinerario primero');
        } else {
          alert('Genera un itinerario primero');
        }
        return;
      }
      
      if (window.app?.saveItinerary) {
        window.app.saveItinerary(window.currentItinerary);
        if (window.ValidationUtils) {
          window.ValidationUtils.showSuccess('Itinerario guardado exitosamente');
        } else {
          alert('Itinerario guardado');
        }
      } else {
        if (window.ValidationUtils) {
          window.ValidationUtils.showError('Módulo de guardado no disponible');
        } else {
          alert('Módulo de guardado no disponible');
        }
      }
    });

    exportBtn.addEventListener('click', () => {
      // Ocultar elementos innecesarios antes de imprimir
      const header = document.querySelector('.site-header');
      const footer = document.querySelector('.site-footer');
      const formSection = document.querySelector('.card:first-of-type');
      
      if (header) header.style.display = 'none';
      if (footer) footer.style.display = 'none';
      if (formSection) formSection.style.display = 'none';
      
      // Agregar clase para estilos de impresión
      document.body.classList.add('printing');
      
      // Imprimir
      window.print();
      
      // Restaurar elementos después de imprimir
      setTimeout(() => {
        if (header) header.style.display = '';
        if (footer) footer.style.display = '';
        if (formSection) formSection.style.display = '';
        document.body.classList.remove('printing');
      }, 500);
    });
  });
})();
