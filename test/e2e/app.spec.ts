import axios from 'axios';

const BASE = 'http://localhost:3000/v1';

describe('Health Check', () => {
  describe('GET /health', () => {
    it('should return Healthy!', async () => {
      const { status, data } = await axios.get(`${BASE}/health`, {});
      expect(status).toBe(200);
      expect(data).toMatch('Healthy');
    });
  });
});
