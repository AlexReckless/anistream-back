//authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }
      
      next();
      return;
    } catch (error) {
      console.error('Auth error:', error);
      return res.status(401).json({
        success: false,
        message: 'No autorizado, token inválido'
      });
    }
  }

  return res.status(401).json({
    success: false,
    message: 'No autorizado, no hay token'
  });
};

// Usar siempre despues de "protect" -- ese middleware ya deja el User
// completo (menos password) en req.user, asi que isAdmin ya esta disponible
// sin otra consulta a la base.
const requireAdmin = (req, res, next) => {
  if (!req.user?.isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Solo el administrador puede hacer esto'
    });
  }
  next();
};

module.exports = { protect, requireAdmin };