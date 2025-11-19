import request from 'supertest';
import app from '../../src/index';
import * as aiModule from '../../src/ai';
import * as persistenceModule from '../../src/persistence';

jest.mock('../../src/ai');
jest.mock('../../src/persistence');

const mockedGenerateAiExplanation =
  aiModule.generateAiExplanation as jest.MockedFunction<typeof aiModule.generateAiExplanation>;

const mockedSaveDecisionRecord =
  persistenceModule.saveDecisionRecord as jest.MockedFunction<typeof persistenceModule.saveDecisionRecord>;

describe('POST /api/decide (with mocked AI & DB)', () => {
  beforeEach(() => {
    mockedGenerateAiExplanation.mockResolvedValue(
      'Mock AI explanation from test.'
    );
    mockedSaveDecisionRecord.mockResolvedValue(undefined as never);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns decision for valid resident input', async () => {
    const payload = {
      age: 22,
      monthsInCA: 14,
      hasCADriverLicense: true,
      registeredToVoteInCA: true,
      filesCATaxes: true,
      financiallyIndependent: false,
    };

    const res = await request(app)
      .post('/api/decision') 
      .send(payload);

    expect(res.status).toBe(200);

    expect(res.body.decision).toBeDefined();
    expect(res.body.decision.status).toBe('resident');
    expect(Array.isArray(res.body.decision.reasons)).toBe(true);

    expect(res.body.explanations).toEqual(expect.any(String));
    expect(res.body.explanations.length).toBeGreaterThan(0);

    expect(res.body.aiExplanation).toBe('Mock AI explanation from test.');

    expect(mockedGenerateAiExplanation).toHaveBeenCalledTimes(1);
    expect(mockedSaveDecisionRecord).toHaveBeenCalledTimes(1);
  });

  it('returns 400 for invalid input', async () => {
    const res = await request(app)
      .post('/api/decision')
      .send({ invalid: 'data' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid input');

    expect(mockedGenerateAiExplanation).not.toHaveBeenCalled();
    expect(mockedSaveDecisionRecord).not.toHaveBeenCalled();
  });
});
