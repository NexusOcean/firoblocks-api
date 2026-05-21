import axios from 'axios';

const BASE = 'http://localhost:3000/v1';

const RECEIVE_ONLY_CATEGORIES = [
  'spark_spend',
  'lelantus_joinsplit',
  'sigma_spend',
  'zerocoin_spend',
];

describe('Addresses', () => {
  let validAddress: string;

  beforeAll(async () => {
    const { data: blockList } = await axios.get(`${BASE}/blocks`, {
      params: { limit: 1 },
    });
    const height = blockList.blocks[0].height;
    const { data: block } = await axios.get(`${BASE}/blocks/${height}`);
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

    it('valueDelta should be a finite number or undefined', async () => {
      const { data } = await axios.get(`${BASE}/addresses/${validAddress}`);
      for (const tx of data.transactions) {
        if (tx.valueDelta !== undefined) {
          expect(typeof tx.valueDelta).toBe('number');
          expect(Number.isFinite(tx.valueDelta)).toBe(true);
        }
      }
    });

    it('coinbase txs should have a positive valueDelta', async () => {
      const { data } = await axios.get(`${BASE}/addresses/${validAddress}`);
      const coinbaseTxs = data.transactions.filter((tx: any) => tx.type === 'coinbase');
      for (const tx of coinbaseTxs) {
        expect(tx.valueDelta).toBeGreaterThan(0);
      }
    });

    it('privacy spend txs should have non-negative valueDelta or undefined', async () => {
      const { data } = await axios.get(`${BASE}/addresses/${validAddress}`);
      for (const tx of data.transactions) {
        const { data: full } = await axios.get(`${BASE}/transactions/${tx.txid}`);
        if (RECEIVE_ONLY_CATEGORIES.includes(full.category)) {
          if (tx.valueDelta !== undefined) {
            expect(tx.valueDelta).toBeGreaterThanOrEqual(0);
          }
        }
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
