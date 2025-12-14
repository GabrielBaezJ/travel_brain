(function(){
  const $ = (s)=>document.querySelector(s);
  const $$ = (s)=>Array.from(document.querySelectorAll(s));

  async function api(url, opts={}){
    const res = await fetch(url, {
      method: opts.method || 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: opts.body ? JSON.stringify(opts.body) : undefined
    });
    const data = await res.json().catch(()=>({}));
    if (!res.ok) throw new Error(data.msg || `HTTP ${res.status}`);
    return data;
  }

  function renderUsers(rows){
    const tbody = $('#usersTable tbody');
    tbody.innerHTML = '';
    for (const u of rows) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${u.username||''}</td>
        <td>${u.email||''}</td>
        <td>${u.name||''}</td>
        <td>${u.role||''}</td>
        <td>${u.status||''}</td>
        <td>
          <button class="btn-view" data-id="${u._id}">Ver</button>
          <button class="btn-admin" data-id="${u._id}">Hacer ADMIN</button>
          <button class="btn-deact" data-id="${u._id}">Desactivar</button>
        </td>`;
      tbody.appendChild(tr);
    }
    // bind actions
    for (const b of $$('.btn-view')) { b.addEventListener('click', () => loadUser(b.dataset.id)); }
    for (const b of $$('.btn-admin')) { b.addEventListener('click', () => updateUser(b.dataset.id, { role:'ADMIN' })); }
    for (const b of $$('.btn-deact')) { b.addEventListener('click', () => deactivateUser(b.dataset.id)); }
  }

  async function loadPage(){
    try{
      const size = parseInt($('#pageSize').value || '10', 10);
      const data = await api(`/api/admin/users/1/${size}`);
      renderUsers(data.items || data.users || []);
    }catch(err){ alert('Error cargando usuarios: '+ err.message); }
  }

  async function loadUser(id){
    try{
      const data = await api(`/api/admin/users/${id}`);
      const u = data.user || {};
      $('#userDetail').innerHTML = `
        <div><strong>${u.username||''}</strong> <small>${u.email||''}</small></div>
        <div>Nombre: ${u.name||''}</div>
        <div>Rol: ${u.role||''}</div>
        <div>Estado: ${u.status||''}</div>
      `;
      $('#editRole').value = u.role || 'REGISTERED';
      $('#editStatus').value = u.status || 'ACTIVE';
      $('#userDetailSection').style.display = '';
      $('#saveUserBtn').onclick = async ()=>{
        try {
          await api(`/api/admin/users/${id}`, { method:'PUT', body: { role: $('#editRole').value, status: $('#editStatus').value } });
          await loadPage();
          alert('Usuario actualizado');
        } catch(err){ alert('Error al actualizar: ' + err.message); }
      };
    }catch(err){ alert('Error cargando detalle: ' + err.message); }
  }

  async function updateUser(id, body){
    try{ await api(`/api/admin/users/${id}`, { method:'PUT', body }); await loadPage(); }
    catch(err){ alert('Error: ' + err.message); }
  }

  async function deactivateUser(id){
    if (!confirm('¿Desactivar usuario?')) return;
    try{ await api(`/api/admin/users/${id}`, { method:'DELETE' }); await loadPage(); }
    catch(err){ alert('Error: ' + err.message); }
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    $('#reloadBtn').addEventListener('click', loadPage);
    loadPage();
  });
})();
