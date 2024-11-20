import request from 'supertest';
import app from './app'; 

const token = 'VALID_TOKEN'; 

describe('API Tests', () => {

  // Test para la ruta POST /login
  describe('POST /login', () => {
    it('should login successfully and return a token', async () => {
      const response = await request(app)
        .post('/login')
        .send({ email: 'testuser@example.com', contraseña: 'password' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
    });

    it('should return 401 for invalid credentials', async () => {
      const response = await request(app)
        .post('/login')
        .send({ email: 'invalid@example.com', contraseña: 'wrongpassword' });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Credenciales inválidas');
    });
  });

  // Test para la ruta GET /usuarios
  describe('GET /usuarios', () => {
    it('should return a list of users', async () => {
      const response = await request(app)
        .get('/usuarios')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return 401 for missing or invalid token', async () => {
      const response = await request(app)
        .get('/usuarios');

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Token no proporcionado o inválido');
    });
  });

  // Test para la ruta GET /carro
  describe('GET /carro', () => {
    it('should return the user\'s cart', async () => {
      const response = await request(app)
        .get('/carro')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('items');
    });

    it('should return 401 for unauthorized access', async () => {
      const response = await request(app)
        .get('/carro');

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Token no proporcionado o inválido');
    });
  });

  // Test para la ruta POST /ordenes
  describe('POST /ordenes', () => {
    it('should create a new order', async () => {
      const newOrder = {
        items: [{ productoId: 1, cantidad: 2 }],
        total: 100,
        metodoPago: 'Tarjeta de Crédito'
      };

      const response = await request(app)
        .post('/ordenes')
        .set('Authorization', `Bearer ${token}`)
        .send(newOrder);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.items).toEqual(newOrder.items);
    });

    it('should return 401 for unauthorized access', async () => {
      const response = await request(app)
        .post('/ordenes')
        .send({ items: [], total: 100, metodoPago: 'Tarjeta de Crédito' });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Token no proporcionado o inválido');
    });
  });

  // Test para la ruta GET /ordenes-historial
  describe('GET /ordenes-historial', () => {
    it('should return the user\'s order history', async () => {
      const response = await request(app)
        .get('/ordenes-historial')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true); 
    });

    it('should return 401 for unauthorized access', async () => {
      const response = await request(app)
        .get('/ordenes-historial');

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Token no proporcionado o inválido');
    });
  });

});
