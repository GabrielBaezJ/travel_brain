const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");

// GET /api/destinations/:id/rates/stats
router.get('/api/destinations/:id/rates/stats', async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, message: 'ID inválido' });
    }

    const ratesCol = req.app.locals.db.collection('rates');
    
    const rates = await ratesCol.find({ destinationId: new ObjectId(id) }).toArray();
    
    if (rates.length === 0) {
      return res.json({
        ok: true,
        stats: {
          average: 0,
          count: 0,
          distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        }
      });
    }

    const sum = rates.reduce((acc, r) => acc + (r.rating || 0), 0);
    const average = sum / rates.length;

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    rates.forEach(r => {
      const rating = r.rating || 0;
      if (rating >= 1 && rating <= 5) {
        distribution[Math.floor(rating)]++;
      }
    });

    res.json({
      ok: true,
      stats: {
        average: Math.round(average * 10) / 10,
        count: rates.length,
        distribution
      }
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ ok: false, message: 'Error obteniendo estadísticas' });
  }
});

// GET /api/destinations/:id/rates/me
router.get('/api/destinations/:id/rates/me', async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ ok: false, message: 'No autorizado' });
    }

    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, message: 'ID inválido' });
    }

    const ratesCol = req.app.locals.db.collection('rates');
    const rate = await ratesCol.findOne({
      destinationId: new ObjectId(id),
      userId: new ObjectId(req.user.id)
    });

    if (!rate) {
      return res.status(404).json({ ok: false, message: 'Calificación no encontrada' });
    }

    res.json({
      ok: true,
      data: {
        ...rate,
        _id: rate._id.toString(),
        destinationId: rate.destinationId.toString(),
        userId: rate.userId.toString()
      }
    });
  } catch (error) {
    console.error('Error obteniendo mi calificación:', error);
    res.status(500).json({ ok: false, message: 'Error obteniendo calificación' });
  }
});

// GET /api/destinations/:id/rates/:page/:size
router.get('/api/destinations/:id/rates/:page/:size', async (req, res) => {
  try {
    const { id, page, size } = req.params;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const sizeNum = Math.max(1, Math.min(100, parseInt(size) || 10));
    const skip = (pageNum - 1) * sizeNum;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, message: 'ID inválido' });
    }

    const ratesCol = req.app.locals.db.collection('rates');
    
    const total = await ratesCol.countDocuments({ destinationId: new ObjectId(id) });
    const rates = await ratesCol
      .find({ destinationId: new ObjectId(id) })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(sizeNum)
      .toArray();

    res.json({
      ok: true,
      data: rates.map(r => ({
        ...r,
        _id: r._id.toString(),
        destinationId: r.destinationId.toString(),
        userId: r.userId.toString()
      })),
      pagination: {
        page: pageNum,
        size: sizeNum,
        total,
        pages: Math.ceil(total / sizeNum)
      }
    });
  } catch (error) {
    console.error('Error obteniendo calificaciones:', error);
    res.status(500).json({ ok: false, message: 'Error obteniendo calificaciones' });
  }
});

// POST /api/destinations/:id/rate
router.post('/api/destinations/:id/rate', async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ ok: false, message: 'No autorizado' });
    }

    const { id } = req.params;
    const { rating, comment } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, message: 'ID inválido' });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ ok: false, message: 'Rating debe estar entre 1 y 5' });
    }

    const ratesCol = req.app.locals.db.collection('rates');

    // Verificar si ya existe una calificación
    const existing = await ratesCol.findOne({
      destinationId: new ObjectId(id),
      userId: new ObjectId(req.user.id)
    });

    if (existing) {
      // Actualizar
      await ratesCol.updateOne(
        { _id: existing._id },
        {
          $set: {
            rating: parseFloat(rating),
            comment: comment || '',
            updatedAt: new Date()
          }
        }
      );

      return res.json({
        ok: true,
        message: 'Calificación actualizada exitosamente'
      });
    }

    // Crear nueva
    const newRate = {
      destinationId: new ObjectId(id),
      userId: new ObjectId(req.user.id),
      rating: parseFloat(rating),
      comment: comment || '',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await ratesCol.insertOne(newRate);

    res.status(201).json({
      ok: true,
      message: 'Calificación creada exitosamente'
    });
  } catch (error) {
    console.error('Error calificando destino:', error);
    res.status(500).json({ ok: false, message: 'Error calificando destino' });
  }
});

// POST /api/destinations/:id/favorite
router.post('/api/destinations/:id/favorite', async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ ok: false, message: 'No autorizado' });
    }

    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, message: 'ID inválido' });
    }

    const favoritesCol = req.app.locals.db.collection('favorites');

    // Verificar si ya es favorito
    const existing = await favoritesCol.findOne({
      destinationId: new ObjectId(id),
      userId: new ObjectId(req.user.id)
    });

    if (existing) {
      // Eliminar de favoritos
      await favoritesCol.deleteOne({ _id: existing._id });
      return res.json({
        ok: true,
        message: 'Eliminado de favoritos',
        isFavorite: false
      });
    }

    // Agregar a favoritos
    const newFavorite = {
      destinationId: new ObjectId(id),
      userId: new ObjectId(req.user.id),
      createdAt: new Date()
    };

    await favoritesCol.insertOne(newFavorite);

    res.json({
      ok: true,
      message: 'Agregado a favoritos',
      isFavorite: true
    });
  } catch (error) {
    console.error('Error toggleando favorito:', error);
    res.status(500).json({ ok: false, message: 'Error procesando favorito' });
  }
});

// DELETE /api/destinations/:id/rates/me
router.delete('/api/destinations/:id/rates/me', async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ ok: false, message: 'No autorizado' });
    }

    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, message: 'ID inválido' });
    }

    const ratesCol = req.app.locals.db.collection('rates');
    const result = await ratesCol.deleteOne({
      destinationId: new ObjectId(id),
      userId: new ObjectId(req.user.id)
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ ok: false, message: 'Calificación no encontrada' });
    }

    res.json({
      ok: true,
      message: 'Calificación eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando calificación:', error);
    res.status(500).json({ ok: false, message: 'Error eliminando calificación' });
  }
});

// GET /api/users/me/rates/:page/:size
router.get('/api/users/me/rates/:page/:size', async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ ok: false, message: 'No autorizado' });
    }

    const page = Math.max(1, parseInt(req.params.page) || 1);
    const size = Math.max(1, Math.min(100, parseInt(req.params.size) || 10));
    const skip = (page - 1) * size;

    const ratesCol = req.app.locals.db.collection('rates');
    
    const total = await ratesCol.countDocuments({ userId: new ObjectId(req.user.id) });
    const rates = await ratesCol
      .find({ userId: new ObjectId(req.user.id) })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(size)
      .toArray();

    res.json({
      ok: true,
      data: rates.map(r => ({
        ...r,
        _id: r._id.toString(),
        destinationId: r.destinationId.toString(),
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
    console.error('Error obteniendo mis calificaciones:', error);
    res.status(500).json({ ok: false, message: 'Error obteniendo calificaciones' });
  }
});

// GET /api/users/me/favorites
router.get('/api/users/me/favorites', async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ ok: false, message: 'No autorizado' });
    }

    const favoritesCol = req.app.locals.db.collection('favorites');
    const favorites = await favoritesCol
      .find({ userId: new ObjectId(req.user.id) })
      .sort({ createdAt: -1 })
      .toArray();

    res.json({
      ok: true,
      data: favorites.map(f => ({
        ...f,
        _id: f._id.toString(),
        destinationId: f.destinationId.toString(),
        userId: f.userId.toString()
      }))
    });
  } catch (error) {
    console.error('Error obteniendo favoritos:', error);
    res.status(500).json({ ok: false, message: 'Error obteniendo favoritos' });
  }
});

// PUT /api/rates/:id
router.put('/api/rates/:id', async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ ok: false, message: 'No autorizado' });
    }

    const { id } = req.params;
    const { rating, comment } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, message: 'ID inválido' });
    }

    const ratesCol = req.app.locals.db.collection('rates');
    
    const updateData = { updatedAt: new Date() };
    if (rating) updateData.rating = parseFloat(rating);
    if (comment !== undefined) updateData.comment = comment;

    const result = await ratesCol.updateOne(
      { _id: new ObjectId(id), userId: new ObjectId(req.user.id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ ok: false, message: 'Calificación no encontrada' });
    }

    res.json({
      ok: true,
      message: 'Calificación actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error actualizando calificación:', error);
    res.status(500).json({ ok: false, message: 'Error actualizando calificación' });
  }
});

module.exports = router;
