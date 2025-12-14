(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('destForm');
    const search = document.getElementById('searchDest');
    const listEl = document.getElementById('destList');

    // Configurar validaciones del formulario
    const fieldRules = {
      name: { required: true, minLength: 2, maxLength: 100 },
      country: { required: true, minLength: 2, maxLength: 50 },
      description: { required: true, minLength: 10, maxLength: 1000 },
      lat: { number: true },
      lng: { number: true },
      img: { url: true }
    };

    // Configurar validación en tiempo real
    if (window.ValidationUtils) {
      window.ValidationUtils.setupRealTimeValidation(form, fieldRules);
    }

    // Renderizar destinos iniciales
    renderDestinations();

    // Habilitar autocompletado con Mapbox si está disponible
    try {
      if (globalThis.MapboxAutocomplete && typeof MapboxAutocomplete.wire === 'function') {
        MapboxAutocomplete.wire('destName', 'destNameList', (feature, meta) => {
          try {
            const placeName = feature.place_name || '';
            const parts = placeName.split(',').map(s => s.trim()).filter(Boolean);
            const city = parts[0] || '';
            const country = (meta && meta.country) ? meta.country : (parts.length > 1 ? parts[parts.length - 1] : '');
            document.getElementById('destName').value = city;
            if (document.getElementById('destCountry')) document.getElementById('destCountry').value = country;
            if (Array.isArray(feature.center) && feature.center.length >= 2) {
              const lon = feature.center[0];
              const lat = feature.center[1];
              const latEl = document.getElementById('destLat');
              const lngEl = document.getElementById('destLng');
              if (latEl) latEl.value = String(lat);
              if (lngEl) lngEl.value = String(lon);
            }
            // Intentar obtener imagen automática si img está vacío
            const imgEl = document.getElementById('destImg');
            if (imgEl && !imgEl.value && globalThis.PlaceImage) {
              PlaceImage.imageForPlace(city, country).then(url => { if (url) imgEl.value = url; }).catch(()=>{});
            }
            
            // Limpiar errores de validación al seleccionar desde autocomplete
            if (window.ValidationUtils) {
              [document.getElementById('destName'), document.getElementById('destCountry')].forEach(el => {
                if (el) {
                  el.classList.remove('invalid');
                  const errorSpan = el.parentNode.querySelector('.field-error');
                  if (errorSpan) errorSpan.remove();
                }
              });
            }
          } catch (e) { console.warn('Mapbox select failed in destinations:', e); }
        });
      }
    } catch (e) { /* silencioso */ }

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
      
      const id = document.getElementById('destId').value || null;
      const dest = {
        name: document.getElementById('destName').value.trim(),
        country: document.getElementById('destCountry').value.trim(),
        description: normalizeDescription(document.getElementById('destDesc').value),
        lat: document.getElementById('destLat').value ? parseFloat(document.getElementById('destLat').value) : null,
        lng: document.getElementById('destLng').value ? parseFloat(document.getElementById('destLng').value) : null,
        img: document.getElementById('destImg').value.trim() || null
      };

      // Validaciones básicas si ValidationUtils no está disponible
      if (!window.ValidationUtils) {
        if (!dest.name || dest.name.length < 2) {
          alert('El nombre es obligatorio y debe tener al menos 2 caracteres.');
          document.getElementById('destName')?.focus();
          return;
        }
        if (!dest.country || dest.country.length < 2) {
          alert('El país es obligatorio y debe tener al menos 2 caracteres.');
          document.getElementById('destCountry')?.focus();
          return;
        }
        if (!dest.description || dest.description.length < 10) {
          alert('La descripción es obligatoria y debe tener al menos 10 caracteres.');
          document.getElementById('destDesc')?.focus();
          return;
        }
        if (dest.lat !== null && (isNaN(dest.lat) || dest.lat < -90 || dest.lat > 90)) {
          alert('La latitud debe ser un número entre -90 y 90.');
          document.getElementById('destLat')?.focus();
          return;
        }
        if (dest.lng !== null && (isNaN(dest.lng) || dest.lng < -180 || dest.lng > 180)) {
          alert('La longitud debe ser un número entre -180 y 180.');
          document.getElementById('destLng')?.focus();
          return;
        }
        if (dest.img) {
          try {
            new URL(dest.img);
          } catch {
            alert('La URL de la imagen no es válida.');
            document.getElementById('destImg')?.focus();
            return;
          }
        }
      }

      try {
        // Mostrar indicador de carga
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Guardando...';
        if (id) {
          // Actualizar
          await window.DestinationsAPI.update(id, dest);
          if (window.ValidationUtils) {
            window.ValidationUtils.showSuccess('Destino actualizado exitosamente');
          } else {
            alert('Destino actualizado');
          }
        } else {
          // Crear
          await window.DestinationsAPI.create(dest);
          if (window.ValidationUtils) {
            window.ValidationUtils.showSuccess('Destino creado exitosamente');
          } else {
            alert('Destino creado');
          }
        }
        
        // Restaurar botón
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        
        form.reset();
        document.getElementById('destId').value = '';
        renderDestinations();
      } catch (err) {
        // Restaurar botón en caso de error
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Guardar';
        
        if (window.ValidationUtils) {
          window.ValidationUtils.showError(err.message || 'Error al guardar destino');
        } else {
          alert(err.message || 'Error al guardar destino');
        }
      }
    });

    search.addEventListener('input', (e) => {
      renderDestinations(e.target.value);
    });

    async function renderDestinations(filter = '') {
      if (!listEl) return;
      
      listEl.innerHTML = '<li>Cargando...</li>';
      
      try {
        const res = await window.DestinationsAPI.list(1, 100, filter);
        const destinations = res.items || [];
        
        listEl.innerHTML = '';
        
        if (destinations.length === 0) {
          listEl.innerHTML = '<li>No hay destinos registrados</li>';
          return;
        }

        for (const d of destinations) {
          const li = document.createElement('li');
          li.className = 'destination-card';
          
          // Contenedor principal
          const mainDiv = document.createElement('div');
          mainDiv.innerHTML = `
            <strong>${d.name || ''}</strong> <small>${d.country || ''}</small><br>
            <small>${formatDescription(d.description || '')}</small>
            ${d.lat && d.lng ? `<br><small>📍 ${d.lat}, ${d.lng}</small>` : ''}
          `;
          
          // Contenedor de calificación (se llenará async)
          const ratingDiv = document.createElement('div');
          ratingDiv.className = 'destination-rating';
          ratingDiv.innerHTML = '<span class="loading-spinner">Cargando calificaciones...</span>';
          mainDiv.appendChild(ratingDiv);
          
          // Cargar estadísticas de calificación
          if (window.RatesAPI && window.RatingUI) {
            window.RatesAPI.getDestinationStats(d._id)
              .then(stats => {
                ratingDiv.innerHTML = '';
                // Usar el nuevo badge de estadísticas
                const statsBadge = window.RatingUI.renderStatsBadge(stats.averageRating, stats.totalRatings);
                ratingDiv.appendChild(statsBadge);
              })
              .catch(() => {
                ratingDiv.innerHTML = '<span class="no-ratings">Sin calificaciones aún</span>';
              });
          } else {
            ratingDiv.innerHTML = '';
          }
          
          li.appendChild(mainDiv);
          
          // Botones de acción
          const actionsDiv = document.createElement('div');
          actionsDiv.className = 'destination-actions';
          actionsDiv.innerHTML = `
            <button class="btn btn-rate rateDest" data-id="${d._id}" data-name="${escapeAttr(d.name || '')}">⭐ Calificar</button>
            <button class="editDest" data-id="${d._id}">Editar</button>
            <button class="delDest" data-id="${d._id}">Eliminar</button>
          `;
          li.appendChild(actionsDiv);
          
          listEl.appendChild(li);
        }
        
        // Bind evento de calificar
        if (window.RatesAPI && window.RatingUI) {
          listEl.querySelectorAll('.rateDest').forEach(btn => {
            btn.addEventListener('click', async (e) => {
              const destId = e.target.dataset.id;
              const destName = e.target.dataset.name;
              const destCard = e.target.closest('.destination-card');
              
              try {
                // Obtener calificación actual del usuario si existe
                const currentRate = await window.RatesAPI.getMyRate(destId);
                
                // Mostrar modal
                const result = await window.RatingUI.showRatingModal(destId, destName, currentRate);
                
                if (result) {
                  await window.RatesAPI.rateDestination(destId, result.rating, result.favorite, result.comment);
                  if (window.ValidationUtils) {
                    window.ValidationUtils.showSuccess('Calificación guardada exitosamente');
                  } else {
                    alert('Calificación guardada');
                  }
                  
                  // Actualizar solo las estadísticas de este destino sin recargar toda la lista
                  const ratingDiv = destCard.querySelector('.destination-rating');
                  if (ratingDiv) {
                    ratingDiv.innerHTML = '<span class="loading-spinner">Actualizando...</span>';
                    try {
                      const stats = await window.RatesAPI.getDestinationStats(destId);
                      ratingDiv.innerHTML = '';
                      // Usar el nuevo badge de estadísticas
                      const statsBadge = window.RatingUI.renderStatsBadge(stats.averageRating, stats.totalRatings);
                      ratingDiv.appendChild(statsBadge);
                    } catch (statErr) {
                      console.error('Error updating stats:', statErr);
                      ratingDiv.innerHTML = '<span class="no-ratings">Error al cargar</span>';
                    }
                  }
                }
              } catch (err) {
                if (window.ValidationUtils) {
                  window.ValidationUtils.showError(err.message || 'Error al guardar calificación');
                } else {
                  alert(err.message || 'Error al guardar calificación');
                }
              }
            });
          });
        }

        // Bind eventos de editar y eliminar
        listEl.querySelectorAll('.delDest').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            const id = e.target.dataset.id;
            if (!confirm('¿Eliminar este destino?')) return;
            try {
              await window.DestinationsAPI.delete(id);
              if (window.ValidationUtils) {
                window.ValidationUtils.showSuccess('Destino eliminado exitosamente');
              } else {
                alert('Destino eliminado');
              }
              renderDestinations(filter);
            } catch (err) {
              if (window.ValidationUtils) {
                window.ValidationUtils.showError(err.message || 'Error al eliminar destino');
              } else {
                alert(err.message || 'Error al eliminar');
              }
            }
          });
        });

        listEl.querySelectorAll('.editDest').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            const id = e.target.dataset.id;
            try {
              const res = await window.DestinationsAPI.get(id);
              const d = res.destination;
              
              document.getElementById('destId').value = d._id;
              document.getElementById('destName').value = d.name || '';
              document.getElementById('destCountry').value = d.country || '';
              document.getElementById('destDesc').value = d.description || '';
              document.getElementById('destLat').value = d.lat || '';
              document.getElementById('destLng').value = d.lng || '';
              document.getElementById('destImg').value = d.img || '';
              
              window.scrollTo(0, 0);
            } catch (err) {
              if (window.ValidationUtils) {
                window.ValidationUtils.showError(err.message || 'Error al cargar destino');
              } else {
                alert(err.message || 'Error al cargar destino');
              }
            }
          });
        });
      } catch (err) {
        listEl.innerHTML = `<li>Error: ${err.message || 'No se pudieron cargar los destinos'}</li>`;
      }
    }
  });

  // Helpers
  function normalizeDescription(text){
    const raw = (text || '').replace(/\r\n?/g, '\n');
    // collapse multiple blank lines, trim ends but keep one trailing newline removed
    let cleaned = raw.split('\n').map(l => l.trimEnd()).join('\n');
    cleaned = cleaned.trim();
    return cleaned;
  }

  function formatDescription(text){
    if (!text) return '';
    // Replace newlines with <br> for display, escape basic entities
    const esc = text
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;');
    return esc.replace(/\n+/g,'<br>');
  }
  
  function escapeAttr(text) {
    return (text || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
})();
