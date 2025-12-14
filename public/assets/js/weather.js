// public/assets/js/weather.js
(function () {
  document.addEventListener('DOMContentLoaded', () => {
  // const destSelect = document.getElementById('weatherDest'); // removed from UI
    const getBtn = document.getElementById('getWeatherBtn');
    const result = document.getElementById('weatherResult');
    const placeInput = document.getElementById('weatherPlaceInput');
    const placeList = document.getElementById('weatherPlaceList');
    const latEl = document.getElementById('weatherLat');
    const lonEl = document.getElementById('weatherLon');


    // Autocompletar básico con Mapbox (si hay token)
    (function wireAutocomplete(){
      if (!placeInput || !placeList) return;
      const token = (globalThis.__CONFIG__?.MAPBOX_TOKEN) || localStorage.getItem('mb_token') || (typeof mapboxgl!=='undefined' && mapboxgl.accessToken) || null;
      if (!token) return; // sin token no autocompletamos
      let lastQ = '';
      placeInput.addEventListener('input', async () => {
        const q = placeInput.value.trim();
        if (q.length < 3 || q === lastQ) return;
        lastQ = q;
        try {
          const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?access_token=${encodeURIComponent(token)}&limit=5&language=es`;
          const res = await fetch(url);
          const data = await res.json();
          while (placeList.firstChild) placeList.firstChild.remove();
          (data.features||[]).forEach(f => {
            const opt = document.createElement('option');
            opt.value = f.place_name;
            placeList.appendChild(opt);
          });
        } catch(e){ /* silencioso */ }
      });
      // Al salir del input, si no hay coords, intentar geocodificar
      placeInput.addEventListener('change', async () => {
        if (latEl?.value && lonEl?.value) return;
        const q = placeInput.value.trim();
        if (!q) return;
        try {
          const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?access_token=${encodeURIComponent(token)}&limit=1&language=es`;
          const res = await fetch(url);
          const data = await res.json();
          const feat = data.features?.[0];
          const center = feat?.center;
          if (Array.isArray(center) && center.length===2){
            lonEl && (lonEl.value = String(center[0]));
            latEl && (latEl.value = String(center[1]));
          }
        } catch(_){ }
      });
    })();

    // Configurar validación en tiempo real para el campo de lugar
    if (window.ValidationUtils && placeInput) {
      const fieldRules = { weatherPlaceInput: { minLength: 2, maxLength: 100 } };
      window.ValidationUtils.setupRealTimeValidation(placeInput.form || document.body, fieldRules);
    }

    // Obtener clima real (OpenWeather a través del backend). Si falla, usar simulación
    getBtn.addEventListener('click', async () => {
      const id = null; // no longer used
      
      // Validar entrada
      const place = placeInput?.value?.trim() || '';
      const lat = parseFloat(latEl?.value || '');
      const lon = parseFloat(lonEl?.value || '');
      
      if (!place && !(Number.isFinite(lat) && Number.isFinite(lon))) {
        if (window.ValidationUtils) {
          window.ValidationUtils.showError('Por favor, escribe un lugar o proporciona coordenadas válidas');
        } else {
          alert('Escribe un lugar o proporciona coordenadas');
        }
        placeInput?.focus();
        return;
      }
      
      if (place && place.length < 2) {
        if (window.ValidationUtils) {
          window.ValidationUtils.showError('El nombre del lugar debe tener al menos 2 caracteres');
        } else {
          alert('El nombre del lugar debe tener al menos 2 caracteres');
        }
        placeInput?.focus();
        return;
      }

      // Mostrar indicador de carga
      const originalText = getBtn.textContent;
      getBtn.disabled = true;
      getBtn.textContent = 'Obteniendo clima...';

      try {
        // 1) Intentar obtener coords: por inputs, por destino, o geocodificando el texto
        let lat = parseFloat(latEl?.value || '');
        let lon = parseFloat(lonEl?.value || '');
        let label = place;
      if (!(Number.isFinite(lat) && Number.isFinite(lon))) {
        // Buscar en destinos
        // No destination select; skip lookup
      }
      if (placeInput?.value) {
        // Siempre geocodificar el texto actual para refrescar coordenadas
        try {
          const token = (globalThis.__CONFIG__?.MAPBOX_TOKEN) || localStorage.getItem('mb_token') || (typeof mapboxgl!=='undefined' && mapboxgl.accessToken) || null;
          if (token) {
            const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(placeInput.value)}.json?access_token=${encodeURIComponent(token)}&limit=1&language=es`;
            const res = await fetch(url);
            const data = await res.json();
            const center = data.features?.[0]?.center;
            if (Array.isArray(center) && center.length===2){
              lon = center[0]; lat = center[1];
              lonEl && (lonEl.value = String(lon));
              latEl && (latEl.value = String(lat));
            }
          }
        } catch(_){ }
      }

      let data;
      if (Number.isFinite(lat) && Number.isFinite(lon)) {
        try {
          // Solo registrar si el usuario está autenticado (lo detectamos luego)
          // Enviar una etiqueta amigable (ciudad, país) si el usuario escribió algo
          // Normalizar etiqueta: tomar siempre primer segmento (ciudad) y último (país), ignorando provincia/estado intermedio.
          const partsRaw = (label || '').split(',').map(s=>s.trim()).filter(Boolean);
          let cleanedLabel = '';
          if (partsRaw.length >= 2) {
            cleanedLabel = partsRaw[0] + ', ' + partsRaw[partsRaw.length - 1];
          } else if (partsRaw.length === 1) {
            cleanedLabel = partsRaw[0];
          }
          const url = `/api/weather/current?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&log=1` + (cleanedLabel ? `&q=${encodeURIComponent(cleanedLabel)}` : '');
          const resp = await fetch(url, { credentials: 'include' });
          const ctype = resp.headers.get('content-type') || '';
          if (!resp.ok || !ctype.includes('application/json')) throw new Error(`HTTP ${resp.status}`);
          const json = await resp.json();
          if (json && (json.ok === true || 'temp' in json)) {
            data = {
              destId: id || null,
              destName: json.location || label || 'Ubicación',
              temp: json.temp,
              condition: json.condition,
              humidity: json.humidity,
              windSpeed: json.windSpeed,
              precipitation: json.precipitation,
              pressure: json.pressure,
              lat: json.lat,
              lon: json.lon
            };
          }
        } catch (e) {
          console.warn('Fallo OpenWeather, usando simulador:', e?.message || e);
        }
      }

      // Fallback simulación
      if (!data) {
        data = window.app?.getSimulatedWeather ? await window.app.getSimulatedWeather(null) : { error: 'Simulador no disponible' };
        if (label && data) { data.destName = label; }
      }

      // Actualizar la UI con los datos del clima
      const weatherLocation = document.getElementById('weatherLocation');
      const weatherDate = document.getElementById('weatherDate');
      const weatherMain = document.getElementById('weatherMain');
      const weatherDetails = document.getElementById('weatherDetails');

      weatherLocation.textContent = data.destName || 'Ubicación desconocida';
      const now = new Date();
      weatherDate.textContent = now.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

      weatherMain.innerHTML = `
        <div class="temp-main">
          <span class="temp">${data.temp}°C</span>
          <span class="condition">${data.condition}</span>
        </div>
      `;
      // Insertar separador si no existe
      if (!result.querySelector('hr.weather-sep')) {
        const hr = document.createElement('hr');
        hr.className = 'weather-sep';
        const headerNode = result.querySelector('.weather-header');
        headerNode && headerNode.insertAdjacentElement('afterend', hr);
      }

      // Valores por defecto si faltan
      const humidity = (data.humidity ?? Math.floor(Math.random()*40)+50);
      const wind = (data.windSpeed ?? Math.floor(Math.random()*25)+5);
      const precip = (data.precipitation ?? Math.floor(Math.random()*60));
      const pressure = (data.pressure ?? Math.floor(Math.random()*20)+1010);

      weatherDetails.innerHTML = `
        <ul class="weather-list">
          <li>Humedad: ${humidity}%</li>
          <li>Viento: ${wind} km/h</li>
          <li>Precipitación: ${precip}%</li>
          <li>Presión: ${pressure} hPa</li>
        </ul>
      `;

      result.style.display = 'block';
      // Si hay mapa y coordenadas, mostrarlas
      try {
        const mapDiv = document.getElementById('weatherMap');
        if (latEl && lonEl && mapDiv) {
          if (data.lat != null && data.lon != null) {
            latEl.value = String(data.lat);
            lonEl.value = String(data.lon);
          }
          if (typeof mapboxgl !== 'undefined' && mapboxgl && (mapboxgl.accessToken || (globalThis.__CONFIG__?.MAPBOX_TOKEN) || localStorage.getItem('mb_token'))) {
            mapboxgl.accessToken = mapboxgl.accessToken || (globalThis.__CONFIG__?.MAPBOX_TOKEN) || localStorage.getItem('mb_token');
            // Destruir mapa previo si existe para evitar estados obsoletos
            try {
              if (globalThis.__WEATHER_MAP__ && typeof globalThis.__WEATHER_MAP__.remove === 'function') {
                globalThis.__WEATHER_MAP__.remove();
              }
            } catch(_){ }
            const containerEl = document.getElementById('weatherMap');
            if (containerEl) { containerEl.innerHTML = ''; }
            const map = new mapboxgl.Map({
              container: 'weatherMap',
              style: 'mapbox://styles/mapbox/streets-v12',
              center: [parseFloat(lonEl.value)||-78.5, parseFloat(latEl.value)||-0.2],
              zoom: 10
            });
            globalThis.__WEATHER_MAP__ = map;
            map.addControl(new mapboxgl.NavigationControl(), 'top-right');
            const marker = new mapboxgl.Marker().setLngLat([
              parseFloat(lonEl.value)||-78.5,
              parseFloat(latEl.value)||-0.2
            ]).addTo(map);
          } else {
            // Si no hay token, no mostramos error ruidoso
            console.warn('Mapbox no configurado. Guarda "mb_token" en localStorage si deseas ver el mapa.');
          }
        }
      } catch(e){ console.debug('Mapa no disponible:', e?.message || e); }

        window.currentWeather = { ...data, humidity, windSpeed: wind, precipitation: precip, pressure };

        // Mostrar mensaje de éxito
        if (window.ValidationUtils) {
          window.ValidationUtils.showSuccess('Clima obtenido exitosamente');
        }

      } catch (error) {
        console.error('Error obteniendo clima:', error);
        if (window.ValidationUtils) {
          window.ValidationUtils.showError('Error al obtener el clima. Inténtalo de nuevo.');
        } else {
          alert('Error al obtener el clima');
        }
      } finally {
        // Restaurar botón
        getBtn.disabled = false;
        getBtn.textContent = originalText;
      }
    });

    // Consultar estado de login y cargar historial si aplica
    (async function(){
      try {
        const res = await (globalThis.Auth ? globalThis.Auth.me() : Promise.reject());
        const logged = !!(res && res.ok);
        if (logged) {
          // En modo autenticado, listamos historial desde Mongo
          await renderServerHistory();
        } else {
          // Invitado: ocultar botón guardar y no listar registros
          const list = document.getElementById('weatherList');
          if (list) list.innerHTML = '';
        }
      } catch (_) {
        const list = document.getElementById('weatherList');
        if (list) list.innerHTML = '';
      }
    })();

    // Carga historial desde backend y lo renderiza
    async function renderServerHistory(page=1, size=20){
      try {
        const resp = await fetch(`/api/weather/history/${page}/${size}`, { credentials: 'include' });
        if (!resp.ok) return; // unauth or 404
        const ctype = resp.headers.get('content-type') || '';
        if (!ctype.includes('application/json')) return;
        const data = await resp.json();
        if (!data || !Array.isArray(data.items)) return;
        const ul = document.getElementById('weatherList');
        if (!ul) return;
        ul.innerHTML = '';
        for (const r of data.items) {
          const li = document.createElement('li');
          const header = r.label || 'Ubicación';
          const tempText = (r.temp != null) ? `${r.temp}°C` : '—';
          const condText = r.condition ? ` · ${r.condition}` : '';
          // Preferir hora local si existe
          const when = r.createdAtLocal || r.createdAt || '';
          li.innerHTML = `<div><strong>${header}</strong> · ${tempText}${condText}<br><small>${when}</small></div>`;
          ul.appendChild(li);
        }
      } catch(_){ /* silencioso */ }
    }
  });
})();
