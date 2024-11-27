import jwt from 'jsonwebtoken';
import logger from './loggers.js';

export const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(401).json({ message: 'Acceso denegado' });
  }
  const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token;
  logger.info(`token ${cleanToken}`);
  jwt.verify(cleanToken, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.error('Error al verificar token:', err);
            if (err.name === 'TokenExpiredError') {
        return res.status(403).json({ message: 'Token expirado. Por favor, obtén un nuevo token.' });
      }
      
      return res.status(403).json({ message: 'Token no válido' });
    }

    req.user = user;
    next();
  });
};
