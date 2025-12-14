const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");

// Importar middleware de autenticación
const { authenticateToken, requireAdmin } = require("./authRoutes");

// GET /api/admin/metrics
router.get('/api/admin/metrics', authenticateToken, requireAdmin, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      return res.status(403).json({ ok: false, message: 'Acceso denegado' });
    }

    const db = req.app.locals.db;
    
    const usersTotal = await db.collection('users').countDocuments();
    const usersActive = await db.collection('users').countDocuments({ status: 'ACTIVE' });
    const usersDeactivated = await db.collection('users').countDocuments({ status: 'DEACTIVATED' });
    const destinations = await db.collection('destinations').countDocuments();
    const trips = await db.collection('trips').countDocuments();
    const itineraries = await db.collection('itineraries').countDocuments();
    const routes = await db.collection('favorite_routes').countDocuments();

    res.json({
      ok: true,
      usersTotal,
      usersActive,
      usersDeactivated,
      destinations,
      trips,
      itineraries,
      routes
    });
  } catch (error) {
    console.error('Error obteniendo métricas:', error);
    res.status(500).json({ ok: false, message: 'Error obteniendo métricas' });
  }
});

// GET /api/admin/users/:page/:size
router.get('/api/admin/users/:page/:size', authenticateToken, requireAdmin, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      return res.status(403).json({ ok: false, message: 'Acceso denegado' });
    }

    const page = Math.max(1, parseInt(req.params.page) || 1);
    const size = Math.max(1, Math.min(100, parseInt(req.params.size) || 10));
    const skip = (page - 1) * size;

    const usersCol = req.app.locals.db.collection('users');
    
    const total = await usersCol.countDocuments();
    const users = await usersCol
      .find({}, { projection: { passwordHash: 0 } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(size)
      .toArray();

    res.json({
      ok: true,
      data: users.map(u => ({
        ...u,
        _id: u._id.toString()
      })),
      pagination: {
        page,
        size,
        total,
        pages: Math.ceil(total / size)
      }
    });
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({ ok: false, message: 'Error obteniendo usuarios' });
  }
});

// PATCH /api/admin/users/:userId/role
router.patch('/api/admin/users/:userId/role', authenticateToken, requireAdmin, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      return res.status(403).json({ ok: false, message: 'Acceso denegado' });
    }

    const { userId } = req.params;
    const { role } = req.body;

    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ ok: false, message: 'ID inválido' });
    }

    if (!['USER', 'ADMIN'].includes(role)) {
      return res.status(400).json({ ok: false, message: 'Rol inválido' });
    }

    const usersCol = req.app.locals.db.collection('users');
    const result = await usersCol.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { role, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ ok: false, message: 'Usuario no encontrado' });
    }

    res.json({
      ok: true,
      message: 'Rol actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error actualizando rol:', error);
    res.status(500).json({ ok: false, message: 'Error actualizando rol' });
  }
});

// PATCH /api/admin/users/:userId/status
router.patch('/api/admin/users/:userId/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      return res.status(403).json({ ok: false, message: 'Acceso denegado' });
    }

    const { userId } = req.params;
    const { status } = req.body;

    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ ok: false, message: 'ID inválido' });
    }

    if (!['ACTIVE', 'DEACTIVATED'].includes(status)) {
      return res.status(400).json({ ok: false, message: 'Estado inválido' });
    }

    const usersCol = req.app.locals.db.collection('users');
    const result = await usersCol.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { status, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ ok: false, message: 'Usuario no encontrado' });
    }

    res.json({
      ok: true,
      message: 'Estado actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error actualizando estado:', error);
    res.status(500).json({ ok: false, message: 'Error actualizando estado' });
  }
});

// DELETE /api/admin/users/:userId
router.delete('/api/admin/users/:userId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      return res.status(403).json({ ok: false, message: 'Acceso denegado' });
    }

    const { userId } = req.params;

    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ ok: false, message: 'ID inválido' });
    }

    const usersCol = req.app.locals.db.collection('users');
    const result = await usersCol.deleteOne({ _id: new ObjectId(userId) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ ok: false, message: 'Usuario no encontrado' });
    }

    res.json({
      ok: true,
      message: 'Usuario eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando usuario:', error);
    res.status(500).json({ ok: false, message: 'Error eliminando usuario' });
  }
});

module.exports = router;
