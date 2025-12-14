const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");

// Importar middleware de autenticación
const { authenticateToken } = require("./authRoutes");

// POST /api/trips/:tripId/itinerary
router.post('/api/trips/:tripId/itinerary', authenticateToken, async (req, res) => {
  try {
    const { tripId } = req.params;
    const { days, preferences } = req.body;

    if (!ObjectId.isValid(tripId)) {
      return res.status(400).json({ ok: false, message: 'ID de viaje inválido' });
    }

    const itinerariesCol = req.app.locals.db.collection('itineraries');
    const tripsCol = req.app.locals.db.collection('trips');

    // Verificar que el viaje existe
    const trip = await tripsCol.findOne({ _id: new ObjectId(tripId) });
    if (!trip) {
      return res.status(404).json({ ok: false, message: 'Viaje no encontrado' });
    }

    // Verificar si ya existe un itinerario para este viaje
    const existing = await itinerariesCol.findOne({ tripId: new ObjectId(tripId) });
    
    if (existing) {
      // Actualizar itinerario existente
      const result = await itinerariesCol.updateOne(
        { _id: existing._id },
        {
          $set: {
            days: days || [],
            preferences: preferences || {},
            updatedAt: new Date()
          }
        }
      );

      res.json({
        ok: true,
        message: 'Itinerario actualizado exitosamente',
        data: {
          _id: existing._id.toString(),
          tripId
        }
      });
    } else {
      // Crear nuevo itinerario
      const newItinerary = {
        tripId: new ObjectId(tripId),
        days: days || [],
        preferences: preferences || {},
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await itinerariesCol.insertOne(newItinerary);

      res.status(201).json({
        ok: true,
        message: 'Itinerario creado exitosamente',
        data: {
          _id: result.insertedId.toString(),
          ...newItinerary,
          tripId
        }
      });
    }
  } catch (error) {
    console.error('Error creando/actualizando itinerario:', error);
    res.status(500).json({ ok: false, message: 'Error procesando itinerario' });
  }
});

// GET /api/trips/:tripId/itinerary
router.get('/api/trips/:tripId/itinerary', authenticateToken, async (req, res) => {
  try {
    const { tripId } = req.params;

    if (!ObjectId.isValid(tripId)) {
      return res.status(400).json({ ok: false, message: 'ID de viaje inválido' });
    }

    const itinerariesCol = req.app.locals.db.collection('itineraries');
    const itinerary = await itinerariesCol.findOne({ tripId: new ObjectId(tripId) });

    if (!itinerary) {
      return res.status(404).json({ ok: false, message: 'Itinerario no encontrado' });
    }

    res.json({
      ok: true,
      data: {
        ...itinerary,
        _id: itinerary._id.toString(),
        tripId: itinerary.tripId.toString()
      }
    });
  } catch (error) {
    console.error('Error obteniendo itinerario:', error);
    res.status(500).json({ ok: false, message: 'Error obteniendo itinerario' });
  }
});

// GET /api/users/me/itineraries/:page/:size
router.get('/api/users/me/itineraries/:page/:size', authenticateToken, async (req, res) => {
  try {
    // Requiere autenticación - el userId vendría de req.user
    if (!req.user || !req.user.id) {
      return res.status(401).json({ ok: false, message: 'No autorizado' });
    }

    const page = Math.max(1, parseInt(req.params.page) || 1);
    const size = Math.max(1, Math.min(100, parseInt(req.params.size) || 10));
    const skip = (page - 1) * size;

    const itinerariesCol = req.app.locals.db.collection('itineraries');
    const tripsCol = req.app.locals.db.collection('trips');

    // Obtener trips del usuario
    const userTrips = await tripsCol.find({ userId: new ObjectId(req.user.id) }).toArray();
    const tripIds = userTrips.map(t => t._id);

    // Obtener itinerarios de esos trips
    const total = await itinerariesCol.countDocuments({ tripId: { $in: tripIds } });
    const itineraries = await itinerariesCol
      .find({ tripId: { $in: tripIds } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(size)
      .toArray();

    res.json({
      ok: true,
      data: itineraries.map(i => ({
        ...i,
        _id: i._id.toString(),
        tripId: i.tripId.toString()
      })),
      pagination: {
        page,
        size,
        total,
        pages: Math.ceil(total / size)
      }
    });
  } catch (error) {
    console.error('Error obteniendo itinerarios del usuario:', error);
    res.status(500).json({ ok: false, message: 'Error obteniendo itinerarios' });
  }
});

// PUT /api/itineraries/:id/days/:dayNumber
router.put('/api/itineraries/:id/days/:dayNumber', authenticateToken, async (req, res) => {
  try {
    const { id, dayNumber } = req.params;
    const dayData = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, message: 'ID inválido' });
    }

    const itinerariesCol = req.app.locals.db.collection('itineraries');
    
    const result = await itinerariesCol.updateOne(
      { _id: new ObjectId(id), [`days.${parseInt(dayNumber) - 1}`]: { $exists: true } },
      { $set: { [`days.${parseInt(dayNumber) - 1}`]: dayData, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ ok: false, message: 'Itinerario o día no encontrado' });
    }

    res.json({
      ok: true,
      message: 'Día actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error actualizando día:', error);
    res.status(500).json({ ok: false, message: 'Error actualizando día' });
  }
});

// PUT /api/itineraries/:id
router.put('/api/itineraries/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { days, preferences } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, message: 'ID inválido' });
    }

    const itinerariesCol = req.app.locals.db.collection('itineraries');
    
    const updateData = { updatedAt: new Date() };
    if (days) updateData.days = days;
    if (preferences) updateData.preferences = preferences;

    const result = await itinerariesCol.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ ok: false, message: 'Itinerario no encontrado' });
    }

    res.json({
      ok: true,
      message: 'Itinerario actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error actualizando itinerario:', error);
    res.status(500).json({ ok: false, message: 'Error actualizando itinerario' });
  }
});

// DELETE /api/itineraries/:id
router.delete('/api/itineraries/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, message: 'ID inválido' });
    }

    const itinerariesCol = req.app.locals.db.collection('itineraries');
    const result = await itinerariesCol.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ ok: false, message: 'Itinerario no encontrado' });
    }

    res.json({
      ok: true,
      message: 'Itinerario eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando itinerario:', error);
    res.status(500).json({ ok: false, message: 'Error eliminando itinerario' });
  }
});

module.exports = router;
