// Deprecated: replaced by mapbox-autocomplete.js (MapboxAutocomplete)
// This stub kept only to avoid 404s if any legacy HTML still includes it.
(function(){
  const warn = () => console.warn('places-autocomplete.js is deprecated; use MapboxAutocomplete instead');
  function noop(){ warn(); }
  globalThis.PlacesAutocomplete = {
    wire: noop,
    suggestPlaces: async () => [],
    countryFromFeature: () => ''
  };
})();