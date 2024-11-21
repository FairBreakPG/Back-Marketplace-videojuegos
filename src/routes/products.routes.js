import express from 'express';
import { productsController } from '../controllers/products.controllers';

const router = express.Router();

router.get('/', productsController.getProducts);  // Ruta para obtener todos los juegos
router.get('/:id', productsController.getProductDetail);  // Ruta para obtener un juego por ID
router.post('/', productsController.addProduct);  // Ruta para agregar un nuevo producto
router.put('/:id', productsController.updateProduct);  // Ruta para actualizar un producto

export default router;