import { pool } from '.'

// Obtener todos los productos en el carrito de un usuario
const getCarrito = async (usuario_id) => {
    const sql = `
        SELECT c.id, c.cantidad, p.nombre, p.precio, p.imagen
        FROM carrito c
        JOIN productos p ON c.producto_id = p.id
        WHERE c.usuario_id = $1
    `
    try {
        const response = await pool.query(sql, [usuario_id])
        return response.rows
    } catch (error) {
        console.error('Error al obtener el carrito:', error.message)
        throw new Error('Error al obtener el carrito')
    }
}

// Agregar un producto al carrito
const addToCarrito = async (usuario_id, producto_id, cantidad) => {
    const sql = `
        INSERT INTO carrito (usuario_id, producto_id, cantidad)
        VALUES ($1, $2, $3)
        ON CONFLICT (usuario_id, producto_id)
        DO UPDATE SET cantidad = carrito.cantidad + EXCLUDED.cantidad
        RETURNING *
    `
    try {
        const response = await pool.query(sql, [
            usuario_id,
            producto_id,
            cantidad,
        ])
        return response.rows[0]
    } catch (error) {
        console.error('Error al agregar al carrito:', error.message)
        throw new Error('Error al agregar al carrito')
    }
}

// Actualizar cantidad de producto en el carrito
const updateQuantity = async (id, cantidad) => {
    const sql = `
        UPDATE carrito
        SET cantidad = $1
        WHERE id = $2
        RETURNING *
    `
    try {
        const response = await pool.query(sql, [cantidad, id])
        if (response.rows.length === 0) {
            throw new Error('Carrito no encontrado')
        }
        return response.rows[0]
    } catch (error) {
        console.error(
            'Error al actualizar cantidad en el carrito:',
            error.message
        )
        throw new Error('Error al actualizar cantidad en el carrito')
    }
}

// Eliminar un producto del carrito
const removeFromCarrito = async (id) => {
    const sql = `
        DELETE FROM carrito
        WHERE id = $1
        RETURNING *
    `
    try {
        const response = await pool.query(sql, [id])
        if (response.rows.length === 0) {
            throw new Error('Carrito no encontrado')
        }
        return response.rows[0]
    } catch (error) {
        console.error('Error al eliminar del carrito:', error.message)
        throw new Error('Error al eliminar del carrito')
    }
}

export const carModels = {
    getCarrito,
    addToCarrito,
    updateQuantity,
    removeFromCarrito,
}
