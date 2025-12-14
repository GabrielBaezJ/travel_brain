// Deprecated: replaced by MapboxAutocomplete (mapbox-autocomplete.js)
// This file kept temporarily; destination form currently does not include datalist element.
(function(){
  const warn = () => console.warn('destinations-autocomplete.js deprecated; use MapboxAutocomplete');
  globalThis.DestinationsAutocomplete = { wire: warn };
})();