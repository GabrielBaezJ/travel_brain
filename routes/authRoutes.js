const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// JWT secret (en producción debe estar en variable de entorno)
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Middleware para autenticación
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1] || req.cookies?.token;
  
  if (!token) {
    return res.status(401).json({ ok: false, message: 'No autorizado' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ ok: false, message: 'Token inválido' });
  }
};

// Middleware para admin
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ ok: false, message: 'Acceso denegado: se requiere rol de administrador' });
  }
  next();
};

// POST /api/auth/register
router.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, name } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ ok: false, message: 'Faltan campos requeridos' });
    }

    const usersCol = req.app.locals.db.collection('users');
    
    // Verificar si el usuario ya existe
    const existingUser = await usersCol.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ ok: false, message: 'El usuario o email ya existe' });
    }

    // Hash de la contraseña
    const passwordHash = await bcrypt.hash(password, 10);

    // Crear usuario
    const newUser = {
      username,
      email,
      passwordHash,
      name: name || username,
      role: 'USER',
      status: 'ACTIVE',
      tz: 'America/Guayaquil',
      createdAt: new Date()
    };

    const result = await usersCol.insertOne(newUser);
    
    // Generar token
    const token = jwt.sign(
      { id: result.insertedId.toString(), username, role: 'USER' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      ok: true,
      message: 'Usuario registrado exitosamente',
      token,
      user: {
        id: result.insertedId.toString(),
        username,
        email,
        name: newUser.name,
        role: 'USER'
      }
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ ok: false, message: 'Error en el servidor' });
  }
});

// POST /api/auth/login
router.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ ok: false, message: 'Faltan credenciales' });
    }

    const usersCol = req.app.locals.db.collection('users');
    
    // Buscar usuario
    const user = await usersCol.findOne({ username });
    if (!user) {
      return res.status(401).json({ ok: false, message: 'Credenciales inválidas' });
    }

    // Verificar contraseña
    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ ok: false, message: 'Credenciales inválidas' });
    }

    // Verificar estado
    if (user.status !== 'ACTIVE') {
      return res.status(403).json({ ok: false, message: 'Usuario desactivado' });
    }

    // Generar token
    const token = jwt.sign(
      { id: user._id.toString(), username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      ok: true,
      message: 'Login exitoso',
      token,
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ ok: false, message: 'Error en el servidor' });
  }
});

// GET /api/auth/me
router.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const usersCol = req.app.locals.db.collection('users');
    const { ObjectId } = require('mongodb');
    
    const user = await usersCol.findOne(
      { _id: new ObjectId(req.user.id) },
      { projection: { passwordHash: 0 } }
    );

    if (!user) {
      return res.status(404).json({ ok: false, message: 'Usuario no encontrado' });
    }

    res.json({
      ok: true,
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Error en me:', error);
    res.status(500).json({ ok: false, message: 'Error en el servidor' });
  }
});

// POST /api/auth/logout
router.post('/api/auth/logout', (req, res) => {
  res.json({ ok: true, message: 'Logout exitoso' });
});

module.exports = { router, authenticateToken, requireAdmin };
