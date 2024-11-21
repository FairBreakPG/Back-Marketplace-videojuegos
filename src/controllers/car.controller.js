import { carModels } from '../models/car.models'

// Obtener carrito de un usuario
const getCarrito = async (req, res) => {
    try {
        const carrito = await carModels.getCarrito(req.params.usuario_id)
        res.setHeader('Content-Type', 'application/json')
        res.json(carrito)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

// Agregar producto al carrito
const addToCarrito = async (req, res) => {
    const { usuario_id, producto_id, cantidad } = req.body
    try {
        const nuevoItem = await carModels.addToCarrito(
            usuario_id,
            producto_id,
            cantidad
        )
        res.status(201).json(nuevoItem)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

// Actualizar cantidad de producto en el carrito
const updateQuantity = async (req, res) => {
    const { cantidad } = req.body
    try {
        const itemActualizado = await carModels.updateQuantity(
            req.params.id,
            cantidad
        )
        res.json(itemActualizado)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

// Eliminar producto del carrito
const removeFromCarrito = async (req, res) => {
    try {
        const itemEliminado = await carModels.removeFromCarrito(req.params.id)
        res.json(itemEliminado)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}
export const carControllers = {
    getCarrito,
    addToCarrito,
    updateQuantity,
    removeFromCarrito,
}