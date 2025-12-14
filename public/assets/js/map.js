        // Token de Mapbox: primero intenta desde config pública, si no, desde localStorage
        mapboxgl.accessToken = (globalThis.__CONFIG__?.MAPBOX_TOKEN)
            ? globalThis.__CONFIG__.MAPBOX_TOKEN
            : localStorage.getItem('mb_token');
        if (!mapboxgl.accessToken) {
            console.warn('MAPBOX_TOKEN no configurado. Define MAPBOX_TOKEN en el servidor o guarda "mb_token" en localStorage.');
        }

        const map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/streets-v12',
            center: [-76, 0],
            zoom: 4.3
        });
        map.addControl(new mapboxgl.NavigationControl(), 'top-right');

        const MB_TOKEN = mapboxgl.accessToken;

        async function ensureStyleReady(m) {
            if (m.isStyleLoaded()) return;
            await new Promise(res => m.once('style.load', res));
        }

        async function geocodePlace(query) {
            const params = new URLSearchParams({
                access_token: MB_TOKEN,
                limit: '1',
                language: 'es',
                routing: 'true',
                // sin restricción de país para búsquedas globales
            });
            const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` + params;
            const res = await fetch(url);
            const data = await res.json();
            const feat = data.features?.[0];
            if (!feat) throw new Error('No se encontró: ' + query);
            return feat.routable_points?.points?.[0]?.coordinates || feat.center;
        }

        async function suggestPlaces(query) {
            if (!query || query.length < 3) { return []; }
            const params = new URLSearchParams({
                access_token: MB_TOKEN,
                limit: '5',
                language: 'es',
                autocomplete: 'true',
                types: 'place,locality,region'
            });
            const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` + params;
            const res = await fetch(url);
            const data = await res.json();
            const out = [];
            for (const f of (data.features || [])) {
                if (f?.place_name) { out.push(f.place_name); }
            }
            return out;
        }

        function wireAutocomplete(inputId, listId) {
            const input = document.getElementById(inputId);
            const list = document.getElementById(listId);
            if (!input || !list) { return; }
            let lastQ = '';
            input.addEventListener('input', async () => {
                const q = input.value.trim();
                if (q === lastQ) { return; }
                lastQ = q;
                const suggestions = await suggestPlaces(q);
                // limpiar datalist
                while (list.firstChild) { list.firstChild.remove(); }
                for (const s of suggestions) {
                    const opt = document.createElement('option');
                    opt.value = s;
                    list.appendChild(opt);
                }
            });
        }

    async function getRoute(origin, dest, profile = 'mapbox/driving') {
            const params = new URLSearchParams({
                geometries: 'geojson',
                overview: 'simplified',
                access_token: MB_TOKEN
            });
            const coordStr = `${origin[0]},${origin[1]};${dest[0]},${dest[1]}`;
            const url = `https://api.mapbox.com/directions/v5/${profile}/${coordStr}?` + params;
            const res = await fetch(url);
            if (!res.ok) {
                const txt = await res.text().catch(()=>String(res.status));
                throw new Error(`HTTP ${res.status}: ${txt}`);
            }
            const json = await res.json();
            const route = json.routes?.[0];
            if (!route || json.code && String(json.code) !== 'Ok') {
                const err = new Error('No se obtuvo ruta');
                err.code = json.code || 'NoRoute';
                throw err;
            }
            return { distance: route.distance, duration: route.duration, geometry: route.geometry, mode: profile.split('/')[1] };
        }

        // Distancia en línea recta (haversine) como último recurso
        function lineDistanceKm(a, b) {
            const [lon1, lat1] = a, [lon2, lat2] = b;
            const toRad = (v) => v * Math.PI / 180;
            const R = 6371; // km
            const dLat = toRad(lat2 - lat1);
            const dLon = toRad(lon2 - lon1);
            const la1 = toRad(lat1), la2 = toRad(lat2);
            const h = Math.sin(dLat/2)**2 + Math.cos(la1)*Math.cos(la2)*Math.sin(dLon/2)**2;
            return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1-h));
        }

    async function getRouteWithFallback(origin, dest) {
            // 1) Intentar driving
            try { return await getRoute(origin, dest, 'mapbox/driving'); } catch(error_) { console.debug('driving failed:', error_?.message || error_); }
            // 2) Intentar walking
            try { return await getRoute(origin, dest, 'mapbox/walking'); } catch(error_) { console.debug('walking failed:', error_?.message || error_); }
            // 3) Intentar cycling
            try { return await getRoute(origin, dest, 'mapbox/cycling'); } catch(error_) { console.debug('cycling failed:', error_?.message || error_); }
            // 4) Fallback: línea recta con velocidad promedio 700km/día (~29km/h)
            const km = lineDistanceKm(origin, dest);
            const durationSec = (km / 29) * 3600; // aproximación burda
            return {
                distance: km * 1000,
                duration: durationSec,
                geometry: { type: 'LineString', coordinates: [origin, dest] },
                fallback: true,
                mode: 'fallback'
            };
        }

        function drawRoute(m, lineString) {
            const fc = { type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: lineString }] };
            if (m.getSource('route')) {
                m.getSource('route').setData(fc);
            } else {
                m.addSource('route', { type: 'geojson', data: fc });
                m.addLayer({
                    id: 'route-line',
                    type: 'line',
                    source: 'route',
                    paint: { 'line-color': '#1a73e8', 'line-width': 4 }
                });
            }
        }

        // habilitar autocompletado global
        wireAutocomplete('originInput','originList');
        wireAutocomplete('destInput','destList');

        // Configurar validación en tiempo real para los campos de rutas
        if (window.ValidationUtils) {
            const originInput = document.getElementById('originInput');
            const destInput = document.getElementById('destInput');
            
            if (originInput && destInput) {
                const fieldRules = {
                    originInput: { required: true, minLength: 2, maxLength: 100 },
                    destInput: { required: true, minLength: 2, maxLength: 100 }
                };
                
                // Crear un contenedor virtual para las validaciones
                const routeContainer = document.createElement('div');
                routeContainer.appendChild(originInput.cloneNode(true));
                routeContainer.appendChild(destInput.cloneNode(true));
                
                window.ValidationUtils.setupRealTimeValidation(routeContainer, fieldRules);
            }
        }

        document.getElementById('calcRouteBtn').addEventListener('click', async () => {
            const oText = document.getElementById('originInput').value?.trim();
            const dText = document.getElementById('destInput').value?.trim();
            const modeSel = document.getElementById('routeModeSelect');
            const selectedMode = modeSel?.value || 'auto';
            const out = document.getElementById('routeResult');
            const originInput = document.getElementById('originInput');
            const destInput = document.getElementById('destInput');
            const calcBtn = document.getElementById('calcRouteBtn');

            // Validaciones
            if (!oText || oText.length < 2) {
                if (window.ValidationUtils) {
                    window.ValidationUtils.showError('El origen es obligatorio (mín. 2 caracteres)');
                    originInput.classList.add('invalid', 'shake');
                    setTimeout(() => originInput.classList.remove('shake'), 500);
                } else {
                    out.textContent = 'El origen es obligatorio.';
                }
                originInput.focus();
                return;
            }

            if (!dText || dText.length < 2) {
                if (window.ValidationUtils) {
                    window.ValidationUtils.showError('El destino es obligatorio (mín. 2 caracteres)');
                    destInput.classList.add('invalid', 'shake');
                    setTimeout(() => destInput.classList.remove('shake'), 500);
                } else {
                    out.textContent = 'El destino es obligatorio.';
                }
                destInput.focus();
                return;
            }

            // Mostrar indicador de carga
            const originalText = calcBtn.textContent;
            calcBtn.disabled = true;
            calcBtn.textContent = 'Calculando...';

            out.textContent = 'Calculando...';
            
            try {
                // Limpiar errores de validación
                originInput.classList.remove('invalid');
                destInput.classList.remove('invalid');
                await ensureStyleReady(map);
                const [oCoord, dCoord] = await Promise.all([geocodePlace(oText), geocodePlace(dText)]);
                let route;
                if (selectedMode === 'auto') {
                    // Auto: probar perfiles con fallback interno
                    route = await getRouteWithFallback(oCoord, dCoord);
                } else {
                    // Modo explícito seleccionado por el usuario: intentar ese perfil y si falla, fallback completo
                    try {
                        route = await getRoute(oCoord, dCoord, `mapbox/${selectedMode}`);
                    } catch (e) {
                        console.debug(`Perfil seleccionado ${selectedMode} falló, usando fallback`, e?.message || e);
                        route = await getRouteWithFallback(oCoord, dCoord);
                    }
                }

                const kmNum = route.distance / 1000;
                const km = kmNum.toFixed(1);
                const fmtDuration = (sec) => {
                    if (sec == null || Number.isNaN(sec)) return null;
                    const m = Math.round(sec / 60);
                    if (m < 60) return `${m} min`;
                    const h = Math.floor(m / 60);
                    const mm = m % 60;
                    return mm ? `${h} h ${mm} min` : `${h} h`;
                };
                const durStr = fmtDuration(route.duration);
                const modeStr = route.mode && route.mode !== 'fallback' ? ` • ${route.mode}` : '';
                out.textContent = (route.fallback
                    ? `${km} km (línea recta)${durStr ? ` • ~${durStr} (estimado)` : ''}${modeStr}`
                    : `${km} km${durStr ? ` • ${durStr}` : ''}${modeStr}`
                ).trim();

                drawRoute(map, route.geometry);
                const coords = route.geometry.coordinates;
                const bounds = coords.reduce((b, c) => b.extend(c), new mapboxgl.LngLatBounds(coords[0], coords[0]));
                map.fitBounds(bounds, { padding: 40 });

                // Exponer última ruta para guardado de favoritos
                globalThis.LastRoute = {
                    origin: { lon: oCoord[0], lat: oCoord[1], label: oText },
                    destination: { lon: dCoord[0], lat: dCoord[1], label: dText },
                    distanceKm: Number.parseFloat(km),
                    durationSec: route.duration || null,
                    geometry: route.geometry,
                    mode: route.mode || (route.fallback ? 'fallback' : selectedMode || 'unknown')
                };
                document.dispatchEvent(new CustomEvent('route:calculated', { detail: globalThis.LastRoute }));
                
                // Mostrar mensaje de éxito
                if (window.ValidationUtils) {
                    window.ValidationUtils.showSuccess('Ruta calculada exitosamente');
                }
                
            } catch (e) {
                out.textContent = 'No fue posible calcular la ruta.';
                console.error(e);
                
                if (window.ValidationUtils) {
                    window.ValidationUtils.showError('No fue posible calcular la ruta. Intenta con otros lugares.');
                }
            } finally {
                // Restaurar botón
                calcBtn.disabled = false;
                calcBtn.textContent = originalText;
            }
        });