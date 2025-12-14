// public/assets/js/layout.js
(function(){
  function ensureHeader(){
    const body = document.body;
    let header = document.querySelector('.site-header');

    // Build standard nav links
    const links = [
      { href: '/', label: '🏠 Inicio' },
      { href: '/destinations', label: 'Destinos' },
      { href: '/trips', label: 'Viajes' },
      { href: '/routes', label: 'Rutas' },
      { href: '/weather', label: 'Clima' },
      { href: '/budget', label: 'Presupuesto' },
      { href: '/itinerary', label: 'Itinerario' },
      { href: '/currency', label: 'Divisas (Frankfurter)' },
      { href: '/admin/users', label: 'Usuarios' }
    ];

    function buildHeader(){
      const h = document.createElement('header');
      h.className = 'site-header';
      const container = document.createElement('div');
      container.className = 'container-fluid';
      const title = document.createElement('h1');
      title.textContent = 'Intelligent Travel Planner';
      const nav = document.createElement('nav');
      container.appendChild(title);
      container.appendChild(nav);
      h.appendChild(container);
      for (const l of links) {
        const a = document.createElement('a');
        a.href = l.href;
        a.textContent = l.label;
        nav.appendChild(a);
      }
      // Auth links + user area
      const aLogin = document.createElement('a');
      aLogin.href = '/auth/login';
      aLogin.textContent = 'Login';
      nav.appendChild(aLogin);
      const aReg = document.createElement('a');
      aReg.href = '/auth/register';
      aReg.textContent = 'Registro';
      nav.appendChild(aReg);
      const span = document.createElement('span');
      span.id = 'userArea';
      span.style.marginLeft = '12px';
      nav.appendChild(span);
      return h;
    }

    function ensureContainer(headerEl){
      let container = headerEl.querySelector('.container-fluid');
      if (!container){
        container = document.createElement('div');
        container.className = 'container-fluid';
        const fragment = document.createDocumentFragment();
        while (headerEl.firstChild) {
          fragment.appendChild(headerEl.firstChild);
        }
        // Try to preserve heading first if it exists
        const existingHeading = Array.from(fragment.childNodes).find(node => node.tagName && node.tagName.toLowerCase() === 'h1');
        if (existingHeading) {
          container.appendChild(existingHeading);
        }
        const existingNav = Array.from(fragment.childNodes).find(node => node.tagName && node.tagName.toLowerCase() === 'nav');
        if (existingNav) {
          container.appendChild(existingNav);
        }
        // Append the rest of the nodes in their original order
        container.appendChild(fragment);
        headerEl.appendChild(container);
      }
      return container;
    }

    if (!header){
      header = buildHeader();
      // Insert at top of body
      if (body.firstChild) body.insertBefore(header, body.firstChild);
      else body.appendChild(header);
    } else {
      const container = ensureContainer(header);
      // Normalize heading placement
      let heading = container.querySelector('h1');
      if (!heading){
        heading = document.createElement('h1');
        heading.textContent = 'Intelligent Travel Planner';
        container.insertBefore(heading, container.firstChild || null);
      }
      // Normalize existing nav: ensure links, login/register and #userArea exist
      let nav = container.querySelector('nav');
      if (!nav){
        nav = document.createElement('nav');
        container.appendChild(nav);
      } else if (nav.parentElement !== container) {
        container.appendChild(nav);
      }
      if (heading && heading.nextSibling && heading.parentElement === container && nav.previousElementSibling !== heading) {
        container.insertBefore(nav, heading.nextSibling);
      }
      const existingHrefs = new Set(Array.from(nav.querySelectorAll('a')).map(a => a.getAttribute('href')));
      for (const l of links) {
        if (!existingHrefs.has(l.href)){
          const a = document.createElement('a');
          a.href = l.href; a.textContent = l.label; nav.appendChild(a);
        }
      }
      if (!nav.querySelector('a[href="/auth/login"]')){
        const a = document.createElement('a'); a.href = '/auth/login'; a.textContent = 'Login'; nav.appendChild(a);
      }
      if (!nav.querySelector('a[href="/auth/register"]')){
        const a = document.createElement('a'); a.href = '/auth/register'; a.textContent = 'Registro'; nav.appendChild(a);
      }
      if (!document.getElementById('userArea')){
        const span = document.createElement('span'); span.id = 'userArea'; span.style.marginLeft = '12px'; nav.appendChild(span);
      }
    }
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', ensureHeader);
  } else {
    ensureHeader();
  }
})();
