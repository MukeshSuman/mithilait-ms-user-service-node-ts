import request from 'supertest';
import { app } from '../src/app';
import { User } from '../src/models/userModel';
import { connectDB } from '../src/config/database';

beforeAll(async () => {
    await connectDB();
});

afterEach(async () => {
    await User.deleteMany({});
});

describe('User API', () => {
    it('should create a new user', async () => {
        const res = await request(app)
            .post('/api/users')
            .send({
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123',
                role: 'student',
            });
        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.username).toBe('testuser');
    });

    it('should login a user', async () => {
        // Create a user first
        await User.create({
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123',
            role: 'student',
        });

        const res = await request(app)
            .post('/api/users/login')
            .send({
                email: 'test@example.com',
                password: 'password123',
            });
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.token).toBeDefined();
        expect(res.body.data.refreshToken).toBeDefined();
    });

    // Add more tests for other endpoints
});