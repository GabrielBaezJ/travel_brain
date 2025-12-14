// Minimal JSON fetch helper with credentials included
(function(){
	async function apiJson(url, opts = {}){
		const init = {
			method: opts.method || 'GET',
			headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
			credentials: 'include',
			body: opts.body || undefined
		};
		// If body is a plain object and Content-Type is json, ensure stringified
		const ct = (init.headers['Content-Type'] || init.headers['content-type'] || '').toLowerCase();
		if (init.body && typeof init.body !== 'string' && ct.includes('application/json')){
			init.body = JSON.stringify(init.body);
		}

		const res = await fetch(url, init);
		let data = null;
		try { data = await res.json(); } catch(_) { data = null; }
		if (!res.ok){
			const err = new Error((data && (data.msg || data.error)) || `HTTP ${res.status}`);
			err.status = res.status;
			err.body = data;
			throw err;
		}
		return data;
	}

	globalThis.http = { apiJson };
})();
