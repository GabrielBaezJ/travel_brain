// public/assets/js/itineraries-api.js
window.ItinerariesAPI = (function() {
  const BASE_URL = '/api';

  async function handleResponse(response) {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }
    return response.json();
  }

  return {
    /**
     * Create or update itinerary for a trip
     * @param {string} tripId - Trip ID
     * @param {Object} data - Itinerary data
     * @returns {Promise<Object>}
     */
    async createOrUpdate(tripId, data) {
      const response = await fetch(`${BASE_URL}/trips/${tripId}/itinerary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      return handleResponse(response);
    },

    /**
     * Get itinerary by trip ID
     * @param {string} tripId - Trip ID
     * @returns {Promise<Object>}
     */
    async getByTripId(tripId) {
      const response = await fetch(`${BASE_URL}/trips/${tripId}/itinerary`, {
        credentials: 'include'
      });
      return handleResponse(response);
    },

    /**
     * Get all itineraries for current user
     * @param {boolean} withDetails - Include trip and destination details
     * @returns {Promise<Array>}
     */
    async getMyItineraries(page = 1, size = 10, withDetails = false) {
      const baseUrl = `${BASE_URL}/users/me/itineraries/${page}/${size}`;
      const url = withDetails 
        ? `${baseUrl}?details=true`
        : baseUrl;
      
      const response = await fetch(url, {
        credentials: 'include'
      });
      const data = await handleResponse(response);
      return data.itineraries || [];
    },

    /**
     * Update itinerary by ID
     * @param {string} id - Itinerary ID
     * @param {Object} data - Update data
     * @returns {Promise<Object>}
     */
    async update(id, data) {
      const response = await fetch(`${BASE_URL}/itineraries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      return handleResponse(response);
    },

    /**
     * Update specific day in itinerary
     * @param {string} id - Itinerary ID
     * @param {number} dayNumber - Day number (1-based)
     * @param {Array} activities - Activities for the day
     * @returns {Promise<Object>}
     */
    async updateDay(id, dayNumber, activities) {
      const response = await fetch(`${BASE_URL}/itineraries/${id}/days/${dayNumber}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ activities })
      });
      return handleResponse(response);
    },

    /**
     * Delete itinerary
     * @param {string} id - Itinerary ID
     * @returns {Promise<Object>}
     */
    async delete(id) {
      const response = await fetch(`${BASE_URL}/itineraries/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      return handleResponse(response);
    }
  };
})();
