import { productsModels } from '../models/products.models'

const getProducts = async (req, res) => {
    const { juegos_id, orderBy } = req.query;
    try {
        const response = await productsModels.getData(juegos_id, orderBy)
        res.status(200).json(response)
    } catch (error) {
        res.status(500).json(error.message)
    }
}

const getProductDetail = async (req, res) => {
    const { id } = req.params
    try {
        const product = await productsModels.getProductDetail(id)
        if (product) {
            res.status(200).json(product)
        } else {
            res.status(404).json({ message: 'Producto no encontrado' })
        }
    } catch (error) {
        console.error(error.message)
        res.status(500).json({ message: 'Error interno del servidor' })
    }
}

const addProduct = async (req, res) => {
    const {
        nombre,
        descripcion,
        precio,
        descuento,
        stock,
        juegos_id,
        imagen,
    } = req.body

    try {
        if (
            !nombre ||
            !descripcion ||
            !precio ||
            !descuento ||
            !stock ||
            !juegos_id ||
            !imagen
        ) {
            return res
                .status(400)
                .json({ error: 'Datos incompletos, son campos obligatorios' })
        }
        const newProduct = await productsModels.addProduct({
            nombre,
            descripcion,
            precio,
            descuento,
            stock,
            juegos_id,
            imagen,
        })
        res.status(201).json(newProduct)
    } catch (error) {
        console.error(error.message)
        res.status(500).json({ message: 'Error al agregar el producto' })
    }
}

const updateProduct = async (req, res) => {
    const { id } = req.params
    const {
        nombre,
        descripcion,
        precio,
        descuento,
        stock,
        juegos_id,
        imagen,
    } = req.body
    try {
        if (!nombre || !precio || !stock || !juegos_id) {
            return res
                .status(400)
                .json({ error: 'Datos incompletos, son campos obligatorios' })
        }
        const updateProduct = await productsModels.updateProduct(id, {
            nombre,
            descripcion,
            precio,
            descuento,
            stock,
            juegos_id,
            imagen,
        })
        res.status(200).json(updateProduct)
    } catch (error) {
        console.error(error.message)
        res.status(500).json({ message: 'Error al actualizar el producto' })
    }
}
export const productsController = {
    getProducts,
    getProductDetail,
    addProduct,
    updateProduct,
}