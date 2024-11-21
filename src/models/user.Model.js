import { pool } from '../../consultas'

class UserModel {
    static async createUser({
        nombre,
        apellido,
        email,
        contrasena,
        direccion,
        telefono,
        rol,
    }) {
        const query = `
      INSERT INTO usuarios (nombre, apellido, email, contrasena, direccion, telefono, rol) 
      VALUES ($1, $2, $3, $4, $5, $6, $7) 
      RETURNING *;
    `
        const values = [
            nombre,
            apellido,
            email,
            contrasena,
            direccion,
            telefono,
            rol,
        ]

        try {
            const result = await pool.query(query, values)
            return result.rows[0]
        } catch (err) {
            throw new Error(err.message)
        }
    }

    static async findUserByEmail(email) {
        const query = `SELECT * FROM usuarios WHERE email = $1;`

        try {
            const result = await pool.query(query, [email])
            return result.rows[0]
        } catch (err) {
            throw new Error(err.message)
        }
    }

    static async updateUserStatus(id, estado) {
        const query = `UPDATE usuarios SET estado = $1 WHERE id = $2 RETURNING *;`

        try {
            const result = await pool.query(query, [estado, id])
            return result.rows[0]
        } catch (err) {
            throw new Error(err.message)
        }
    }
}

export default UserModel