const express = require("express");
const router = express.Router();

// GET /api/weather/history/:page/:size
router.get('/api/weather/history/:page/:size', async (req, res) => {
  res.json({ ok: true, data: [], pagination: { page: 1, size: 10, total: 0 } });
});

// GET /api/admin/users/:userId
router.get('/api/admin/users/:userId', async (req, res) => {
  res.json({ ok: true, user: {} });
});

// DELETE /api/admin/users/:userId
router.delete('/api/admin/users/:userId', async (req, res) => {
  res.json({ ok: true, message: 'Usuario eliminado' });
});

// PATCH /api/admin/users/:userId
router.patch('/api/admin/users/:userId', async (req, res) => {
  res.json({ ok: true, message: 'Usuario actualizado' });
});

module.exports = router;
