// public/assets/js/rates-api.js
(function() {
  const apiCall = typeof api !== 'undefined' ? api : async (url, opts = {}) => {
    const res = await fetch(url, {
      method: opts.method || 'GET',
      headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
      credentials: 'include',
      body: opts.body ? JSON.stringify(opts.body) : undefined
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.msg || data.error || `HTTP ${res.status}`);
    return data;
  };

  window.RatesAPI = {
    /**
     * Obtiene las calificaciones de un destino
     */
    async getDestinationRates(destinationId, page = 1, size = 20) {
      const url = `/api/destinations/${destinationId}/rates/${page}/${size}`;
      return await apiCall(url);
    },

    /**
     * Obtiene estadísticas de calificación de un destino (promedio y total)
     */
    async getDestinationStats(destinationId) {
      const url = `/api/destinations/${destinationId}/rates/stats`;
      const result = await apiCall(url);
      const stats = result.stats || { avgRating: 0, totalRatings: 0 };
      // Normalizar nombre del campo para el frontend
      return {
        averageRating: stats.avgRating || 0,
        totalRatings: stats.totalRatings || 0,
        totalFavorites: stats.totalFavorites || 0,
        distribution: stats.distribution || {}
      };
    },

    /**
     * Obtiene mi calificación para un destino
     */
    async getMyRate(destinationId) {
      const url = `/api/destinations/${destinationId}/rates/me`;
      const result = await apiCall(url);
      return result.rate || null;
    },

    /**
     * Califica un destino
     */
    async rateDestination(destinationId, rating, favorite = false, comment = '') {
      return await apiCall(`/api/destinations/${destinationId}/rate`, {
        method: 'POST',
        body: { rating, favorite, comment }
      });
    },

    /**
     * Toggle favorito de un destino
     */
    async toggleFavorite(destinationId) {
      return await apiCall(`/api/destinations/${destinationId}/favorite`, {
        method: 'POST'
      });
    },

    /**
     * Obtiene mis calificaciones
     */
    async getMyRates(page = 1, size = 20) {
      const url = `/api/users/me/rates/${page}/${size}`;
      return await apiCall(url);
    },

    /**
     * Obtiene mis destinos favoritos
     */
    async getMyFavorites() {
      const url = '/api/users/me/favorites';
      return await apiCall(url);
    },

    /**
     * Actualiza una calificación
     */
    async updateRate(rateId, data) {
      return await apiCall(`/api/rates/${rateId}`, {
        method: 'PUT',
        body: data
      });
    },

    /**
     * Elimina una calificación
     */
    async deleteRate(rateId) {
      return await apiCall(`/api/rates/${rateId}`, {
        method: 'DELETE'
      });
    }
  };
})();
