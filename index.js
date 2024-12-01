import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken'; 
import { obtenerUsuarios, obtenerPerfilUsuario,  obtenerHistorialPedidos, login, registrarUsuario, obtenerProductos, crearProducto,
  obtenerCarro, agregarProductoCarro, obtenerPerfilUsuarioConPedidos, guardarPedido, eliminarProductoDelCarrito, actualizarPerfilUsuario, getPedidosPorUsuario,getPedidosTodosUsuarios } from './consultas.js';
import { authenticateToken } from './middleware.js'; 
import logger from './loggers.js';

const app = express();
const port = 3000;

app.use(express.json());
//app.use(cors());  

const corsOptions = {
  origin: 'https://marketprod.netlify.app', 
  methods: 'GET,POST,PUT,DELETE',         
  allowedHeaders: 'Content-Type,Authorization', 
  credentials: true                      
};

app.use(cors(corsOptions));


app.post('/login', async (req, res) => {
  const { email, contraseña } = req.body;
  
  try {
    const usuario = await login(email, contraseña);
    const token = jwt.sign({ id: usuario.id, role: usuario.rol }, process.env.JWT_SECRET, { expiresIn: '1h' });
    return res.json({
      token,
      userId: usuario.id  
    });
  } catch (error) {
    console.error('Error de login:', error.message);
    res.status(401).json({ message: 'Credenciales inválidas' });
  }
});

app.post('/usuarios', async (req, res) => {
  const { nombre, apellido, email, contraseña, telefono, direccion, rol } = req.body;
  logger.info(`Datos recibidos para registro de usuario: ${JSON.stringify(req.body)}`);
  const rolesPermitidos = ['usuario', 'admin'];
  if (!rolesPermitidos.includes(rol)) {
    logger.error(`Rol no válido recibido: ${rol}`);
    return res.status(400).json({ message: 'Rol no válido' });
  }
  try {
    logger.info(`Rol válido recibido: ${rol}`);
    const nuevoUsuarioId = await registrarUsuario(nombre, apellido, email, contraseña, telefono, direccion, rol);
    logger.info(`Usuario creado con ID: ${nuevoUsuarioId}`);
    res.status(201).json({ id: nuevoUsuarioId, message: 'Usuario creado exitosamente' });
  } catch (error) {
    logger.error(`Error al registrar el usuario: ${error.message}`);
    res.status(500).json({ message: 'Error al registrar el usuario' });
  }
});

app.get('/listarusuarios', authenticateToken, async (req, res) => {
  try {
    const usuarios = await obtenerUsuarios();
    res.json(usuarios);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

//obtener un usuario
app.get('/perfilusuario/:id', authenticateToken, async (req, res) => {
  const { id } = req.user; 
  try {
    const perfil = await obtenerPerfilUsuario(id);
    res.json(perfil);
  } catch (error) {
    console.error('Error al obtener perfil de usuario:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

//llamar a modificar un usuario 
app.put('/perfilusuario/:id', authenticateToken, async (req, res) => {
  const { id } = req.params; 
 // const { id } = req.user.id;
  const { nombre, apellido, email, telefono, direccion } = req.body; 
  try {
    const perfilActualizado = await actualizarPerfilUsuario(id, { nombre, apellido, email, telefono, direccion });
    res.json(perfilActualizado);
  } catch (error) {
    console.error('Error al actualizar el perfil de usuario:', error);
    res.status(500).json({ message: 'Error al actualizar el perfil' });
  }
});


app.get('/obtenercarroporusuario/:userId', authenticateToken, async (req, res) => {
  const userId = req.user.id; 
  try {
    const carrito = await obtenerCarro(userId);  
    res.json(carrito);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el carrito' });
  }
});

app.post('/carro', authenticateToken, async (req, res) => {
  const { productoId, cantidad } = req.body;
  const userId = req.user.id;
  logger.info(`Usuario ${userId} está agregando el producto ${productoId} con cantidad ${cantidad} al carrito.`);
  try {
    const carro = await agregarProductoCarro(userId, productoId, cantidad);
    res.json(carro);
  } catch (error) {
    logger.error(`Error al agregar producto al carrito para el usuario ${userId}: ${error.message}`);
    res.status(500).json({ message: 'Error al agregar producto al carrito' });
  }
});

app.get('/historial-pedidos', async (req, res) => {
  const { userId } = req.user; 
  try {
    const historial = await obtenerHistorialPedidos(userId);
    res.json(historial);
  } catch (error) {
    console.error('Error al obtener historial de pedidos:', error.message);
    res.status(500).json({ message: 'Error al obtener el historial de pedidos' });
  }
});

app.get('/productos', async (req, res) => {
  try {
    const productos = await obtenerProductos();
    res.json(productos);
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

app.post('/productos', authenticateToken, async (req, res) => {
  const { nombre, descripcion, precio, descuento, stock, juegosId, imagen } = req.body;
  logger.info(`Solicitud POST /productos - Datos: ${JSON.stringify({ nombre, descripcion, precio, descuento, stock, juegosId, imagen })}`);
  try {
    const nuevoProductoId = await crearProducto(nombre, descripcion, precio, descuento, stock, juegosId, imagen);
    logger.info(`Producto creado exitosamente - ID: ${nuevoProductoId}`);
    res.status(201).json({ id: nuevoProductoId, message: 'Producto creado exitosamente' });
  } catch (error) {
    logger.error('Error al crear el producto:', error);
    res.status(500).json({ message: 'Error al crear el producto' });
  }
});


app.get('/usuario/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const data = await obtenerPerfilUsuarioConPedidos(id);
    if (!data) {
      return res.status(404).json({ message: 'Usuario no encontrado o inactivo' });
    }
    res.json(data);
  } catch (error) {
    console.error('Error al obtener datos del usuario:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});


app.delete('/eliminarProductoCarrito', async (req, res) => {
  const { userId } = req.body;  
  console.log("User ID recibido:", userId); 
  if (!userId) {
    return res.status(400).json({ error: 'Se requiere un userId en el cuerpo de la solicitud' });
  }
  try {
    const productosEliminados = await eliminarProductoDelCarrito(userId);
    if (!productosEliminados) {
      return res.status(404).json({ error: 'No se encontraron productos para este usuario' });
    }
    return res.status(200).json({
      message: 'Productos eliminados del carrito del usuario',
      carrito: productosEliminados, 
    });
  } catch (err) {
    console.error('Error al eliminar productos del carrito:', err);
    return res.status(500).json({ error: 'Error al eliminar los productos del carrito' });
  }
});


app.post('/pedidos', async (req, res) => {
  const { usuario_id, total, metodo_pago, detalles_pedido } = req.body;
  try {
    if (!usuario_id || !total || !metodo_pago || !detalles_pedido || detalles_pedido.length === 0) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }
    const nuevoPedido = await guardarPedido(usuario_id, total, metodo_pago, detalles_pedido);
    if (!nuevoPedido) {
      return res.status(500).json({ error: 'Hubo un problema al guardar el pedido' });
    }
    res.status(201).json(nuevoPedido); 
  } catch (error) {
    console.error('Error al guardar el pedido:', error);
    res.status(500).json({ error: 'Hubo un problema al guardar el pedido' });
  }
});



//listar usuario cliente
app.get('/pedidos/usuario/:usuarioId', async (req, res) => {
  const usuarioId = req.params.usuarioId; 
  //const usuarioId = req.user.id;
  try {
    const pedidos = await getPedidosPorUsuario(usuarioId);
    res.json(pedidos);
  } catch (err) {
    console.error('Error al obtener los pedidos:', err);
    res.status(500).send('Error al obtener los pedidos');
  }
});

//listarpedidos admin
app.get('/pedidosgenerales', async (req, res) => {
  try {
    const pedidos = await getPedidosTodosUsuarios();
    res.json(pedidos);
  } catch (err) {
    console.error('Error al obtener los pedidos:', err);
    res.status(500).send('Error al obtener los pedidos');
  }
});

app.listen(port, () => {
  console.log(`Servidor corriendo en el puerto ${port}`);
});