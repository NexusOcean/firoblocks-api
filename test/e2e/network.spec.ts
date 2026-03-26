import axios from 'axios';

const BASE = 'http://localhost:3000/v1';

describe('Network', () => {
  describe('GET /network/stats', () => {
    it('should return network stats with required fields', async () => {
      const { status, data } = await axios.get(`${BASE}/network/stats`);
      expect(status).toBe(200);
      expect(typeof data.height).toBe('number');
      expect(typeof data.transactions).toBe('number');
      expect(typeof data.totalSupply).toBe('number');
      expect(typeof data.difficulty).toBe('number');
      expect(typeof data.hashrate).toBe('number');
      expect(typeof data.bestBlockHash).toBe('string');
      expect(typeof data.updatedAt).toBe('string');
    });

    it('should have a valid block height', async () => {
      const { data } = await axios.get(`${BASE}/network/stats`);
      expect(data.height).toBeGreaterThan(0);
    });

    it('should have a positive total supply', async () => {
      const { data } = await axios.get(`${BASE}/network/stats`);
      expect(data.totalSupply).toBeGreaterThan(0);
    });

    it('should have a valid best block hash', async () => {
      const { data } = await axios.get(`${BASE}/network/stats`);
      expect(data.bestBlockHash).toMatch(/^[0-9a-fA-F]{64}$/);
    });

    it('should have a positive hashrate', async () => {
      const { data } = await axios.get(`${BASE}/network/stats`);
      expect(data.hashrate).toBeGreaterThan(0);
    });
  });
});
