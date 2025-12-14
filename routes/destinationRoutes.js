const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");

// GET /api/destinations/:page/:size (con búsqueda opcional)
router.get('/api/destinations/:page/:size/:search?', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.params.page) || 1);
    const size = Math.max(1, Math.min(100, parseInt(req.params.size) || 10));
    const search = req.params.search || '';
    const skip = (page - 1) * size;

    const destinationsCol = req.app.locals.db.collection('destinations');

    // Filtro de búsqueda
    const filter = search ? {
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { country: { $regex: search, $options: 'i' } }
      ]
    } : {};

    const total = await destinationsCol.countDocuments(filter);
    const destinations = await destinationsCol
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(size)
      .toArray();

    res.json({
      ok: true,
      data: destinations.map(d => ({
        ...d,
        _id: d._id.toString()
      })),
      pagination: {
        page,
        size,
        total,
        pages: Math.ceil(total / size)
      }
    });
  } catch (error) {
    console.error('Error obteniendo destinos:', error);
    res.status(500).json({ ok: false, message: 'Error obteniendo destinos' });
  }
});

// GET /api/destinations/:id
router.get('/api/destinations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, message: 'ID inválido' });
    }

    const destinationsCol = req.app.locals.db.collection('destinations');
    const destination = await destinationsCol.findOne({ _id: new ObjectId(id) });

    if (!destination) {
      return res.status(404).json({ ok: false, message: 'Destino no encontrado' });
    }

    res.json({
      ok: true,
      data: {
        ...destination,
        _id: destination._id.toString()
      }
    });
  } catch (error) {
    console.error('Error obteniendo destino:', error);
    res.status(500).json({ ok: false, message: 'Error obteniendo destino' });
  }
});

// POST /api/destinations
router.post('/api/destinations', async (req, res) => {
  try {
    const { name, description, country, latitude, longitude, imageUrl } = req.body;

    if (!name || !country) {
      return res.status(400).json({ ok: false, message: 'Faltan campos requeridos: name, country' });
    }

    const destinationsCol = req.app.locals.db.collection('destinations');

    const newDestination = {
      name,
      description: description || '',
      country,
      latitude: parseFloat(latitude) || 0,
      longitude: parseFloat(longitude) || 0,
      imageUrl: imageUrl || '',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await destinationsCol.insertOne(newDestination);

    res.status(201).json({
      ok: true,
      message: 'Destino creado exitosamente',
      data: {
        _id: result.insertedId.toString(),
        ...newDestination
      }
    });
  } catch (error) {
    console.error('Error creando destino:', error);
    res.status(500).json({ ok: false, message: 'Error creando destino' });
  }
});

// PUT /api/destinations/:id
router.put('/api/destinations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, message: 'ID inválido' });
    }

    const { name, description, country, latitude, longitude, imageUrl } = req.body;
    const destinationsCol = req.app.locals.db.collection('destinations');

    const updateData = {
      updatedAt: new Date()
    };

    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (country) updateData.country = country;
    if (latitude !== undefined) updateData.latitude = parseFloat(latitude);
    if (longitude !== undefined) updateData.longitude = parseFloat(longitude);
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;

    const result = await destinationsCol.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ ok: false, message: 'Destino no encontrado' });
    }

    res.json({
      ok: true,
      message: 'Destino actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error actualizando destino:', error);
    res.status(500).json({ ok: false, message: 'Error actualizando destino' });
  }
});

// DELETE /api/destinations/:id
router.delete('/api/destinations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, message: 'ID inválido' });
    }

    const destinationsCol = req.app.locals.db.collection('destinations');
    const result = await destinationsCol.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ ok: false, message: 'Destino no encontrado' });
    }

    res.json({
      ok: true,
      message: 'Destino eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando destino:', error);
    res.status(500).json({ ok: false, message: 'Error eliminando destino' });
  }
});

module.exports = router;
