import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken'; 
import { obtenerUsuarios, obtenerPerfilUsuario, obtenerOrdenes, obtenerOrdenesHistorial, login, crearOrden, actualizarOrden, eliminarOrden, registrarUsuario, obtenerProductos, crearProducto,
  obtenerCarro, agregarProductoCarro, eliminarProductoCarro} from './consultas.js';
import { authenticateToken } from './middleware.js'; 
import logger from './loggers.js'; // Importa el logger que configuraste

const app = express();
const port = 3000;


app.use(express.json());
app.use(cors());


app.post('/login', async (req, res) => {
  const { email, contraseña } = req.body;
  
  try {
    const usuario = await login(email, contraseña);

    // Crear el token
    const token = jwt.sign({ id: usuario.id, role: usuario.rol }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Incluir el userId en la respuesta, junto con el token
    return res.json({
      token,
      userId: usuario.id  // Aquí estamos enviando el userId
    });
  } catch (error) {
    console.error('Error de login:', error.message);
    res.status(401).json({ message: 'Credenciales inválidas' });
  }
});

app.post('/usuarios', async (req, res) => {
  const { nombre, apellido, email, contraseña, telefono, direccion, rol } = req.body;

  // Log de los datos recibidos
  logger.info(`Datos recibidos para registro de usuario: ${JSON.stringify(req.body)}`);

  // Validación del rol
  const rolesPermitidos = ['usuario', 'admin'];
  if (!rolesPermitidos.includes(rol)) {
    logger.error(`Rol no válido recibido: ${rol}`);
    return res.status(400).json({ message: 'Rol no válido' });
  }

  try {
    // Log para confirmar que el rol es válido
    logger.info(`Rol válido recibido: ${rol}`);

    const nuevoUsuarioId = await registrarUsuario(nombre, apellido, email, contraseña, telefono, direccion, rol);
    
    // Log cuando el usuario es creado exitosamente
    logger.info(`Usuario creado con ID: ${nuevoUsuarioId}`);
    
    res.status(201).json({ id: nuevoUsuarioId, message: 'Usuario creado exitosamente' });
  } catch (error) {
    // Log de error en caso de fallar
    logger.error(`Error al registrar el usuario: ${error.message}`);
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

// Obtener el carrito
app.get('/carro/:userId', authenticateToken, async (req, res) => {
  const userId = req.params.userId;  // Obtener el userId de la URL
  try {
    const carrito = await obtenerCarro(userId);  // Pasar el userId al backend
    res.json(carrito);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el carrito' });
  }
});

// Agregar producto al carrito
export const agregarAlCarro = async (productoId, cantidad, userId, token) => {
  try {
    logger.info(`[agregarAlCarro] Datos recibidos: productoId=${productoId}, cantidad=${cantidad}, userId=${userId}, token=${token ? 'Token Presente' : 'Token No Disponible'}`);

    // Verificar que se haya pasado el token y el userId
    if (!token || !userId) {
      logger.error('[agregarAlCarro] Error: Token o userId no encontrados. El usuario no está autenticado.');
      throw new Error('Token o userId no encontrados. El usuario no está autenticado.');
    }

    // Hacer la solicitud al backend
    const response = await axios.post(ENDPOINT.carro, 
      { productoId, cantidad, userId },
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

    logger.info(`[agregarAlCarro] Respuesta del backend: ${JSON.stringify(response.data)}`);
    return response.data;

  } catch (error) {
    if (error.response) {
      logger.error(`[agregarAlCarro] Error en la respuesta del backend: ${error.response.data}`);
      logger.error(`[agregarAlCarro] Status del error: ${error.response.status}`);
    } else {
      logger.error(`[agregarAlCarro] Error en la solicitud: ${error.message}`);
    }
    
    throw new Error(error.response?.data?.message || "Error al agregar producto al carrito");
  }
};


// Eliminar producto del carrito
app.delete('/carro/:productoId', authenticateToken, async (req, res) => {
  const userId = req.user.id;  
  const { productoId } = req.params;

  // Log para registrar el intento de eliminar un producto del carrito
  logger.info(`Usuario con ID ${userId} intenta eliminar del carrito el producto con ID ${productoId}.`);

  try {
    const carro = await eliminarProductoCarro(userId, productoId);
    logger.info(`Producto con ID ${productoId} eliminado exitosamente del carrito del usuario con ID ${userId}.`);  // Log cuando el producto es eliminado
    res.json(carro);
  } catch (error) {
    logger.error(`Error al eliminar el producto con ID ${productoId} del carrito del usuario con ID ${userId}: ${error.message}`);  // Log de error
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


// Obtener todos los productos
app.get('/productos', async (req, res) => {
  try {
    const productos = await obtenerProductos();
    res.json(productos);
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

// Crear un nuevo producto
app.post('/productos', authenticateToken, async (req, res) => {
  const { nombre, descripcion, precio, descuento, stock, juegosId, imagen } = req.body;

  // Log de la solicitud entrante
  logger.info(`Solicitud POST /productos - Datos: ${JSON.stringify({ nombre, descripcion, precio, descuento, stock, juegosId, imagen })}`);

  try {
    const nuevoProductoId = await crearProducto(nombre, descripcion, precio, descuento, stock, juegosId, imagen);
    // Log cuando el producto es creado con éxito
    logger.info(`Producto creado exitosamente - ID: ${nuevoProductoId}`);

    res.status(201).json({ id: nuevoProductoId, message: 'Producto creado exitosamente' });
  } catch (error) {
    // Log de error
    logger.error('Error al crear el producto:', error);
    res.status(500).json({ message: 'Error al crear el producto' });
  }
});

app.post('/refresh-token', async (req, res) => {
  const { refreshToken } = req.body;
  
  // Verificar el refresh token en la base de datos, si existe y es válido
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    const newToken = jwt.sign({ id: decoded.id, role: decoded.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    return res.json({ token: newToken });
  } catch (error) {
    return res.status(403).json({ message: 'Refresh token inválido' });
  }
});