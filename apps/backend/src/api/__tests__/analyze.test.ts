import request from 'supertest';
import express from 'express';
import { analyzeRouter } from '../analyze';
import { formatWithGemini } from '../../utils/geminiClient';
import { runStaticAnalysis } from '../../utils/staticAnalysis';
import { disconnectRedis } from '../../utils/redisClient';

// Mock the geminiClient and staticAnalysis modules
jest.mock('../../utils/geminiClient', () => ({
  formatWithGemini: jest.fn().mockResolvedValue({
    summary: {
      purpose: 'Test summary',
      io: { inputs: [], outputs: [] },
      data_sensitivity: [],
      side_effects: [],
      ops_requirements: [],
      scope_limits: [],
    },
    risks: [],
    fixes: [],
    next_actions: [],
    artifacts: { markdown: '' },
  }),
}));

jest.mock('../../utils/staticAnalysis', () => ({
  runStaticAnalysis: jest.fn().mockResolvedValue([]),
}));

const app = express();
app.use(express.json());
app.use('/api', analyzeRouter);

describe('/api/analyze', () => {
  beforeEach(() => {
    // Clear mock history before each test
    (formatWithGemini as jest.Mock).mockClear();
    (runStaticAnalysis as jest.Mock).mockClear();
  });

  afterAll(async () => {
    // Clean up Redis connection to prevent "Cannot log after tests are done" warnings
    await disconnectRedis();
  });

  it('should return a 400 error if content is not provided', async () => {
    const res = await request(app).post('/api/analyze').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('content is required');
  });

  it('should analyze JavaScript code and return a result', async () => {
    const code = 'function hello() { console.log("hello"); }';
    const res = await request(app)
      .post('/api/analyze')
      .send({ content: code, languageHint: 'javascript' });
    expect(res.status).toBe(200);
    expect(res.body.summary).toBeDefined();
    expect(res.body.risks).toBeDefined();
    expect(runStaticAnalysis).toHaveBeenCalled();
    expect(formatWithGemini).toHaveBeenCalled();
  });

  it('should analyze Python code and return a result', async () => {
    const code = 'def hello():\n  print("hello")';
    const res = await request(app)
      .post('/api/analyze')
      .send({ content: code, languageHint: 'python' });
    expect(res.status).toBe(200);
    expect(res.body.summary).toBeDefined();
    expect(res.body.risks).toBeDefined();
    expect(runStaticAnalysis).toHaveBeenCalled();
    expect(formatWithGemini).toHaveBeenCalled();
  });

  it('should analyze code with a policy', async () => {
    const code = 'const apiKey = "12345";';
    const res = await request(app)
      .post('/api/analyze')
      .send({ content: code, languageHint: 'javascript', policies: ['test-policy.md'] });
    expect(res.status).toBe(200);
    expect(res.body.summary).toBeDefined();
    expect(res.body.risks).toBeDefined();
    expect(runStaticAnalysis).toHaveBeenCalled();
    expect(formatWithGemini).toHaveBeenCalled();
  });
});
