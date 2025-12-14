(function(){
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));

  // Cache de usuarios para lookup rápido
  let usersMap = {};

  // API helper
  async function api(url) {
    const res = await fetch(url, { credentials: 'include' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  }

  // Cargar mapa de usuarios (id -> nombre)
  async function loadUsersMap() {
    try {
      const d = await api('/api/admin/users/1/100');
      const users = d.items || d.users || [];
      usersMap = {};
      for (const u of users) {
        const id = u._id?.$oid || u._id || '';
        usersMap[id] = u.username || u.name || u.email || 'Usuario';
      }
    } catch (e) {
      console.warn('Error loading users map:', e.message);
    }
  }

  // Obtener nombre de usuario por ID
  function getUserName(userId) {
    if (!userId) return '-';
    // Extraer ID si viene en formato ObjectId
    const id = userId.$oid || userId;
    if (usersMap[id]) {
      return usersMap[id];
    }
    // Si no está en el mapa, mostrar ID corto
    return typeof id === 'string' ? id.substring(0, 8) + '...' : '-';
  }

  // Show section
  function showSection(section) {
    $$('main section').forEach(el => el.classList.remove('active'));
    const target = $('#section-' + section);
    if (target) target.classList.add('active');
  }

  // Load metrics for overview
  async function loadMetrics() {
    try {
      const m = await api('/api/admin/metrics');
      $('#metric-users-total').textContent = m.usersTotal ?? '-';
      $('#metric-users-active').textContent = m.usersActive ?? '-';
      $('#metric-users-deact').textContent = m.usersDeactivated ?? '-';
      $('#metric-destinations').textContent = m.destinations ?? '-';
      $('#metric-trips').textContent = m.trips ?? '-';
      $('#metric-itins').textContent = m.itineraries ?? '-';
      $('#metric-routes').textContent = m.routes ?? '-';
    } catch (e) {
      console.warn('metrics error', e.message);
    }
  }

  // Load admin name
  async function loadAdminName() {
    try {
      const me = await api('/api/auth/me');
      const name = (me && me.user && (me.user.name || me.user.username || me.user.email)) || 'Admin';
      const target = $('#adminName');
      if (target) target.textContent = name;
    } catch (e) { /* ignore */ }
  }

  // Load users
  async function loadUsers() {
    try {
      const d = await api('/api/admin/users/1/50');
      const rows = d.items || d.users || [];
      const tbody = $('#usersTable tbody');
      tbody.innerHTML = '';
      
      if (rows.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No hay usuarios registrados</td></tr>';
        return;
      }
      
      for (const u of rows) {
        const tr = document.createElement('tr');
        const statusBadge = u.status === 'ACTIVE' 
          ? '<span class="badge badge-green">Activo</span>' 
          : '<span class="badge badge-red">Desactivado</span>';
        const roleBadge = u.role === 'ADMIN' 
          ? '<span class="badge badge-blue">Admin</span>' 
          : '<span class="badge badge-gray">Usuario</span>';
        
        tr.innerHTML = `
          <td>${u.username || u.name || '-'}</td>
          <td>${u.email || '-'}</td>
          <td>${roleBadge}</td>
          <td>${statusBadge}</td>
          <td>
            ${u.status === 'ACTIVE' ? `<button class="btn btn-danger" data-act="deact" data-id="${u._id}"><i class="fas fa-user-slash"></i> Desactivar</button>` : ''}
            ${u.status === 'DEACTIVATED' ? `<button class="btn btn-success" data-act="activate" data-id="${u._id}"><i class="fas fa-user-check"></i> Activar</button>` : ''}
          </td>`;
        tbody.appendChild(tr);
      }
    } catch (e) {
      console.warn('users error', e.message);
      $('#usersTable tbody').innerHTML = '<tr><td colspan="5" class="empty-state">Error al cargar usuarios</td></tr>';
    }
  }

  // Load destinations
  window.loadDestinations = async function() {
    try {
      const d = await api('/api/admin/destinations/1/50');
      const tbody = $('#destinationsTable tbody');
      tbody.innerHTML = '';
      const items = d.items || [];
      
      if (items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="empty-state">No hay destinos registrados</td></tr>';
        return;
      }
      
      for (const x of items) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${x.name || '-'}</td>
          <td>${x.country || '-'}</td>
          <td><span class="badge badge-blue">${x.category || '-'}</span></td>
          <td>${x.climate || x.weather || '-'}</td>`;
        tbody.appendChild(tr);
      }
    } catch (e) {
      console.warn('destinations error', e.message);
      $('#destinationsTable tbody').innerHTML = '<tr><td colspan="4" class="empty-state">Error al cargar destinos</td></tr>';
    }
  };

  // Load trips
  window.loadTrips = async function() {
    try {
      const d = await api('/api/admin/trips/1/50');
      const tbody = $('#tripsTable tbody');
      tbody.innerHTML = '';
      const items = d.items || [];
      
      if (items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No hay viajes registrados</td></tr>';
        return;
      }
      
      for (const t of items) {
        const tr = document.createElement('tr');
        const startDate = formatMongoDate(t.startDate);
        const endDate = formatMongoDate(t.endDate);
        const dates = startDate && endDate ? `${startDate} - ${endDate}` : '-';
        const budget = t.budget ? `$${t.budget}` : '-';
        const userName = getUserName(t.userId);
        
        tr.innerHTML = `
          <td>${t.title || t.name || '-'}</td>
          <td>${t.destination || '-'}</td>
          <td><span class="badge badge-gray">${userName}</span></td>
          <td>${dates}</td>
          <td><span class="badge badge-blue">${budget}</span></td>`;
        tbody.appendChild(tr);
      }
    } catch (e) {
      console.warn('trips error', e.message);
      $('#tripsTable tbody').innerHTML = '<tr><td colspan="5" class="empty-state">Error al cargar viajes</td></tr>';
    }
  };

  // Load itineraries
  window.loadItins = async function() {
    try {
      const d = await api('/api/admin/itineraries/1/50');
      const tbody = $('#itinsTable tbody');
      tbody.innerHTML = '';
      const items = d.items || [];
      
      if (items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="empty-state">No hay itinerarios registrados</td></tr>';
        return;
      }
      
      for (const it of items) {
        const tr = document.createElement('tr');
        const tripId = it.tripId?.$oid || it.tripId || '-';
        const days = it.totalDays || (it.days ? it.days.length : '-');
        const createdAt = formatMongoDate(it.createdAt);
        const userName = getUserName(it.userId);
        
        tr.innerHTML = `
          <td><span class="badge badge-gray">${userName}</span></td>
          <td>${days} días</td>
          <td><span class="badge badge-blue">${it.generatedBy || 'Manual'}</span></td>
          <td>${createdAt || '-'}</td>`;
        tbody.appendChild(tr);
      }
    } catch (e) {
      console.warn('itins error', e.message);
      $('#itinsTable tbody').innerHTML = '<tr><td colspan="4" class="empty-state">Error al cargar itinerarios</td></tr>';
    }
  };

  // Load routes
  window.loadRoutes = async function() {
    try {
      const d = await api('/api/admin/routes/1/50');
      const tbody = $('#routesTable tbody');
      tbody.innerHTML = '';
      const items = d.items || [];
      
      if (items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="empty-state">No hay rutas favoritas</td></tr>';
        return;
      }
      
      for (const r of items) {
        const tr = document.createElement('tr');
        // origin y destination son objetos con label
        const originLabel = r.origin?.label || (typeof r.origin === 'string' ? r.origin : '-');
        const destLabel = r.destination?.label || (typeof r.destination === 'string' ? r.destination : '-');
        const userName = getUserName(r.userId);
        
        tr.innerHTML = `
          <td>${r.name || '-'}</td>
          <td>${originLabel}</td>
          <td>${destLabel}</td>
          <td><span class="badge badge-gray">${userName}</span></td>`;
        tbody.appendChild(tr);
      }
    } catch (e) {
      console.warn('routes error', e.message);
      $('#routesTable tbody').innerHTML = '<tr><td colspan="4" class="empty-state">Error al cargar rutas</td></tr>';
    }
  };

  // Load expenses
  window.loadExpenses = async function() {
    try {
      const d = await api('/api/admin/expenses/1/50');
      const tbody = $('#expensesTable tbody');
      tbody.innerHTML = '';
      const items = d.items || [];
      
      if (items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="empty-state">No hay gastos registrados</td></tr>';
        return;
      }
      
      for (const e of items) {
        const tr = document.createElement('tr');
        const userName = getUserName(e.userId);
        tr.innerHTML = `
          <td>${e.description || e.name || '-'}</td>
          <td>$${e.amount || 0}</td>
          <td><span class="badge badge-blue">${e.category || '-'}</span></td>
          <td><span class="badge badge-gray">${userName}</span></td>`;
        tbody.appendChild(tr);
      }
    } catch (e) {
      console.warn('expenses error', e.message);
      $('#expensesTable tbody').innerHTML = '<tr><td colspan="4" class="empty-state">Error al cargar gastos</td></tr>';
    }
  };

  // Load weather searches
  window.loadWeather = async function() {
    try {
      const d = await api('/api/admin/weather/1/50');
      const tbody = $('#weatherTable tbody');
      tbody.innerHTML = '';
      const items = d.items || [];
      
      if (items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="empty-state">No hay búsquedas de clima</td></tr>';
        return;
      }
      
      for (const w of items) {
        const tr = document.createElement('tr');
        // label tiene formato "Ciudad, País" 
        const label = w.label || w.city || w.location || '-';
        const temp = w.temp !== undefined ? `${w.temp}°C` : (w.temperature ? `${w.temperature}°C` : '-');
        const condition = w.condition || '-';
        const createdAt = formatMongoDate(w.createdAt);
        
        tr.innerHTML = `
          <td>${label}</td>
          <td><span class="badge badge-blue">${condition}</span></td>
          <td>${temp}</td>
          <td>${createdAt || '-'}</td>`;
        tbody.appendChild(tr);
      }
    } catch (e) {
      console.warn('weather error', e.message);
      $('#weatherTable tbody').innerHTML = '<tr><td colspan="4" class="empty-state">Error al cargar búsquedas</td></tr>';
    }
  };

  // Format date helper
  function formatDate(dateStr) {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  }

  // Format MongoDB date (handles $date.$numberLong format)
  function formatMongoDate(dateObj) {
    if (!dateObj) return null;
    try {
      let timestamp;
      // MongoDB Extended JSON format: { $date: { $numberLong: "..." } }
      if (dateObj.$date) {
        if (dateObj.$date.$numberLong) {
          timestamp = parseInt(dateObj.$date.$numberLong, 10);
        } else {
          timestamp = new Date(dateObj.$date).getTime();
        }
      } else if (typeof dateObj === 'string') {
        timestamp = new Date(dateObj).getTime();
      } else if (typeof dateObj === 'number') {
        timestamp = dateObj;
      } else {
        return null;
      }
      
      const d = new Date(timestamp);
      if (isNaN(d.getTime())) return null;
      return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return null;
    }
  }

  // Extract user ID (handles ObjectId format)
  function extractUserId(userId) {
    if (!userId) return '-';
    // Si es objeto con $oid, extraer el valor
    if (userId.$oid) return userId.$oid.substring(0, 8) + '...';
    // Si es string, acortar
    if (typeof userId === 'string') return userId.substring(0, 8) + '...';
    return '-';
  }

  // User actions (deactivate/activate)
  async function handleUserAction(action, userId) {
    try {
      if (action === 'deact') {
        await fetch(`/api/admin/users/${userId}`, { method: 'DELETE', credentials: 'include' });
      } else if (action === 'activate') {
        await fetch(`/api/admin/users/${userId}`, { 
          method: 'PUT', 
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'ACTIVE' })
        });
      }
      await loadUsers();
      await loadMetrics();
    } catch (e) {
      alert('Error: ' + e.message);
    }
  }

  // Initialize
  document.addEventListener('DOMContentLoaded', () => {
    // Navigation
    $$('.nav-menu a').forEach(a => {
      a.addEventListener('click', (ev) => {
        ev.preventDefault();
        $$('.nav-menu a').forEach(l => l.classList.remove('active'));
        a.classList.add('active');
        
        const section = a.dataset.section;
        showSection(section);
        
        // Load data based on section
        switch (section) {
          case 'overview': loadMetrics(); break;
          case 'users': loadUsers(); break;
          case 'destinations': loadDestinations(); break;
          case 'trips': loadTrips(); break;
          case 'itineraries': loadItins(); break;
          case 'routes': loadRoutes(); break;
          case 'expenses': loadExpenses(); break;
          case 'weather': loadWeather(); break;
        }
      });
    });

    // Quick action cards
    $$('.quick-card').forEach(card => {
      card.addEventListener('click', () => {
        const target = card.dataset.nav;
        const link = $(`.nav-menu a[data-section="${target}"]`);
        if (link) link.click();
      });
    });

    // Users table actions (event delegation)
    $('#usersTable').addEventListener('click', (ev) => {
      const btn = ev.target.closest('button');
      if (!btn) return;
      const action = btn.dataset.act;
      const userId = btn.dataset.id;
      if (action && userId) {
        handleUserAction(action, userId);
      }
    });

    // Reload users button
    const reloadBtn = $('#reloadUsers');
    if (reloadBtn) {
      reloadBtn.addEventListener('click', loadUsers);
    }

    // Logout
    const logoutBtn = $('#logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
          await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
        } catch (err) {}
        location.href = '/auth/login';
      });
    }

    // Initial load
    loadUsersMap().then(() => {
      loadMetrics();
      loadAdminName();
    });
  });
})();
