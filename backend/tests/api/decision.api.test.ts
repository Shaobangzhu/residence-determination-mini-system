import request from 'supertest';
import app from '../../src/index';

describe('POST /api/decide', () => {
    it('returns decision for valid resident input', async () => {
        const payload = {
            age: 22,
            monthsInCA: 14,
            hasCADriverLicense: true,
            registeredToVoteInCA: false,
            filesCATaxes: true,
            financiallyIndependent: false
        };

        const res = await request(app).post('/api/decide').send(payload);
        expect(res.status).toBe(200);
        expect(res.body.decision).toBeDefined();
        expect(res.body.decision.status).toBe('resident');
    });

    it('returns explaination when explain=true', async () => {
        const payload = {
            age: 21,
            monthsInCA: 14,
            hasCADriverLicense: true,
            registeredToVoteInCA: false,
            filesCATaxes: true,
            financiallyIndependent: false
        };

        const res = await request(app)
            .post('/api/decide?explain=true')
            .send(payload);
        
        expect(res.status).toBe(200); 
        expect(res.body.explanation).toMatch(/resident/i);
    });

    it('returns 400 for invalid input', async () => {
        const res = await request(app).post('/api/decide').send({ invalid: 'data' });
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Invalid input');
    });
});