import axios from 'axios';

const BASE = 'http://localhost:3000/v1';

describe('Search', () => {
  let blockHash: string;
  let blockHeight: number;
  let txid: string;
  let address: string;

  beforeAll(async () => {
    const { data: blockList } = await axios.get(`${BASE}/blocks`, {
      params: { limit: 1 },
    });
    blockHash = blockList.blocks[0].hash;
    blockHeight = blockList.blocks[0].height;

    const { data: block } = await axios.get(`${BASE}/blocks/${blockHash}`);
    txid = block.txids[0];

    for (const id of block.txids) {
      const { data: tx } = await axios.get(`${BASE}/transactions/${id}`);
      const vout = tx.vout.find((o: any) => o.addresses?.length > 0 && o.type === 'pubkeyhash');
      if (vout) {
        address = vout.addresses[0];
        break;
      }
    }
    if (!address) {
      throw new Error('Could not find a valid address from recent blocks');
    }
  });

  describe('GET /search', () => {
    it('should find a block by hash', async () => {
      const { status, data } = await axios.get(`${BASE}/search`, {
        params: { q: blockHash },
      });
      expect(status).toBe(200);
      expect(data.type).toBe('block');
      expect(data.data.hash).toBe(blockHash);
    });

    it('should find a block by height', async () => {
      const { status, data } = await axios.get(`${BASE}/search`, {
        params: { q: String(blockHeight) },
      });
      expect(status).toBe(200);
      expect(data.type).toBe('block');
      expect(data.data.height).toBe(blockHeight);
    });

    it('should find a transaction by txid', async () => {
      const { status, data } = await axios.get(`${BASE}/search`, {
        params: { q: txid },
      });
      expect(status).toBe(200);
      expect(data.type).toBe('transaction');
      expect(data.data.txid).toBe(txid);
    });

    it('should find an address', async () => {
      const { status, data } = await axios.get(`${BASE}/search`, {
        params: { q: address },
      });
      expect(status).toBe(200);
      expect(data.type).toBe('address');
      expect(data.data.address).toBe(address);
    });

    it('should return 400 for empty query', async () => {
      try {
        await axios.get(`${BASE}/search`, { params: { q: '' } });
        fail('Expected 400');
      } catch (err: any) {
        expect(err.response.status).toBe(400);
      }
    });

    it('should return 400 for missing query', async () => {
      try {
        await axios.get(`${BASE}/search`);
        fail('Expected 400');
      } catch (err: any) {
        expect(err.response.status).toBe(400);
      }
    });
  });
});
