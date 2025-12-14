const express = require("express");
const bcrypt = require('bcryptjs');
const User = require('../models/users');
const router = express.Router();

// POST /api/auth/login
router.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ ok: false, message: 'Usuario y contraseña son requeridos' });
    }

    // Buscar usuario por username o email (como en PHP)
    const user = await User.findOne({
      $or: [
        { username: username },
        { email: username }
      ]
    });

    if (!user) {
      return res.status(401).json({ ok: false, message: 'Credenciales inválidas' });
    }

    // Verificar contraseña (EXACTAMENTE como en PHP isValidCredentials)
    let isValidPassword = false;
    
    // Caso 1: passwordHash con bcrypt
    if (user.passwordHash && typeof user.passwordHash === 'string' && user.passwordHash !== '') {
      isValidPassword = await bcrypt.compare(password, user.passwordHash);
    }
    
    // Caso 2: password legacy en texto plano (migración)
    if (!isValidPassword && user.password && typeof user.password === 'string' && user.password !== '') {
      if (user.password === password) {
        // Promover a passwordHash y eliminar password legacy
        isValidPassword = true;
        try {
          user.passwordHash = await bcrypt.hash(password, 10);
          user.password = undefined;
          await user.save();
        } catch (e) {
          console.error('Error promoviendo password:', e);
        }
      }
    }
    
    if (!isValidPassword) {
      return res.status(401).json({ ok: false, message: 'Credenciales inválidas' });
    }

    // Guardar userId en sesión (igual que AuthMiddleware::setUserId en PHP)
    req.session.uid = user._id.toString();
    
    // Actualizar lastLogin
    user.lastLogin = new Date();
    await user.save();

    return res.json({ ok: true });
  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({ ok: false, message: 'Error interno del servidor' });
  }
});

// POST /api/auth/register
router.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, name } = req.body;

    if (!username || !email || !password || !name) {
      return res.status(400).json({ ok: false, message: 'Todos los campos son requeridos' });
    }

    // Verificar si ya existe
    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      return res.status(400).json({ ok: false, message: 'Usuario o email ya existe' });
    }

    // Hash de la contraseña
    const passwordHash = await bcrypt.hash(password, 10);

    // Crear usuario
    const newUser = new User({
      username,
      email,
      passwordHash,
      name,
      role: 'REGISTERED',
      status: 'ACTIVE',
      createdAt: new Date()
    });

    await newUser.save();

    // Guardar sesión
    req.session.uid = newUser._id.toString();

    return res.json({ ok: true, userId: newUser._id.toString() });
  } catch (error) {
    console.error('Error en registro:', error);
    return res.status(500).json({ ok: false, message: 'Error interno del servidor' });
  }
});

// GET /api/auth/me
router.get('/api/auth/me', async (req, res) => {
  try {
    // Verificar sesión (igual que AuthMiddleware::isAuthenticated)
    if (!req.session.uid) {
      return res.status(401).json({ ok: false, message: 'No autenticado' });
    }

    const user = await User.findById(req.session.uid).select('-passwordHash');
    
    if (!user) {
      return res.status(404).json({ ok: false, message: 'Usuario no encontrado' });
    }

    return res.json({
      ok: true,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('Error en /me:', error);
    return res.status(500).json({ ok: false, message: 'Error interno del servidor' });
  }
});

// POST /api/auth/logout
router.post('/api/auth/logout', (req, res) => {
  // Destruir sesión (igual que AuthMiddleware::destroySession)
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destruyendo sesión:', err);
      return res.status(500).json({ ok: false, message: 'Error al cerrar sesión' });
    }
    return res.json({ ok: true });
  });
});

module.exports = router;
