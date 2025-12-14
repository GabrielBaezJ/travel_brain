const api = async (url, opts = {}) => {
  const res = await fetch(url, {
    method: opts.method || 'GET',
    headers: { 'Content-Type': 'application/json', ...(opts.headers||{}) },
    credentials: 'include',
    body: opts.body ? JSON.stringify(opts.body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // No loggear 401 como error, es un estado esperado cuando no hay sesión
    const errorMsg = data.msg || (res.status === 401 ? 'No autenticado' : `HTTP ${res.status}`);
    throw new Error(errorMsg);
  }
  return data;
};

window.Auth = {
  register: (payload) => api('/api/auth/register', { method: 'POST', body: payload }),
  login:    (payload) => api('/api/auth/login',    { method: 'POST', body: payload }),
  me:       ()        => api('/api/auth/me'),
  logout:   ()        => api('/api/auth/logout',   { method: 'POST' })
};

// UI helpers to reflect auth state in header
(function(){
  function q(sel){ return document.querySelector(sel); }

  async function renderUserArea(){
    const slot = document.getElementById('userArea');
    const loginLink = q('nav a[href="/auth/login"]');
    const registerLink = q('nav a[href="/auth/register"]');
    const nav = document.querySelector('header.site-header nav');
    if (!slot) return;
    const protectedHrefs = ['/destinations','/trips','/budget','/itinerary'];
    const setProtectedVisibility = (visible) => {
      if (!nav) return;
      for (const h of protectedHrefs) {
        const el = nav.querySelector(`a[href="${h}"]`);
        if (el) el.style.display = visible ? '' : 'none';
      }
    };

    try{
      const res = await (globalThis.Auth ? globalThis.Auth.me() : Promise.reject(new Error('Auth not available')));
      if (res?.ok){
        const user = res.user || {};
        const displayName = user.name || user.username || 'Usuario';
        slot.innerHTML = ` ${displayName} · <a href="#" id="logoutLink">Salir</a>`;
        if (loginLink) loginLink.style.display = 'none';
        if (registerLink) registerLink.style.display = 'none';
        // Show protected links for logged users
        setProtectedVisibility(true);
        // Ensure admin link for ADMIN users
        if (nav){
          const adminHref = '/admin/users';
          let adminLink = nav.querySelector(`a[href="${adminHref}"]`);
          if (String(user.role).toUpperCase() === 'ADMIN'){
            if (adminLink == null){
              adminLink = document.createElement('a');
              adminLink.href = adminHref; adminLink.textContent = 'Usuarios';
              // insert before userArea span
              slot.before(adminLink);
            } else {
              adminLink.style.display = '';
            }
          } else if (adminLink){
            adminLink.style.display = 'none';
          }
        }
        const logoutEl = document.getElementById('logoutLink');
        if (logoutEl){
          logoutEl.addEventListener('click', async (e)=>{
            e.preventDefault();
            try { await globalThis.Auth.logout(); }
            catch(err){ console.warn('Logout error (ignored):', err); }
            // Re-render header and go to home
            await renderUserArea();
            globalThis.location.href = '/';
          });
        }
      } else {
        // not logged
        slot.innerHTML = '';
        if (loginLink) loginLink.style.display = '';
        if (registerLink) registerLink.style.display = '';
        // hide protected links for guests
        setProtectedVisibility(false);
        // hide admin link if present
        if (nav){
          const adminLink = nav.querySelector('a[href="/admin/users"]');
          if (adminLink) adminLink.style.display = 'none';
        }
      }
    }catch(err){
      // 401 es esperado cuando no hay sesión, no es un error real
      if (!err.message.includes('No autenticado') && !err.message.includes('401')) {
        console.warn('⚠️ Error verificando autenticación:', err.message);
      }
      // 401 or error -> treat as not logged
      slot.innerHTML = '';
      if (loginLink) loginLink.style.display = '';
      if (registerLink) registerLink.style.display = '';
      const nav = document.querySelector('header.site-header nav');
      if (nav){
        const adminLink = nav.querySelector('a[href="/admin/users"]');
        if (adminLink) adminLink.style.display = 'none';
      }
      setProtectedVisibility(false);
    }
  }

  // Expose for other scripts (e.g., after login)
  if (!globalThis.Auth) { globalThis.Auth = {}; }
  globalThis.Auth.renderUserArea = renderUserArea;

  // Initialize on page load
  document.addEventListener('DOMContentLoaded', ()=>{
    // Only run if header area exists on this page
    if (document.getElementById('userArea')){
      renderUserArea();
    }
  });
})();
