import jwt from 'jsonwebtoken';
import { JWT_SECRETA } from './consultas';

export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        return res.status(401).json({ message: 'Token no proporcionado' });
    }

    jwt.verify(token, JWT_SECRETA, (err, user) => {
        if (err) {
            console.log('Error en la verificación del token:', err.message);
            return res.status(403).json({ message: 'Token inválido' });
        }

        // Asignar el usuario y su rol a req.user
        req.user = {
            id: user.id,  // Asegúrate de que el token tenga el campo 'id'
            role: user.role // Asegúrate de que el token tenga el campo 'role'
        };

        next();
    });
};