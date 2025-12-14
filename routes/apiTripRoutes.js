const express = require("express");
const router = express.Router();
const Trip = require("../models/trips");

// GET /api/trips/:page/:size - Listar trips
router.get('/api/trips/:page/:size', async (req, res) => {
  try {
    const page = parseInt(req.params.page) || 1;
    const size = parseInt(req.params.size) || 10;
    const skip = (page - 1) * size;
    
    const trips = await Trip.find().skip(skip).limit(size);
    const total = await Trip.countDocuments();
    
    res.json({
      ok: true,
      data: trips,
      pagination: { page, size, total, pages: Math.ceil(total / size) }
    });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message });
  }
});

// GET /api/trips/:id - Obtener un trip
router.get('/api/trips/:id', async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ ok: false, message: 'Trip no encontrado' });
    res.json({ ok: true, data: trip });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message });
  }
});

// POST /api/trips - Crear trip
router.post('/api/trips', async (req, res) => {
  try {
    const trip = new Trip(req.body);
    await trip.save();
    res.status(201).json({ ok: true, data: trip });
  } catch (error) {
    res.status(400).json({ ok: false, message: error.message });
  }
});

// DELETE /api/trips/:id - Eliminar trip
router.delete('/api/trips/:id', async (req, res) => {
  try {
    const trip = await Trip.findByIdAndDelete(req.params.id);
    if (!trip) return res.status(404).json({ ok: false, message: 'Trip no encontrado' });
    res.json({ ok: true, message: 'Trip eliminado' });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message });
  }
});

// POST /api/trips/:tripId/itinerary - Crear/actualizar itinerario
router.post('/api/trips/:tripId/itinerary', async (req, res) => {
  res.json({ ok: true, message: 'Itinerario guardado (implementar lógica)' });
});

module.exports = router;
