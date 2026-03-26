import axios from 'axios';

const BASE = 'http://localhost:3000/v1';

describe('Mempool', () => {
  describe('GET /mempool', () => {
    it('should return mempool status with required fields', async () => {
      const { status, data } = await axios.get(`${BASE}/mempool`);
      expect(status).toBe(200);
      expect(typeof data.pendingCount).toBe('number');
      expect(typeof data.bytes).toBe('number');
      expect(typeof data.usage).toBe('number');
      expect(typeof data.maxMempool).toBe('number');
      expect(typeof data.minFee).toBe('number');
      expect(typeof data.instantSendLocks).toBe('number');
      expect(Array.isArray(data.txids)).toBe(true);
    });

    it('should have txids count matching pendingCount', async () => {
      const { data } = await axios.get(`${BASE}/mempool`);
      expect(data.txids.length).toBe(data.pendingCount);
    });
  });
});
