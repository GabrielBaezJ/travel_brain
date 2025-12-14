// public/assets/js/routes.favorites.api.js
(function(){
	async function list(page=1, size=50){
		const url = `/api/routes/favorites/${page}/${size}`;
		try {
			const res = await http.apiJson(url);
			return res.items || [];
		} catch(e){
			if (e?.status === 401) throw e;
			console.warn('Favorites list error:', e.message);
			return [];
		}
	}

	async function save(fav){
		const payload = {
			name: fav.name || '',
			origin: { lat: fav.origin.lat, lon: fav.origin.lon, label: fav.origin.label || '' },
			destination: { lat: fav.destination.lat, lon: fav.destination.lon, label: fav.destination.label || '' },
			distanceKm: fav.distanceKm,
			durationSec: fav.durationSec ?? null,
			mode: fav.mode || ''
		};
		return http.apiJson('/api/routes/favorites', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload)
		});
	}

	async function remove(id){
		return http.apiJson(`/api/routes/favorites/${id}`, { method: 'DELETE' });
	}

	// Simple UI wiring for route.html
		document.addEventListener('DOMContentLoaded', async () => {
			const container = document.getElementById('favoritesContainer');
			const ul = document.getElementById('favoritesList');
			const btn = document.getElementById('saveRouteBtn');
			const nameInput = document.getElementById('favNameInput');
			if (!container || !ul || !btn) return;

			// Check auth status to show/hide favorites UI
			let isLogged = false;
			try { const me = await (globalThis.Auth?.me?.() ?? Promise.reject(new Error('no-auth'))); isLogged = !!me?.ok; } catch(e){ isLogged = false; }
			if (!isLogged){
				// Hide save and favorites panel for guests
				btn.style.display = 'none';
				if (nameInput) nameInput.style.display = 'none';
				container.style.display = 'none';
				// Do not wire events further
				return;
			}

			// Logged-in users: show panel, keep save hidden until a route is calculated
			container.style.display = '';

		async function render(){
			ul.innerHTML = '<li class="muted">Loading favorites…</li>';
			try {
				const items = await list(1, 50);
				ul.innerHTML = '';
				if (!items.length){ ul.innerHTML = '<li class="muted">No favorites yet.</li>'; return; }
				const formatDuration = (sec) => {
					if (typeof sec !== 'number' || Number.isNaN(sec)) return null;
					const m = Math.round(sec/60);
					if (m < 60) return `${m} min`;
					const h = Math.floor(m/60);
					const mm = m % 60;
					return mm ? `${h} h ${mm} min` : `${h} h`;
				};
				for (const it of items){
					const li = document.createElement('li');
					  const title = (it.name?.trim?.() ? it.name : `${it.origin?.label ?? 'Origen'} → ${it.destination?.label ?? 'Destino'}`);
					const km = (it.distanceKm||0).toFixed(1);
					  const hasDuration = typeof it.durationSec === 'number' && !Number.isNaN(it.durationSec);
					  const durStr = hasDuration ? formatDuration(it.durationSec) : null;
					  const mode = it.mode ? ` • ${DomUtils.escapeHtml(it.mode)}` : '';
					  const timeStr = durStr ? ` • ${durStr}` : '';
					li.innerHTML = `
						<div>
							<strong>${DomUtils.escapeHtml(title)}</strong>
							<br><small>${DomUtils.escapeHtml(it.origin?.label||'')} → ${DomUtils.escapeHtml(it.destination?.label||'')}</small>
							<br><small>${km} km${timeStr}${mode}</small>
						</div>
						<div>
							<button class="btn btn-outline" data-id="${it._id}" data-action="load">Load</button>
							<button class="btn btn-outline" data-id="${it._id}" data-action="delete">Delete</button>
						</div>`;
					ul.appendChild(li);
				}
					} catch(e){
						console.warn('Favorites list failed', e);
						ul.innerHTML = '<li class="muted">Sign in to see your favorites.</li>';
			}
		}

		// Save current route
			btn.addEventListener('click', async () => {
			const last = globalThis.LastRoute;
			if (!last) {
				if (window.ValidationUtils) {
					window.ValidationUtils.showError('Primero calcula una ruta');
				} else {
					alert('Calculate a route first.');
				}
				return;
			}
			
			const defaultName = `${last.origin.label||'Origen'} → ${last.destination.label||'Destino'}`;
			const name = (nameInput?.value?.trim?.() ? nameInput.value.trim() : defaultName);
			
			// Validar nombre si está presente
			if (nameInput && nameInput.value.trim() && nameInput.value.trim().length < 2) {
				if (window.ValidationUtils) {
					window.ValidationUtils.showError('El nombre debe tener al menos 2 caracteres');
					nameInput.classList.add('invalid', 'shake');
					setTimeout(() => nameInput.classList.remove('shake'), 500);
				} else {
					alert('El nombre debe tener al menos 2 caracteres');
				}
				nameInput.focus();
				return;
			}

			// Mostrar indicador de carga
			const originalText = btn.textContent;
			btn.disabled = true;
			btn.textContent = 'Guardando...';
			
			try {
				await save({
					name,
					origin: { lat: last.origin.lat, lon: last.origin.lon, label: last.origin.label },
					destination: { lat: last.destination.lat, lon: last.destination.lon, label: last.destination.label },
					distanceKm: last.distanceKm,
					durationSec: last.durationSec || null,
					mode: last.mode || ''
				});
				
				// Limpiar errores y campo
				if (nameInput) {
					nameInput.value = '';
					nameInput.classList.remove('invalid');
				}
				
				if (window.ValidationUtils) {
					window.ValidationUtils.showSuccess('Ruta favorita guardada exitosamente');
				}
				
				render();
			} catch(e){
				if (e?.status === 401) {
					if (window.ValidationUtils) {
						window.ValidationUtils.showError('Debes iniciar sesión para guardar favoritos');
					} else {
						alert('Please sign in to save favorites.');
					}
					return;
				}
				const msg = (e && (e.message || e.msg)) || 'No se pudo guardar la ruta favorita';
				if (window.ValidationUtils) {
					window.ValidationUtils.showError(msg);
				} else {
					alert(msg);
				}
			} finally {
				// Restaurar botón
				btn.disabled = false;
				btn.textContent = originalText;
			}
		});

		// Enable save button once a route is available
			document.addEventListener('route:calculated', () => {
				// Show and enable save controls
				btn.style.display = '';
				if (nameInput){
					const last = globalThis.LastRoute;
					nameInput.style.display = '';
					nameInput.value = last ? `${last.origin.label||'Origen'} → ${last.destination.label||'Destino'}` : '';
				}
			});

		// Delegated list actions
		ul.addEventListener('click', async (ev) => {
			const target = ev.target;
			if (!(target instanceof HTMLElement)) return;
			const id = target.dataset.id;
			const action = target.dataset.action;
			if (!id || !action) return;
			if (action === 'delete'){
				if (!confirm('¿Eliminar esta ruta favorita?')) return;
				try {
					await remove(id);
					if (window.ValidationUtils) {
						window.ValidationUtils.showSuccess('Ruta favorita eliminada');
					}
					render();
				} catch (e) {
					if (window.ValidationUtils) {
						window.ValidationUtils.showError('Error al eliminar la ruta favorita');
					} else {
						alert('Error al eliminar la ruta');
					}
				}
			} else if (action === 'load'){
				const items2 = await list(1,50);
				const found = items2.find(x => x._id === id);
				if (found){
					const originInput = document.getElementById('originInput');
					const destInput = document.getElementById('destInput');
					if (originInput && destInput){
						originInput.value = found.origin?.label || '';
						destInput.value = found.destination?.label || '';
						document.getElementById('calcRouteBtn')?.click();
					}
				}
			}
		});

		// Initial render
		render();
	});

	globalThis.RoutesFavoritesAPI = { list, save, remove };
})();
