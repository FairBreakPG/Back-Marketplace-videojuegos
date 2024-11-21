import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import UserModel from '../models/user.Model';

export const registerUser = async (req, res) => {
  const { nombre, apellido, email, contrasena, direccion, telefono, rol } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(contrasena, 10);
    const newUser = await UserModel.createUser({
      nombre,
      apellido,
      email,
      contrasena: hashedPassword,
      direccion,
      telefono,
      rol
    });
    res.status(201).json(newUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const loginUser = async (req, res) => {
  const { email, contrasena } = req.body;

  try {
    const user = await UserModel.findUserByEmail(email);

    if (!user) {
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }

    const isMatch = await bcrypt.compare(contrasena, user.contrasena);
    if (!isMatch) {
      return res.status(401).json({ message: 'Contraseña incorrecta' });
    }

    const token = jwt.sign(
      { id: user.id, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};