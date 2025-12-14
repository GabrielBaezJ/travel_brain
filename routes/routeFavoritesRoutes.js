const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");

// GET /api/routes/favorites/:page/:size
router.get('/api/routes/favorites/:page/:size', async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ ok: false, message: 'No autorizado' });
    }

    const page = Math.max(1, parseInt(req.params.page) || 1);
    const size = Math.max(1, Math.min(100, parseInt(req.params.size) || 10));
    const skip = (page - 1) * size;

    const routesCol = req.app.locals.db.collection('favorite_routes');
    
    const total = await routesCol.countDocuments({ userId: new ObjectId(req.user.id) });
    const routes = await routesCol
      .find({ userId: new ObjectId(req.user.id) })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(size)
      .toArray();

    res.json({
      ok: true,
      data: routes.map(r => ({
        ...r,
        _id: r._id.toString(),
        userId: r.userId.toString()
      })),
      pagination: {
        page,
        size,
        total,
        pages: Math.ceil(total / size)
      }
    });
  } catch (error) {
    console.error('Error obteniendo rutas favoritas:', error);
    res.status(500).json({ ok: false, message: 'Error obteniendo rutas favoritas' });
  }
});

// POST /api/routes/favorites
router.post('/api/routes/favorites', async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ ok: false, message: 'No autorizado' });
    }

    const { origin, destination, distance, duration, routeData } = req.body;

    if (!origin || !destination) {
      return res.status(400).json({ ok: false, message: 'Faltan campos requeridos: origin, destination' });
    }

    const routesCol = req.app.locals.db.collection('favorite_routes');

    const newRoute = {
      userId: new ObjectId(req.user.id),
      origin,
      destination,
      distance: distance || null,
      duration: duration || null,
      routeData: routeData || {},
      createdAt: new Date()
    };

    const result = await routesCol.insertOne(newRoute);

    res.status(201).json({
      ok: true,
      message: 'Ruta guardada en favoritos exitosamente',
      data: {
        _id: result.insertedId.toString(),
        ...newRoute,
        userId: req.user.id
      }
    });
  } catch (error) {
    console.error('Error guardando ruta favorita:', error);
    res.status(500).json({ ok: false, message: 'Error guardando ruta favorita' });
  }
});

// DELETE /api/routes/favorites/:id
router.delete('/api/routes/favorites/:id', async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ ok: false, message: 'No autorizado' });
    }

    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, message: 'ID inválido' });
    }

    const routesCol = req.app.locals.db.collection('favorite_routes');
    const result = await routesCol.deleteOne({
      _id: new ObjectId(id),
      userId: new ObjectId(req.user.id)
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ ok: false, message: 'Ruta favorita no encontrada' });
    }

    res.json({
      ok: true,
      message: 'Ruta favorita eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando ruta favorita:', error);
    res.status(500).json({ ok: false, message: 'Error eliminando ruta favorita' });
  }
});

module.exports = router;
