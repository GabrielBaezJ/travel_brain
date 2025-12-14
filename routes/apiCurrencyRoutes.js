const express = require("express");
const router = express.Router();
const axios = require("axios");

// GET /api/currency/rates/:base
router.get('/api/currency/rates/:base', async (req, res) => {
  try {
    const { base } = req.params;
    const response = await axios.get(`https://api.frankfurter.app/latest?from=${base}`);
    res.json({ ok: true, base: response.data.base, rates: response.data.rates });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error obteniendo tasas' });
  }
});

// POST /api/currency/convert
router.post('/api/currency/convert', async (req, res) => {
  try {
    const { amount, from, to } = req.body;
    const response = await axios.get(`https://api.frankfurter.app/latest?amount=${amount}&from=${from}&to=${to}`);
    res.json({ ok: true, result: response.data.rates[to] });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error convirtiendo' });
  }
});

module.exports = router;
