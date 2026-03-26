import axios from 'axios';

const BASE = 'http://localhost:3000/v1';

describe('Addresses', () => {
  let validAddress: string;

  beforeAll(async () => {
    // grab latest block -> first txid -> first output address
    const { data: blockList } = await axios.get(`${BASE}/blocks`, {
      params: { limit: 1 },
    });
    const hash = blockList.blocks[0].hash;
    const { data: block } = await axios.get(`${BASE}/blocks/${hash}`);
    // skip coinbase, find a tx with a transparent output address
    for (const txid of block.txids) {
      const { data: tx } = await axios.get(`${BASE}/transactions/${txid}`);
      const vout = tx.vout.find((o: any) => o.addresses?.length > 0 && o.type === 'pubkeyhash');
      if (vout) {
        validAddress = vout.addresses[0];
        break;
      }
    }
    if (!validAddress) {
      throw new Error('Could not find a valid address from recent blocks');
    }
  });

  describe('GET /addresses/:address', () => {
    it('should return address details with required fields', async () => {
      const { status, data } = await axios.get(`${BASE}/addresses/${validAddress}`);
      expect(status).toBe(200);
      expect(data).toHaveProperty('address', validAddress);
      expect(typeof data.balance).toBe('number');
      expect(typeof data.received).toBe('number');
      expect(typeof data.totalTxCount).toBe('number');
      expect(Array.isArray(data.transactions)).toBe(true);
      expect(typeof data.page).toBe('number');
      expect(typeof data.totalPages).toBe('number');
    });

    it('should return paginated transactions', async () => {
      const { data } = await axios.get(`${BASE}/addresses/${validAddress}`, {
        params: { page: 1 },
      });
      expect(data.page).toBe(1);
      if (data.transactions.length > 0) {
        const tx = data.transactions[0];
        expect(typeof tx.txid).toBe('string');
        expect(typeof tx.type).toBe('string');
        expect(typeof tx.time).toBe('number');
        expect(typeof tx.blockHeight).toBe('number');
        expect(typeof tx.confirmations).toBe('number');
      }
    });

    it('should return 400 for invalid address format', async () => {
      try {
        await axios.get(`${BASE}/addresses/!invalid!`);
        fail('Expected 400');
      } catch (err: any) {
        expect(err.response.status).toBe(400);
      }
    });

    it('should return 400 for address that is too short', async () => {
      try {
        await axios.get(`${BASE}/addresses/abc`);
        fail('Expected 400');
      } catch (err: any) {
        expect(err.response.status).toBe(400);
      }
    });
  });
});
