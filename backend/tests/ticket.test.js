const request = require('supertest');
const app = require('../server'); // Express app instance

describe('Ticket API Endpoints', () => {
    it('should return 401 when fetching tickets without authentication', async () => {
        const res = await request(app).get('/api/tickets');
        expect(res.statusCode).toEqual(401);
    });

    it('should return 401 when creating a ticket without authentication', async () => {
        const res = await request(app)
            .post('/api/tickets')
            .send({ title: 'Test Ticket', description: 'Testing unauthorized post' });
        expect(res.statusCode).toEqual(401);
    });
});