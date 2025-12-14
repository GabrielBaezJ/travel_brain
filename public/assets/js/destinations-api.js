// API para Destinations (reutiliza la función api de auth-api.js)
(function() {
  // Helper API genérico (usa el de auth-api.js si existe)
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

  window.DestinationsAPI = {
    async list(page = 1, size = 10, search = '') {
      const url = search 
        ? `/api/destinations/${page}/${size}/${encodeURIComponent(search)}`
        : `/api/destinations/${page}/${size}`;
      return await apiCall(url);
    },

    async get(id) {
      return await apiCall(`/api/destinations/${id}`);
    },

    async create(data) {
      return await apiCall('/api/destinations', {
        method: 'POST',
        body: data
      });
    },

    async update(id, data) {
      return await apiCall(`/api/destinations/${id}`, {
        method: 'PUT',
        body: data
      });
    },

    async delete(id) {
      return await apiCall(`/api/destinations/${id}`, {
        method: 'DELETE'
      });
    }
  };
})();

