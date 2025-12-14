const express = require("express");
const router = express.Router();
const axios = require("axios");
const NodeCache = require("node-cache");

// Cache para tasas de cambio (TTL: 1 hora)
const cache = new NodeCache({ stdTTL: 3600 });

// GET /api/currency/rates/:base
router.get('/api/currency/rates/:base', async (req, res) => {
  try {
    const { base } = req.params;
    const cacheKey = `rates_${base}`;
    
    // Verificar cache
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // Llamar a la API de Frankfurter (gratis, sin API key)
    const response = await axios.get(`https://api.frankfurter.app/latest?from=${base}`);
    
    const result = {
      ok: true,
      base: response.data.base,
      date: response.data.date,
      rates: response.data.rates
    };

    // Guardar en cache
    cache.set(cacheKey, result);

    res.json(result);
  } catch (error) {
    console.error('Error obteniendo tasas:', error.message);
    res.status(500).json({
      ok: false,
      message: 'Error obteniendo tasas de cambio'
    });
  }
});

// POST /api/currency/convert
router.post('/api/currency/convert', async (req, res) => {
  try {
    const { amount, from, to } = req.body;

    if (!amount || !from || !to) {
      return res.status(400).json({
        ok: false,
        message: 'Faltan parámetros: amount, from, to'
      });
    }

    const response = await axios.get(
      `https://api.frankfurter.app/latest?amount=${amount}&from=${from}&to=${to}`
    );

    res.json({
      ok: true,
      amount: parseFloat(amount),
      from: response.data.base,
      to: to,
      result: response.data.rates[to],
      date: response.data.date
    });
  } catch (error) {
    console.error('Error convirtiendo moneda:', error.message);
    res.status(500).json({
      ok: false,
      message: 'Error convirtiendo moneda'
    });
  }
});

// GET /api/currency/convert/:amount/:from/:to
router.get('/api/currency/convert/:amount/:from/:to', async (req, res) => {
  try {
    const { amount, from, to } = req.params;

    const response = await axios.get(
      `https://api.frankfurter.app/latest?amount=${amount}&from=${from}&to=${to}`
    );

    res.json({
      ok: true,
      amount: parseFloat(amount),
      from: response.data.base,
      to: to,
      result: response.data.rates[to],
      date: response.data.date
    });
  } catch (error) {
    console.error('Error convirtiendo moneda:', error.message);
    res.status(500).json({
      ok: false,
      message: 'Error convirtiendo moneda'
    });
  }
});

module.exports = router;
