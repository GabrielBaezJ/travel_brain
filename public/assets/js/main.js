window.app = (function(){
	const ls = {
		destKey: 'tp_destinations',
		tripKey: 'tp_trips',
		weatherKey: 'tp_weather',
		budgetKey: 'tp_budgets',
		itKey: 'tp_itineraries'
	};

	function uid(prefix = ''){ return prefix + Date.now() + Math.floor(Math.random()*1000); }
	function read(key){ try{ return JSON.parse(localStorage.getItem(key) || '[]'); }catch(e){return []} }
	function write(key, v){ localStorage.setItem(key, JSON.stringify(v)); }

	// Destinations - ahora usa API, estas funciones son stubs para compatibilidad
	async function getDestinations(){ 
		try {
			const res = await window.DestinationsAPI?.list() || { items: [] };
			return res.items || [];
		} catch(e) {
			return [];
		}
	}

	// Trips CRUD
	function getTrips(){ return read(ls.tripKey); }
	function saveTrip(t){
		const all = getTrips();
		if(!t.id){ t.id = uid('trip_'); all.push(t); }
		else{
			const idx = all.findIndex(x=>x.id===t.id);
			if(idx>=0) all[idx] = t;
			else all.push(t);
		}
		write(ls.tripKey, all);
		renderTrips();
	}
	function deleteTrip(id){
		let all = getTrips().filter(x=>x.id!==id);
		write(ls.tripKey, all);
		renderTrips();
	}

	// Weather records
	function saveWeather(record){
		const arr = read(ls.weatherKey);
		record.id = uid('w_'); record.date = new Date().toISOString();
		arr.push(record); write(ls.weatherKey, arr);
	}

	// Budget / expenses
	function saveBudget(tripId, amount){
		const budgets = read(ls.budgetKey);
		const idx = budgets.findIndex(b=>b.tripId===tripId);
		if(idx>=0) budgets[idx].amount = amount;
		else budgets.push({ tripId, amount, expenses: [] });
		write(ls.budgetKey, budgets);
	}
	function addExpense(tripId, expense){
		const budgets = read(ls.budgetKey);
		let b = budgets.find(b=>b.tripId===tripId);
		if(!b){ b = { tripId, amount:0, expenses: [] }; budgets.push(b); }
		b.expenses.push({ id: uid('e_'), desc: expense.desc, amt: expense.amt });
		write(ls.budgetKey, budgets);
	}
	function getBudget(tripId){ return read(ls.budgetKey).find(b=>b.tripId===tripId) || { tripId, amount:0, expenses:[] }; }

	// Función para obtener todos los viajes (API + localStorage)
	async function getAllTrips() {
		try {
			// Intentar desde API primero
			const response = await fetch('/api/trips/1/50');
			if (response.ok) {
				const data = await response.json();
				return data.items || [];
			}
		} catch (err) {
			console.warn('Error cargando trips desde API, usando localStorage:', err.message);
		}
		
		// Fallback: localStorage
		try {
			const localTrips = JSON.parse(localStorage.getItem('trips')) || [];
			const oldTrips = getTrips(); // Trips del formato antiguo
			return [...localTrips, ...oldTrips];
		} catch (e) {
			console.error('Error cargando trips:', e);
			return [];
		}
	}

	// Itinerary - Ahora usa API de Gemini para generación inteligente
	async function generateItinerary(tripId, days, interests = 'cultura', budgetStyle = 'medio'){
		// Buscar el viaje en todas las fuentes
		const allTrips = await getAllTrips();
		const trip = allTrips.find(t => (t._id || t.id) === tripId);
		
		if(!trip) return { html: '<p>Viaje no encontrado</p>', data: null };
		
		// Para viajes simples que solo tienen un destino como string
		const destinationName = trip.destination || 'Destino desconocido';
		const tripTitle = trip.title || trip.name || 'Viaje sin nombre';
		
		try {
			// Usar API de Gemini si está disponible
			if(window.GeminiTravelAPI) {
				const travelPlan = await window.GeminiTravelAPI.generateTravelPlan(
					destinationName, 
					days, 
					interests, 
					budgetStyle
				);
				
				// Renderizar usando la función especializada
				const html = window.GeminiTravelAPI.renderTravelPlan(travelPlan);
				const data = {
					tripId,
					days,
					destinations: destinationName,
					travelPlan,
					generatedBy: 'gemini'
				};
				
				return { html, data };
			}
		} catch(error) {
			console.error('Error usando Gemini API, fallback a generación básica:', error);
		}

		// Fallback: generación básica
		let html = `<div class="basic-itinerary">
			<h3>${tripTitle}</h3>
			<p><strong>Destino:</strong> ${destinationName}</p>
			<p>${trip.description || 'Itinerario básico para tu viaje'}</p>
			<p><em>Itinerario básico generado automáticamente</em></p>`;
		
		let data = { tripId, days, items: [], generatedBy: 'basic' };
		
		// Generar actividades básicas por día
		const activities = [
			'Explorar el centro histórico y monumentos principales',
			'Visitar museos y galerías de arte locales', 
			'Disfrutar de la gastronomía tradicional',
			'Recorrido por parques y espacios naturales',
			'Compras en mercados y tiendas locales',
			'Actividades culturales y entretenimiento nocturno'
		];
		
		for(let d = 0; d < days; d++){
			html += `<div class="day-plan"><h4>Día ${d+1}</h4><ul class="activities-list">`;
			
			// 2-3 actividades por día
			const dailyActivities = Math.min(3, Math.max(2, Math.floor(activities.length / days) + 1));
			
			for(let i = 0; i < dailyActivities; i++){
				const activityIndex = (d * dailyActivities + i) % activities.length;
				const activity = activities[activityIndex];
				
				html += `<li class="activity-item">
					<strong>${activity}</strong>
					<br><small>Recomendado para ${interests} • Estilo ${budgetStyle}</small>
				</li>`;
				
				data.items.push({ 
					day: d+1, 
					activity: activity,
					interests: interests,
					budgetStyle: budgetStyle 
				});
			}
			html += `</ul></div>`;
		}
		
		html += `<div class="itinerary-footer">
			<p><small>💡 <strong>Tip:</strong> Este es un itinerario básico. Para obtener recomendaciones más personalizadas y detalladas, asegúrate de que la integración con Gemini AI esté configurada.</small></p>
		</div></div>`;
		
		return { html, data };
	}
	async function saveItinerary(it){ 
		if (!it || !it.data) {
			console.error('No itinerary data to save');
			if (window.ValidationUtils) {
				window.ValidationUtils.showError('No hay datos de itinerario para guardar');
			}
			return false;
		}

		// Validar que tenemos un tripId válido
		const tripId = it.data.tripId;
		if (!tripId || tripId === '' || tripId === 'undefined') {
			console.error('Invalid tripId:', tripId);
			if (window.ValidationUtils) {
				window.ValidationUtils.showError('ID de viaje inválido. Por favor selecciona un viaje válido.');
			}
			return false;
		}

		try {
			// Formatear días correctamente
			let daysArray = [];
			
			if (it.data.travelPlan?.itinerary) {
				// Formato Gemini
				daysArray = it.data.travelPlan.itinerary;
			} else if (it.data.items && Array.isArray(it.data.items)) {
				// Formato básico - agrupar por día
				const dayGroups = {};
				it.data.items.forEach(item => {
					if (!dayGroups[item.day]) {
						dayGroups[item.day] = [];
					}
					dayGroups[item.day].push(item.activity);
				});
				
				daysArray = Object.keys(dayGroups).map(day => ({
					dayNumber: parseInt(day),
					activities: dayGroups[day]
				}));
			}

			const payload = {
				tripId: tripId,
				totalDays: it.data.days || it.data.totalDays || daysArray.length || 1,
				days: daysArray,
				interests: it.data.travelPlan?.interests || it.data.interests || 'cultura',
				budgetStyle: it.data.travelPlan?.budgetStyle || it.data.budgetStyle || 'medio',
				generatedBy: it.data.generatedBy || 'basic',
				destinationId: it.data.destinationId || null,
				notes: it.data.notes || null
			};

			console.log('Saving itinerary with payload:', payload);

			const response = await fetch(`/api/trips/${tripId}/itinerary`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify(payload)
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
				throw new Error(errorData.error || `HTTP ${response.status}`);
			}

			const result = await response.json();
			console.log('Itinerary saved successfully:', result);
			
			if (window.ValidationUtils) {
				window.ValidationUtils.showSuccess('Itinerario guardado exitosamente en la base de datos');
			}
			
			return true;
		} catch (error) {
			console.error('Error saving itinerary to API:', error);
			
			if (window.ValidationUtils) {
				window.ValidationUtils.showError(`Error al guardar: ${error.message}. Guardado en local como respaldo.`);
			}
			
			// Fallback a localStorage
			try {
				const arr = read(ls.itKey); 
				arr.push({ id: uid('it_'), created: new Date().toISOString(), it }); 
				write(ls.itKey, arr);
				console.log('Itinerary saved to localStorage as fallback');
			} catch (localError) {
				console.error('Failed to save to localStorage:', localError);
				if (window.ValidationUtils) {
					window.ValidationUtils.showError('No se pudo guardar el itinerario');
				}
			}
			
			return false;
		}
	}

	// Helpers
	function haversine(lat1, lon1, lat2, lon2){
		if([lat1,lon1,lat2,lon2].some(v=>v==null)) return null;
		const R = 6371; // km
		const toRad = v => v * Math.PI/180;
		const dLat = toRad(lat2-lat1);
		const dLon = toRad(lon2-lon1);
		const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
		const c = 2*Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
		return R * c;
	}
	async function calculateRoute(originId, destId){
		const dests = await getDestinations();
		const o = dests.find(x=>(x._id||x.id)===originId);
		const d = dests.find(x=>(x._id||x.id)===destId);
		if(!o || !d) return 'Origen o destino no encontrado.';
		let dist = haversine(o.lat, o.lng, d.lat, d.lng);
		if(dist==null){
			// distancia estimada por caracteres del nombre (simulación)
			dist = Math.abs((o.name||'').length - (d.name||'').length) * 50 + 100;
			return `Distancia estimada: ${Math.round(dist)} km. Tiempo aproximado: ${Math.ceil(dist/60)} h (simulado).`;
		}
		const timeHours = dist / 60; // asumiendo 60 km/h media
		return `Distancia: ${dist.toFixed(1)} km. Tiempo estimado: ${timeHours.toFixed(1)} h.`;
	}

	async function getSimulatedWeather(destId){
		let d = { name: 'Desconocido' };
		try {
			const dests = await getDestinations();
			d = dests.find(x=>(x._id||x.id)===destId) || d;
		} catch(e) {
			console.error('Error obteniendo destino:', e);
		}
		const temps = [10,12,15,18,20,22,24,26,28];
		const conditions = ['soleado','nubes','lluvia','tormenta','parcialmente nublado'];
		const rnd = (min,max) => Math.floor(Math.random()*(max-min+1))+min;
		const data = {
			destId,
			destName: d.name || 'Desconocido',
			temp: temps[Math.floor(Math.random()*temps.length)],
			condition: conditions[Math.floor(Math.random()*conditions.length)],
			humidity: rnd(40,95),
			windSpeed: rnd(3,35),
			precipitation: rnd(0,80),
			pressure: rnd(990,1032),
			lat: (d.lat!=null? d.lat : (d.latitude!=null? d.latitude : null)),
			lon: (d.lng!=null? d.lng : (d.longitude!=null? d.longitude : null))
		};
		return data;
	}

	// Renderers y populators
	// renderDestinations ahora está en destinations.js usando API
	async function renderDestinations(filter=''){
		// Esta función ya no se usa aquí, pero se mantiene por compatibilidad
		// La implementación real está en destinations.js
		console.warn('renderDestinations desde main.js está deprecated, usar destinations.js');
	}

	function renderTrips(filter=''){
		const list = document.getElementById('tripList');
		if(!list) return;
		const all = getTrips().filter(t => (t.name||'').toLowerCase().includes(filter.toLowerCase()));
		list.innerHTML = '';
		for (const t of all) {
			const names = (t.destinations||[]).map(id => (getDestinations().find(d=>d.id===id)||{name:'?' }).name).join(', ');
			const li = document.createElement('li');
			li.innerHTML = `<div><strong>${t.name}</strong><br><small>${names}</small></div>
			<div>
				<button data-id="${t.id}" class="editTrip">Editar</button>
				<button data-id="${t.id}" class="delTrip">Eliminar</button>
			</div>`;
			list.appendChild(li);
		}
		for (const b of list.querySelectorAll('.delTrip')) { b.addEventListener('click', (e)=>{ deleteTrip(e.target.dataset.id); }); }
		for (const b of list.querySelectorAll('.editTrip')) { b.addEventListener('click', (e)=>{
			const id = e.target.dataset.id;
			const t = getTrips().find(x=>x.id===id);
			if(!t) return;
			document.getElementById('tripId').value = t.id;
			document.getElementById('tripName').value = t.name;
			document.getElementById('tripDesc').value = t.description;
			const sel = document.getElementById('tripDestinations');
			for (const opt of sel.options) { opt.selected = t.destinations.includes(opt.value); }
			window.scrollTo(0,0);
		}); }
	}

	async function populateDestinationSelect(selectId, includePlaceholder=false){
		const el = document.getElementById(selectId);
		if(!el) return;
		el.innerHTML = '';
		if(includePlaceholder) el.appendChild(new Option('-- seleccionar --',''));
		
		try {
			const destinations = await getDestinations();
			for (const d of destinations) { 
				el.appendChild(new Option(`${d.name} (${d.country||''})`, d._id || d.id)); 
			}
		} catch(e) {
			console.error('Error cargando destinos para select:', e);
		}
	}

	async function populateTripSelect(selectId){
		const el = document.getElementById(selectId);
		if(!el) return;
		el.innerHTML = '<option value="">-- Selecciona un viaje --</option>';
		
		try {
			// Intentar cargar desde la API primero
			const response = await fetch('/api/trips/1/50', {
				credentials: 'include'
			});
			
			if (response.ok) {
				const data = await response.json();
				const trips = data.items || [];
				
				// Solo mostrar trips con ID válido de MongoDB
				const validTrips = trips.filter(t => {
					const id = t._id || t.id;
					return id && typeof id === 'string' && id.length === 24 && /^[0-9a-fA-F]{24}$/.test(id);
				});
				
				for (const t of validTrips) { 
					const tripId = t._id || t.id;
					const tripName = t.title || t.name || t.destination || 'Viaje sin nombre';
					el.appendChild(new Option(tripName, tripId)); 
				}
				
				if (validTrips.length > 0) {
					console.log(`Loaded ${validTrips.length} trips from API`);
					return;
				}
			}
		} catch (err) {
			console.warn('Error cargando trips desde API para selector:', err.message);
		}
		
		// Fallback: usar localStorage con la clave correcta
		console.info('ℹ️ Cargando viajes desde almacenamiento local');
		try {
			const localTrips = JSON.parse(localStorage.getItem('trips')) || [];
			
			// Solo mostrar trips con ID válido
			const validLocalTrips = localTrips.filter(t => {
				const id = t._id || t.id;
				return id && typeof id === 'string' && id.length === 24 && /^[0-9a-fA-F]{24}$/.test(id);
			});
			
			for (const t of validLocalTrips) { 
				const tripId = t._id || t.id;
				const tripName = t.title || t.name || t.destination || 'Viaje sin nombre';
				el.appendChild(new Option(tripName, tripId)); 
			}
			
			// También incluir trips del formato antiguo por compatibilidad (pero sin IDs locales)
			const oldTrips = getTrips().filter(t => {
				const id = t._id || t.id;
				return id && /^[0-9a-fA-F]{24}$/.test(id);
			});
			for (const t of oldTrips) { 
				el.appendChild(new Option(t.name, t.id)); 
			}
		} catch (e) {
			console.error('Error cargando trips desde localStorage:', e);
		}
	}

	function renderWeatherRecords(){
		const ul = document.getElementById('weatherList');
		if(!ul) return;
		const arr = read(ls.weatherKey);
		ul.innerHTML = '';
		for (const r of arr) {
			const li = document.createElement('li');
			li.innerHTML = `<div><strong>${r.destName}</strong> ${r.temp}°C - ${r.condition}<br><small>${r.date}</small></div>`;
			ul.appendChild(li);
		}
	}

	function renderBudget(tripId){
		const summary = document.getElementById('budgetSummary');
		const list = document.getElementById('expenseList');
		if(!summary || !list) return;
		const b = getBudget(tripId);
		const totalExp = (b.expenses||[]).reduce((s,x)=>s+x.amt,0);
		const state = totalExp <= (b.amount||0) ? 'Dentro del presupuesto' : 'Sobre presupuesto';
		summary.innerText = `Presupuesto: ${b.amount.toFixed(2)} | Gastos: ${totalExp.toFixed(2)} | Estado: ${state}`;
		list.innerHTML = '';
		for (const e of (b.expenses||[])) {
			const li = document.createElement('li');
			li.innerHTML = `<div>${e.desc} — ${e.amt.toFixed(2)}</div>`;
			list.appendChild(li);
		}
	}

	// API público
	return {
		renderDestinations, // Deprecated: usar destinations.js
		getDestinations, // Ahora async, retorna Promise
		renderTrips,
		saveTrip,
		populateDestinationSelect, // Ahora async
		populateTripSelect, // Ahora async
		populateDestinationSelectAll: populateDestinationSelect,
		calculateRoute, // Ahora async
		getSimulatedWeather, // Ahora async
		saveWeather,
		renderWeatherRecords,
		saveBudget,
		addExpense,
		renderBudget,
		generateItinerary, // Ahora async
		saveItinerary
	};
})();