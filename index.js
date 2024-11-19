import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken'; 
import { obtenerUsuarios, obtenerPerfilUsuario, obtenerCarro, quitarItemCarro, obtenerOrdenes, obtenerOrdenesHistorial, login, crearOrden, actualizarOrden, eliminarOrden, registrarUsuario } from './consultas.js'; // Importamos todas las funciones necesarias
import { authenticateToken } from './middleware.js'; 
const app = express();
const port = 3000;


app.use(express.json());
app.use(cors());


app.post('/login', async (req, res) => {
  const { email, contraseña } = req.body;
  
  try {
    
    const usuario = await login(email, contraseña);

    const token = jwt.sign({ id: usuario.id, role: usuario.rol }, process.env.JWT_SECRET, { expiresIn: '1h' });

    return res.json({ token });
  } catch (error) {
    console.error('Error de login:', error.message);
    res.status(401).json({ message: 'Credenciales inválidas' });
  }
});

app.post('/usuarios', async (req, res) => {
  const { nombre, apellido, email, contraseña, telefono, direccion, rol } = req.body;
  
  try {
    const nuevoUsuarioId = await registrarUsuario(nombre, apellido, email, contraseña, telefono, direccion, rol);
    res.status(201).json({ id: nuevoUsuarioId, message: 'Usuario creado exitosamente' });
  } catch (error) {
    console.error('Error al registrar usuario:', error.message);
    res.status(500).json({ message: 'Error al registrar el usuario' });
  }
});

app.get('/usuarios', authenticateToken, async (req, res) => {
  try {
    const usuarios = await obtenerUsuarios();
    res.json(usuarios);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

app.get('/perfilusuario/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  
  try {
    const perfil = await obtenerPerfilUsuario(id);
    res.json(perfil);
  } catch (error) {
    console.error('Error al obtener perfil de usuario:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

app.get('/carro', authenticateToken, async (req, res) => {
  const userId = req.user.id; 
  try {
    const carro = await obtenerCarro(userId);  
    res.json(carro);
  } catch (error) {
    console.error('Error al obtener el carrito:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

app.delete('/carro/:productoId', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { productoId } = req.params;

  try {
    const itemEliminado = await quitarItemCarro(userId, productoId);
    res.json(itemEliminado);
  } catch (error) {
    console.error('Error al eliminar ítem del carrito:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

app.get('/ordenes', authenticateToken, async (req, res) => {
  try {
    const ordenes = await obtenerOrdenes();
    res.json(ordenes);
  } catch (error) {
    console.error('Error al obtener las órdenes:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

app.get('/ordenes-historial', authenticateToken, async (req, res) => {
  const userId = req.user.id;  

  try {
    const historial = await obtenerOrdenesHistorial(userId);
    res.json(historial);
  } catch (error) {
    console.error('Error al obtener el historial de órdenes:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});


app.post('/ordenes', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { items, total, metodoPago } = req.body;
  
  try {
    const nuevaOrden = await crearOrden(userId, items, total, metodoPago);
    res.status(201).json(nuevaOrden);
  } catch (error) {
    console.error('Error al crear la orden:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});


app.put('/ordenes/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;
  
  try {
    const ordenActualizada = await actualizarOrden(id, estado);
    res.json(ordenActualizada);
  } catch (error) {
    console.error('Error al actualizar la orden:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});



app.delete('/ordenes/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  
  try {
    const ordenEliminada = await eliminarOrden(id);
    res.json(ordenEliminada);
  } catch (error) {
    console.error('Error al eliminar la orden:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en el puerto ${port}`);
});
