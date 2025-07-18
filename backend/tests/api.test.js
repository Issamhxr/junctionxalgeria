const request = require('supertest');
const app = require('../src/app');
const { connectDB } = require('../src/database/connection');

describe('Aquaculture API', () => {
  beforeAll(async () => {
    // Connect to database before running tests
    await connectDB();
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
    });
  });

  describe('Authentication', () => {
    let authToken;
    const testUser = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'testpass123',
      firstName: 'Test',
      lastName: 'User'
    };

    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user.email).toBe(testUser.email);

      authToken = response.body.data.token;
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
    });

    it('should reject login with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should get current user info', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(testUser.email);
    });
  });

  describe('API Routes', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should enforce authentication on protected routes', async () => {
      const response = await request(app)
        .get('/api/ponds')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Validation', () => {
    it('should validate registration input', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'a', // Too short
          email: 'invalid-email',
          password: '123' // Too short
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('errors');
    });
  });
});
