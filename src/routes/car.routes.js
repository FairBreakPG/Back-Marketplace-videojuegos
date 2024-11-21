import express from 'express'
import { carControllers } from '../controllers/car.controller'

const router = express.Router()

router.get('/:usuario_id', carControllers.getCarrito)

router.post('/add', carControllers.addToCarrito)

router.put('/update/:id', carControllers.updateQuantity)

router.delete('/remove/:id', carControllers.removeFromCarrito)

export default router