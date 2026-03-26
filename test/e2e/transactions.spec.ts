import axios from 'axios';

const BASE = 'http://localhost:3000/v1';

describe('Transactions', () => {
  let txid: string;

  beforeAll(async () => {
    const { data: blockList } = await axios.get(`${BASE}/blocks`, {
      params: { limit: 1 },
    });
    const { data: block } = await axios.get(`${BASE}/blocks/${blockList.blocks[0].hash}`);
    txid = block.txids[0];
  });

  describe('GET /transactions/recent', () => {
    it('should return an array of recent transactions', async () => {
      const { status, data } = await axios.get(`${BASE}/transactions/recent`);
      expect(status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
    });

    it('should respect the limit parameter', async () => {
      const { data } = await axios.get(`${BASE}/transactions/recent`, {
        params: { limit: 3 },
      });
      expect(data.length).toBeLessThanOrEqual(3);
    });

    it('should return transactions with required fields', async () => {
      const { data } = await axios.get(`${BASE}/transactions/recent`, {
        params: { limit: 1 },
      });
      const tx = data[0];
      expect(typeof tx.txid).toBe('string');
      expect(['coinbase', 'transparent', 'spark', 'unknown']).toContain(tx.type);
      expect(typeof tx.size).toBe('number');
      expect(typeof tx.confirmations).toBe('number');
      expect(typeof tx.time).toBe('number');
      expect(typeof tx.blockHash).toBe('string');
      expect(typeof tx.blockHeight).toBe('number');
      expect(typeof tx.chainlock).toBe('boolean');
      expect(typeof tx.instantlock).toBe('boolean');
      expect(Array.isArray(tx.vin)).toBe(true);
      expect(Array.isArray(tx.vout)).toBe(true);
    });
  });

  describe('GET /transactions/:txid', () => {
    it('should return transaction details by txid', async () => {
      const { status, data } = await axios.get(`${BASE}/transactions/${txid}`);
      expect(status).toBe(200);
      expect(data.txid).toBe(txid);
      expect(typeof data.size).toBe('number');
      expect(Array.isArray(data.vin)).toBe(true);
      expect(Array.isArray(data.vout)).toBe(true);
    });

    it('should return 400 for invalid txid', async () => {
      try {
        await axios.get(`${BASE}/transactions/not-a-valid-txid`);
        fail('Expected 400');
      } catch (err: any) {
        expect(err.response.status).toBe(400);
      }
    });

    it('should return 400 for txid that is too short', async () => {
      try {
        await axios.get(`${BASE}/transactions/abcdef1234`);
        fail('Expected 400');
      } catch (err: any) {
        expect(err.response.status).toBe(400);
      }
    });
  });
});
