import axios from 'axios';

const BASE = 'http://localhost:3000';

describe('Health Check', () => {
  describe('GET /health', () => {
    it('should return Healthy!', async () => {
      const { status, data } = await axios.get(`${BASE}/health`, {});
      expect(status).toBe(200);
      expect(data).toHaveProperty('status', 'ok!');
    });
  });

  describe('GET /metrics', () => {
    it('should return metrics', async () => {
      const { status, data } = await axios.get(`${BASE}/metrics`, {});
      expect(status).toBe(200);
      expect(data).toContain('mongodb');
    });
  });
});
