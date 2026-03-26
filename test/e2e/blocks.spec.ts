import axios from 'axios';

const BASE = 'http://localhost:3000/v1';

describe('Blocks', () => {
  let blockHash: string;
  let blockHeight: number;

  beforeAll(async () => {
    const { data } = await axios.get(`${BASE}/blocks`, {
      params: { limit: 1 },
    });
    blockHash = data.blocks[0].hash;
    blockHeight = data.blocks[0].height;
  });

  describe('GET /blocks', () => {
    it('should return a paginated block list with required fields', async () => {
      const { status, data } = await axios.get(`${BASE}/blocks`);
      expect(status).toBe(200);
      expect(Array.isArray(data.blocks)).toBe(true);
      expect(typeof data.tip).toBe('number');
      expect(data).toHaveProperty('nextCursor');

      const block = data.blocks[0];
      expect(typeof block.hash).toBe('string');
      expect(typeof block.height).toBe('number');
      expect(typeof block.time).toBe('number');
      expect(typeof block.nTx).toBe('number');
      expect(typeof block.size).toBe('number');
      expect(typeof block.difficulty).toBe('number');
      expect(typeof block.chainlock).toBe('boolean');
    });

    it('should respect the limit parameter', async () => {
      const { data } = await axios.get(`${BASE}/blocks`, {
        params: { limit: 5 },
      });
      expect(data.blocks.length).toBeLessThanOrEqual(5);
    });

    it('should paginate with the before cursor', async () => {
      const { data: page1 } = await axios.get(`${BASE}/blocks`, {
        params: { limit: 2 },
      });
      if (page1.nextCursor !== null) {
        const { data: page2 } = await axios.get(`${BASE}/blocks`, {
          params: { limit: 2, before: page1.nextCursor },
        });
        const page1Heights = page1.blocks.map((b: any) => b.height);
        const page2Heights = page2.blocks.map((b: any) => b.height);
        // page2 blocks should all be lower than page1 blocks
        expect(Math.max(...page2Heights)).toBeLessThan(Math.min(...page1Heights));
      }
    });

    it('should return 400 for invalid limit', async () => {
      try {
        await axios.get(`${BASE}/blocks`, { params: { limit: 999 } });
        fail('Expected 400');
      } catch (err: any) {
        expect(err.response.status).toBe(400);
      }
    });

    it('should return 400 for negative before', async () => {
      try {
        await axios.get(`${BASE}/blocks`, { params: { before: -1 } });
        fail('Expected 400');
      } catch (err: any) {
        expect(err.response.status).toBe(400);
      }
    });
  });

  describe('GET /blocks/:hashOrHeight', () => {
    it('should return block details by hash', async () => {
      const { status, data } = await axios.get(`${BASE}/blocks/${blockHash}`);
      expect(status).toBe(200);
      expect(data.hash).toBe(blockHash);
      expect(typeof data.height).toBe('number');
      expect(typeof data.confirmations).toBe('number');
      expect(typeof data.time).toBe('number');
      expect(typeof data.medianTime).toBe('number');
      expect(typeof data.size).toBe('number');
      expect(typeof data.weight).toBe('number');
      expect(typeof data.difficulty).toBe('number');
      expect(typeof data.chainlock).toBe('boolean');
      expect(typeof data.nTx).toBe('number');
      expect(Array.isArray(data.txids)).toBe(true);
    });

    it('should return block details by height', async () => {
      const { status, data } = await axios.get(`${BASE}/blocks/${blockHeight}`);
      expect(status).toBe(200);
      expect(data.height).toBe(blockHeight);
      expect(data.hash).toBe(blockHash);
    });

    it('should return 400 for invalid hash or height', async () => {
      try {
        await axios.get(`${BASE}/blocks/not-valid`);
        fail('Expected 400');
      } catch (err: any) {
        expect(err.response.status).toBe(400);
      }
    });
  });
});
