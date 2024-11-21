import { pool } from '../../consultas'

const getData = async (juegos_id, orderBy) => {
    let sql = 'SELECT * FROM productos WHERE 1=1'
    const params = []
    let paramIndex = 1

    if (juegos_id) {
        sql += ` AND juegos_id = $${paramIndex++}`
        params.push(juegos_id)
    }

    if (orderBy) {
        sql += ' ORDER BY precio ' + (orderBy === 'asc' ? 'ASC' : 'DESC')
    }

    try {
        const response = await pool.query(sql, params)
        return response.rows
    } catch (error) {
        console.error(error.message)
        throw new Error('Error al obtener los productos')
    }
}

const getProductDetail = async (id) => {
    const sql = 'SELECT * FROM productos WHERE id = $1'
    try {
        const response = await pool.query(sql, [id])
        return response.rows[0]
    } catch (error) {
        console.error(error.message)
        throw new Error('Error al obtener los detalles del producto')
    }
}
const addProduct = async (product) => {
    const {
        nombre,
        descripcion,
        precio,
        descuento,
        stock,
        juegos_id,
        imagen,
    } = product

    const sql = `
        INSERT INTO productos (nombre, descripcion, precio, descuento, stock, juegos_id, imagen)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *;
    `

    try {
        const response = await pool.query(sql, [
            nombre,
            descripcion,
            precio,
            descuento,
            stock,
            juegos_id,
            imagen,
        ])
        return response.rows[0]
    } catch (error) {
        console.error('Error al agregar el producto:', error.message)
        throw new Error('Error al agregar el producto')
    }
}

const updateProduct = async (id, product) => {
    const {
        nombre,
        descripcion,
        precio,
        descuento,
        stock,
        juegos_id,
        imagen,
    } = product
    const sql = `
        UPDATE productos
        SET nombre = $1, descripcion = $2, precio = $3, descuento = $4, stock = $5, juegos_id = $6, imagen = $7
        WHERE id = $8
        RETURNING *;
    `
    try {
        const response = await pool.query(sql, [
            nombre,
            descripcion,
            precio,
            descuento,
            stock,
            juegos_id,
            imagen,
            id,
        ])
        if (response.rows.length === 0) {
            throw new Error('Producto no encontrado')
        }
        return response.rows[0]
    } catch (error) {
        console.error('Error al actualizar el producto:', error.message)
        throw new Error('Error al actualizar el producto')
    }
}

export const productsModels = {
    getData,
    getProductDetail,
    addProduct,
    updateProduct,
}