(function(){
  // Simple place image helper using Wikipedia REST API (Spanish)
  async function fetchJson(url){
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  }

  function normalizeTitle(q){
    return (q||'').trim().replace(/\s+/g,'_');
  }

  async function imageForPlace(city, country){
    const candidates = [];
    if (city && country) candidates.push(`${city}, ${country}`);
    if (city) candidates.push(city);
    if (country) candidates.push(country);

    for (const q of candidates){
      try{
        const title = encodeURIComponent(normalizeTitle(q));
        // Try Spanish Wikipedia first
        let json = await fetchJson(`https://es.wikipedia.org/api/rest_v1/page/summary/${title}`);
        if (json && json.thumbnail && json.thumbnail.source) return json.thumbnail.source;
        // Fallback to English Wikipedia
        json = await fetchJson(`https://en.wikipedia.org/api/rest_v1/page/summary/${title}`);
        if (json && json.thumbnail && json.thumbnail.source) return json.thumbnail.source;
      }catch(_){ /* continue */ }
    }
    return null;
  }

  globalThis.PlaceImage = { imageForPlace };
})();
