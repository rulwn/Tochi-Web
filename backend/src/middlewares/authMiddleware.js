import jwt from 'jsonwebtoken';

// Versión mejorada del middleware con control de roles
const authMiddleware = (roles = []) => {
  return (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
          message: 'Token no proporcionado',
          success: false
        });
      }

      const token = authHeader.split(' ')[1];

      if (!token) {
        return res.status(401).json({ 
          message: 'Token no válido',
          success: false
        });
      }

      // Verificar que JWT_SECRET esté configurado
      if (!process.env.JWT_SECRET) {
        console.error('JWT_SECRET no está configurado');
        return res.status(500).json({ 
          message: 'Error de configuración del servidor',
          success: false
        });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      req.user = {
        id: decoded.id || decoded.userId,
        role: decoded.role,
        email: decoded.email
      };

      // Verificar roles si se especificaron
      if (roles.length > 0 && !roles.includes(req.user.role)) {
        return res.status(403).json({ 
          message: 'Acceso no autorizado para este rol',
          success: false
        });
      }

      next();
    } catch (error) {
      console.error('Error en authMiddleware:', error);
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          message: 'Token expirado',
          success: false,
          expired: true
        });
      }
      
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          message: 'Token inválido',
          success: false
        });
      }

      return res.status(500).json({ 
        message: 'Error interno del servidor',
        success: false
      });
    }
  };
};

// Middleware simple sin verificación de roles
export const simpleAuthMiddleware = (req, res, next) => {
  return authMiddleware()(req, res, next);
};

// Middleware para admin
export const adminAuthMiddleware = (req, res, next) => {
  return authMiddleware(['Administrador'])(req, res, next);
};

// Middleware para usuarios normales
export const userAuthMiddleware = (req, res, next) => {
  return authMiddleware(['Cliente', 'Administrador'])(req, res, next);
};

export default authMiddleware;
