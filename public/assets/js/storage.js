// public/assets/js/storage.js
// Local storage helpers and keys
(function(){
  const keys = {
    dest: 'tp_destinations',
    trips: 'trips', // legacy key used in UI fallback
    tripsNew: 'tp_trips', // planned new key
    weather: 'tp_weather',
    budget: 'tp_budgets',
    itinerary: 'tp_itineraries'
  };

  function read(key, def){
    try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(def ?? null)); }
    catch(_) { return def ?? null; }
  }

  function write(key, val){
    localStorage.setItem(key, JSON.stringify(val));
  }

  window.Storage = { keys, read, write };
})();