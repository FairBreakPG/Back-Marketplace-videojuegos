import express from 'express'
import cors from 'cors'
import 'dotenv/config.js'
import morgan from 'morgan'
import { registerUser, loginUser } from './src/controllers/user.Controller.js'
import { authenticateToken } from './middleware.js'
import productsRoutes from './src/routes/products.routes.js'
import carRoutes from './src/routes/car.routes.js'

const app = express()
const PORT = process.env.PORT || 3000

app.use(express.json())
app.use(cors())
app.use(morgan('dev'))

// Rutas
// app.use('/api', productsRoutes)
app.use('/api/juegos', productsRoutes)
// Rutas para carrito
app.use('/api/carrito', carRoutes)

app.post('/api/register', registerUser)
app.post('/api/login', loginUser)
app.get('/api/protected-route', authenticateToken, (req, res) => {
    res.json({ message: 'Acceso concedido' })
})

app.listen(PORT, () => {
    console.log(`Servidor en el puerto  http://localhost:${PORT}`)
})

export default app