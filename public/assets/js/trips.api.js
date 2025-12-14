// public/assets/js/trips.api.js
// Wrapper around Trips API + fallback local storage
(function(){
  const { read, write, keys } = globalThis.Storage || { read:()=>[], write:()=>{}, keys:{ trips:'trips' } };
  // DOM utils not required here currently; keep minimal.

  async function list(page=1, size=50){
    try {
      const data = await globalThis.http.apiJson(`/api/trips/${page}/${size}`);
      if (data && Array.isArray(data.items)) return data.items;
    } catch(e){
      if (e.status === 401) throw e; // bubble up for auth handling
      console.warn('Trips API list fallback local:', e.status, e.message);
    }
    return read(keys.trips, []);
  }

  async function get(id){
    try {
      const data = await globalThis.http.apiJson(`/api/trips/${id}`);
      return data.trip || null;
    } catch(e){
      if (e.status === 401) throw e;
      const local = read(keys.trips, []);
      return local.find(t => t._id === id || t.id === id) || null;
    }
  }

  async function create(trip){
    // Normalize field names before sending
    const payload = {
      title: trip.title,
      destination: trip.destination,
      startDate: trip.startDate,
      endDate: trip.endDate,
      budget: trip.budget ?? null,
      description: trip.description || ''
    };
    try {
      const data = await globalThis.http.apiJson('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return data.trip || data;
    } catch(e){
      console.warn('Trips API create fallback local:', e.status, e.message);
      // Local fallback
      const local = read(keys.trips, []);
  const localTrip = { ...payload, _id: Date.now().toString() };
      local.unshift(localTrip);
      write(keys.trips, local);
      return localTrip;
    }
  }

  async function remove(id){
    try {
      await globalThis.http.apiJson(`/api/trips/${id}`, { method: 'DELETE' });
      return true;
    } catch(e){
      console.warn('Trips API delete fallback local:', e.status, e.message);
      const local = read(keys.trips, []); 
      write(keys.trips, local.filter(t => t._id !== id && t.id !== id));
      return false;
    }
  }

  globalThis.TripsAPI = { list, get, create, remove };
})();