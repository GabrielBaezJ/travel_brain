// public/assets/js/favorites.js
(function() {
  document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('favoritesContainer');
    
    if (!window.RatesAPI || !window.RatingUI || !window.DestinationsAPI) {
      container.innerHTML = '<p style="color: red;">Error: APIs no disponibles</p>';
      return;
    }
    
    await loadFavorites();
    
    async function loadFavorites() {
      try {
        // Obtener todos los favoritos del usuario
        const favorites = await window.RatesAPI.getMyFavorites();
        
        if (!favorites || favorites.length === 0) {
          container.innerHTML = `
            <div class="favorites-empty">
              <div class="favorites-empty-icon">💔</div>
              <h3>No tienes destinos favoritos</h3>
              <p>Marca tus destinos favoritos para verlos aquí.</p>
              <a href="/destinations" class="btn btn-primary" style="margin-top: 16px; display: inline-block;">
                Explorar Destinos
              </a>
            </div>
          `;
          return;
        }
        
        // Crear grid de favoritos
        const grid = document.createElement('div');
        grid.className = 'favorites-grid';
        
        // Renderizar cada favorito
        for (const rate of favorites) {
          try {
            // Obtener información completa del destino
            const destInfo = await window.DestinationsAPI.get(rate.destinationId);
            const destination = destInfo.destination;
            
            const card = document.createElement('div');
            card.className = 'destination-card';
            card.style.border = '1px solid #e0e0e0';
            card.style.borderRadius = '8px';
            card.style.padding = '16px';
            card.style.position = 'relative';
            
            // Badge de favorito
            const favBadge = document.createElement('div');
            favBadge.className = 'favorite-badge';
            favBadge.innerHTML = '❤️';
            card.appendChild(favBadge);
            
            // Imagen si existe
            if (destination.img) {
              const img = document.createElement('img');
              img.src = destination.img;
              img.alt = destination.name;
              img.style.width = '100%';
              img.style.height = '200px';
              img.style.objectFit = 'cover';
              img.style.borderRadius = '4px';
              img.style.marginBottom = '12px';
              card.appendChild(img);
            }
            
            // Información del destino
            const info = document.createElement('div');
            info.innerHTML = `
              <h3 style="margin: 0 0 8px 0;">${window.DomUtils?.escapeHtml(destination.name) || destination.name}</h3>
              <p style="margin: 0 0 8px 0; color: #666;">
                📍 ${window.DomUtils?.escapeHtml(destination.country) || destination.country}
              </p>
              <p style="margin: 0 0 12px 0; font-size: 14px; color: #444;">
                ${window.DomUtils?.escapeHtml(destination.description?.substring(0, 100)) || destination.description?.substring(0, 100) || ''}...
              </p>
            `;
            card.appendChild(info);
            
            // Calificación del usuario
            const userRating = document.createElement('div');
            userRating.className = 'destination-rating';
            userRating.style.marginBottom = '12px';
            
            const label = document.createElement('strong');
            label.textContent = 'Tu calificación: ';
            userRating.appendChild(label);
            
            const stars = window.RatingUI.renderStars(rate.rating);
            userRating.appendChild(stars);
            
            card.appendChild(userRating);
            
            // Comentario si existe
            if (rate.comment) {
              const comment = document.createElement('div');
              comment.style.marginBottom = '12px';
              comment.style.padding = '8px';
              comment.style.backgroundColor = '#f5f5f5';
              comment.style.borderRadius = '4px';
              comment.style.fontSize = '14px';
              comment.innerHTML = `
                <strong>Tu comentario:</strong><br>
                ${window.DomUtils?.escapeHtml(rate.comment) || rate.comment}
              `;
              card.appendChild(comment);
            }
            
            // Obtener estadísticas del destino
            const stats = await window.RatesAPI.getDestinationStats(rate.destinationId);
            if (stats.totalRatings > 0) {
              const avgRating = document.createElement('div');
              avgRating.style.fontSize = '13px';
              avgRating.style.color = '#666';
              avgRating.style.marginBottom = '12px';
              avgRating.textContent = `Calificación promedio: ${window.RatingUI.formatRating(stats.averageRating, stats.totalRatings)}`;
              card.appendChild(avgRating);
            }
            
            // Botones de acción
            const actions = document.createElement('div');
            actions.className = 'destination-actions';
            actions.style.display = 'flex';
            actions.style.gap = '8px';
            actions.style.marginTop = '12px';
            
            const updateBtn = document.createElement('button');
            updateBtn.className = 'btn btn-primary';
            updateBtn.textContent = '✏️ Editar Calificación';
            updateBtn.addEventListener('click', async () => {
              try {
                const result = await window.RatingUI.showRatingModal(
                  rate.destinationId,
                  destination.name,
                  rate
                );
                
                if (result) {
                  await window.RatesAPI.rateDestination(
                    rate.destinationId,
                    result.rating,
                    result.favorite,
                    result.comment
                  );
                  
                  if (window.ValidationUtils) {
                    window.ValidationUtils.showSuccess('Calificación actualizada');
                  } else {
                    alert('Calificación actualizada');
                  }
                  
                  // Recargar favoritos
                  loadFavorites();
                }
              } catch (err) {
                if (window.ValidationUtils) {
                  window.ValidationUtils.showError(err.message || 'Error al actualizar');
                } else {
                  alert(err.message || 'Error al actualizar');
                }
              }
            });
            actions.appendChild(updateBtn);
            
            const removeBtn = document.createElement('button');
            removeBtn.className = 'btn btn-secondary';
            removeBtn.textContent = '💔 Quitar Favorito';
            removeBtn.addEventListener('click', async () => {
              if (!confirm('¿Quitar este destino de favoritos?')) return;
              
              try {
                await window.RatesAPI.toggleFavorite(rate.destinationId);
                
                if (window.ValidationUtils) {
                  window.ValidationUtils.showSuccess('Removido de favoritos');
                } else {
                  alert('Removido de favoritos');
                }
                
                // Recargar favoritos
                loadFavorites();
              } catch (err) {
                if (window.ValidationUtils) {
                  window.ValidationUtils.showError(err.message || 'Error al remover');
                } else {
                  alert(err.message || 'Error al remover');
                }
              }
            });
            actions.appendChild(removeBtn);
            
            card.appendChild(actions);
            grid.appendChild(card);
            
          } catch (err) {
            console.error('Error loading favorite destination:', err);
          }
        }
        
        container.innerHTML = '';
        container.appendChild(grid);
        
      } catch (err) {
        console.error('Error loading favorites:', err);
        container.innerHTML = `
          <div style="color: red; padding: 20px; text-align: center;">
            <p>Error al cargar favoritos: ${err.message || 'Error desconocido'}</p>
            <button onclick="location.reload()" class="btn btn-primary">
              Reintentar
            </button>
          </div>
        `;
      }
    }
  });
})();
