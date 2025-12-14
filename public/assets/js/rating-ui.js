// public/assets/js/rating-ui.js
(function() {
  /**
   * Renderiza estrellas de calificación
   * @param {number} rating - Calificación (1-5)
   * @param {boolean} interactive - Si las estrellas son clicables
   * @param {function} onChange - Callback cuando cambia la calificación
   */
  function renderStars(rating, interactive = false, onChange = null) {
    const container = document.createElement('div');
    container.className = 'rating-stars' + (interactive ? ' interactive' : '');
    
    // Guardar el rating seleccionado actual
    let currentRating = rating;
    
    for (let i = 1; i <= 5; i++) {
      const star = document.createElement('span');
      star.className = 'star' + (i <= rating ? ' filled' : '');
      star.innerHTML = i <= rating ? '★' : '☆';
      star.dataset.value = i;
      
      if (interactive) {
        star.style.cursor = 'pointer';
        star.addEventListener('click', () => {
          currentRating = i; // Actualizar rating actual
          updateStarDisplay(container, i);
          if (onChange) onChange(i);
        });
        
        star.addEventListener('mouseenter', () => {
          updateStarDisplay(container, i);
        });
      }
      
      container.appendChild(star);
    }
    
    if (interactive) {
      container.addEventListener('mouseleave', () => {
        // Volver al rating seleccionado, no al inicial
        updateStarDisplay(container, currentRating);
      });
    }
    
    return container;
  }

  /**
   * Actualiza el display de estrellas
   */
  function updateStarDisplay(container, rating) {
    const stars = container.querySelectorAll('.star');
    stars.forEach((star, index) => {
      const value = index + 1;
      if (value <= rating) {
        star.classList.add('filled');
        star.innerHTML = '★';
      } else {
        star.classList.remove('filled');
        star.innerHTML = '☆';
      }
    });
  }

  /**
   * Muestra modal para calificar destino
   */
  async function showRatingModal(destinationId, destinationName, currentRate = null) {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.className = 'modal-overlay';
      modal.innerHTML = `
        <div class="modal-content rating-modal">
          <button class="modal-close" id="closeRatingModal">&times;</button>
          <div class="modal-header">
            <h2>${DomUtils.escapeHtml(destinationName)}</h2>
            <p class="modal-subtitle">Comparte tu experiencia</p>
          </div>
          
          <div class="rating-section">
            <label>¿Cómo calificarías este destino?</label>
            <div id="ratingStarsContainer"></div>
            <input type="hidden" id="ratingValue" value="${currentRate?.rating || 0}">
            <p class="rating-hint" id="ratingHint">Selecciona una calificación</p>
          </div>
          
          <div class="form-group">
            <label for="ratingComment">
              <span>💭</span> Cuéntanos más (opcional)
            </label>
            <textarea id="ratingComment" maxlength="500" rows="4" placeholder="¿Qué te gustó? ¿Qué recomendarías? Comparte tus mejores consejos...">${currentRate?.comment || ''}</textarea>
            <small class="char-count"><span id="commentCharCount">0</span>/500</small>
          </div>
          
          <div class="favorite-section">
            <label class="favorite-checkbox">
              <input type="checkbox" id="ratingFavorite" ${currentRate?.favorite ? 'checked' : ''}>
              <span class="favorite-label">
                <span class="heart-icon">❤️</span>
                <span>Agregar a mis favoritos</span>
              </span>
            </label>
          </div>
          
          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" id="cancelRating">Cancelar</button>
            <button type="button" class="btn btn-primary" id="submitRating">
              <span>💾</span> Guardar calificación
            </button>
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      // Renderizar estrellas interactivas
      const starsContainer = document.getElementById('ratingStarsContainer');
      const ratingInput = document.getElementById('ratingValue');
      const ratingHint = document.getElementById('ratingHint');
      
      const ratingLabels = ['', 'Malo', 'Regular', 'Bueno', 'Muy bueno', 'Excelente'];
      
      const stars = renderStars(currentRate?.rating || 0, true, (value) => {
        ratingInput.value = value;
        ratingHint.textContent = ratingLabels[value] || 'Selecciona una calificación';
        ratingHint.style.color = value > 0 ? '#ffc107' : '#999';
        ratingHint.style.fontWeight = value > 0 ? '600' : 'normal';
      });
      starsContainer.appendChild(stars);
      
      // Inicializar hint si ya hay rating
      if (currentRate?.rating) {
        ratingHint.textContent = ratingLabels[currentRate.rating];
        ratingHint.style.color = '#ffc107';
        ratingHint.style.fontWeight = '600';
      }
      
      // Contador de caracteres
      const commentTextarea = document.getElementById('ratingComment');
      const charCount = document.getElementById('commentCharCount');
      commentTextarea.addEventListener('input', () => {
        charCount.textContent = commentTextarea.value.length;
      });
      charCount.textContent = commentTextarea.value.length;
      
      // Cerrar modal
      const closeModal = () => {
        modal.remove();
        resolve(null);
      };
      
      document.getElementById('closeRatingModal').addEventListener('click', closeModal);
      document.getElementById('cancelRating').addEventListener('click', closeModal);
      
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
      });
      
      // Enviar calificación
      document.getElementById('submitRating').addEventListener('click', () => {
        const rating = parseInt(ratingInput.value);
        const comment = commentTextarea.value.trim();
        const favorite = document.getElementById('ratingFavorite').checked;
        
        if (rating < 1 || rating > 5) {
          if (window.ValidationUtils) {
            window.ValidationUtils.showError('Por favor, selecciona una calificación de 1 a 5 estrellas');
          } else {
            alert('Por favor, selecciona una calificación');
          }
          return;
        }
        
        modal.remove();
        resolve({ rating, comment, favorite });
      });
    });
  }

  /**
   * Renderiza botón de favorito
   */
  function renderFavoriteButton(isFavorite, onClick) {
    const btn = document.createElement('button');
    btn.className = 'btn-favorite' + (isFavorite ? ' is-favorite' : '');
    btn.innerHTML = isFavorite ? '❤️' : '🤍';
    btn.title = isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos';
    btn.setAttribute('aria-label', isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos');
    
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (onClick) onClick();
    });
    
    return btn;
  }

  /**
   * Formatea el promedio de calificación
   */
  function formatRating(avgRating, totalRatings) {
    if (!totalRatings || totalRatings === 0) {
      return 'Sin calificaciones aún';
    }
    
    const avg = avgRating.toFixed(1);
    const plural = totalRatings === 1 ? 'persona' : 'personas';
    return `${avg} ★ (${totalRatings} ${plural})`;
  }

  /**
   * Renderiza un badge de estadísticas completo
   * @param {number} avgRating - Promedio de calificación
   * @param {number} totalRatings - Total de calificaciones
   * @returns {HTMLElement}
   */
  function renderStatsBadge(avgRating, totalRatings) {
    const container = document.createElement('div');
    container.className = 'stats-badge';
    
    if (!totalRatings || totalRatings === 0) {
      container.innerHTML = '<span class="no-ratings">Sin calificaciones aún</span>';
      return container;
    }
    
    const avg = avgRating.toFixed(1);
    const popularClass = totalRatings >= 3 ? 'popular' : '';
    
    container.innerHTML = `
      <div class="stats-rating ${popularClass}">
        <span class="stats-avg">${avg}</span>
        <span class="stats-star">★</span>
      </div>
      <div class="stats-count">${totalRatings} ${totalRatings === 1 ? 'reseña' : 'reseñas'}</div>
      ${totalRatings >= 3 ? '<span class="popular-badge"> Popular</span>' : ''}
    `;
    
    return container;
  }

  // Exponer funciones globalmente
  window.RatingUI = {
    renderStars,
    updateStarDisplay,
    showRatingModal,
    renderFavoriteButton,
    formatRating,
    renderStatsBadge
  };

  // Agregar estilos CSS si no existen
  if (!document.getElementById('rating-ui-styles')) {
    const style = document.createElement('style');
    style.id = 'rating-ui-styles';
    style.textContent = `
      .rating-stars {
        display: inline-flex;
        gap: 8px;
        font-size: 40px;
        line-height: 1;
        margin: 10px 0;
      }
      
      .rating-stars .star {
        color: #e0e0e0;
        transition: all 0.2s ease;
        cursor: pointer;
      }
      
      .rating-stars .star.filled {
        color: #ffc107;
        text-shadow: 0 2px 4px rgba(255, 193, 7, 0.3);
      }
      
      .rating-stars.interactive .star:hover {
        color: #ffc107;
        transform: scale(1.2);
        filter: drop-shadow(0 0 8px rgba(255, 193, 7, 0.6));
      }
      
      .btn-favorite {
        background: none;
        border: none;
        font-size: 20px;
        cursor: pointer;
        padding: 4px 8px;
        transition: transform 0.2s;
      }
      
      .btn-favorite:hover {
        transform: scale(1.2);
      }
      
      .btn-favorite.is-favorite {
        animation: heartBeat 0.3s;
      }
      
      @keyframes heartBeat {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.3); }
      }
      
      .rating-modal {
        max-width: 540px;
        padding: 32px;
      }
      
      .modal-header {
        text-align: center;
        margin-bottom: 24px;
        padding-bottom: 16px;
        border-bottom: 2px solid #f0f0f0;
      }
      
      .modal-header h2 {
        margin: 0 0 8px 0;
        color: #2c3e50;
        font-size: 24px;
      }
      
      .modal-subtitle {
        margin: 0;
        color: #7f8c8d;
        font-size: 14px;
      }
      
      .rating-section {
        margin: 24px 0;
        text-align: center;
        padding: 20px;
        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        border-radius: 12px;
      }
      
      .rating-section label {
        display: block;
        margin-bottom: 12px;
        font-weight: 600;
        color: #495057;
        font-size: 16px;
      }
      
      .rating-hint {
        margin: 12px 0 0 0;
        color: #999;
        font-size: 16px;
        font-weight: normal;
        min-height: 24px;
        transition: all 0.3s ease;
      }
      
      .favorite-section {
        margin: 20px 0;
        padding: 16px;
        background: #fff5f5;
        border-radius: 8px;
        border: 2px solid #ffe0e0;
      }
      
      .favorite-checkbox {
        display: flex;
        align-items: center;
        cursor: pointer;
        user-select: none;
      }
      
      .favorite-checkbox input[type="checkbox"] {
        width: 20px;
        height: 20px;
        margin-right: 12px;
        cursor: pointer;
      }
      
      .favorite-label {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 15px;
        color: #495057;
      }
      
      .heart-icon {
        font-size: 20px;
        transition: transform 0.2s;
      }
      
      .favorite-checkbox:hover .heart-icon {
        transform: scale(1.2);
      }
      
      .char-count {
        display: block;
        margin-top: 6px;
        color: #6c757d;
        font-size: 13px;
        text-align: right;
      }
    `;
    document.head.appendChild(style);
  }
})();
