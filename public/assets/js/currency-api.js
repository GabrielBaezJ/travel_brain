// public/assets/js/currency-api.js
(function(global){
  const BASE_URL = '/api/currency';

  async function request(path, options = {}) {
    const config = {
      method: options.method || 'GET',
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      credentials: 'include',
    };

    if (options.body !== undefined) {
      config.body = JSON.stringify(options.body);
    }

    const response = await fetch(`${BASE_URL}${path}`, config);
    const data = await response.json().catch(() => ({}));

    if (!response.ok || data?.ok === false) {
      const error = new Error(data?.msg || `Error ${response.status}`);
      error.status = response.status;
      error.payload = data;
      throw error;
    }

    return data;
  }

  const api = {
    async listRates() {
      return request('/rates');
    },
    async convert(payload) {
      const body = {
        from: payload.from,
        to: payload.to,
        amount: Number(payload.amount),
      };
      return request('/convert', { method: 'POST', body });
    }
  };

  global.CurrencyAPI = api;
})(globalThis);
