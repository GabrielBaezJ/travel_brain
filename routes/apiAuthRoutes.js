const express = require("express");
const router = express.Router();

// POST /api/auth/register
router.post('/api/auth/register', async (req, res) => {
  res.json({ ok: true, message: 'Registro simulado - implementar con tu lógica' });
});

// POST /api/auth/login
router.post('/api/auth/login', async (req, res) => {
  res.json({ ok: true, message: 'Login simulado - implementar con tu lógica' });
});

// GET /api/auth/me
router.get('/api/auth/me', async (req, res) => {
  res.json({ ok: true, user: { username: 'guest' } });
});

// POST /api/auth/logout
router.post('/api/auth/logout', (req, res) => {
  res.json({ ok: true, message: 'Logout exitoso' });
});

module.exports = router;
