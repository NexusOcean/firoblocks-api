import axios from 'axios';

const BASE = 'http://localhost:3000/v1';

const LEGACY_TYPES = ['coinbase', 'transparent', 'spark', 'masternode', 'unknown'];

const CATEGORIES = [
  'coinbase',
  'transparent',
  'lelantus_mint',
  'lelantus_joinsplit',
  'lelantus_to_spark',
  'spark_mint',
  'spark_spend',
  'sigma_mint',
  'sigma_spend',
  'zerocoin_mint',
  'zerocoin_spend',
  'masternode_register',
  'masternode_update_service',
  'masternode_update_registrar',
  'masternode_revoke',
  'coinbase_payload',
  'quorum_commitment',
  'unknown',
];

const VIN_KINDS = [
  'coinbase',
  'transparent',
  'spark_spend',
  'lelantus_joinsplit',
  'sigma_spend',
  'zerocoin_spend',
  'unknown',
];

const VOUT_KINDS = [
  'transparent',
  'spark_mint',
  'spark_smint',
  'lelantus_mint',
  'lelantus_jmint',
  'sigma_mint',
  'zerocoin_mint',
  'op_return',
  'exchange_addr',
  'unknown',
];

const FLAGS = [
  'has_transparent_change',
  'has_op_return',
  'has_p2sh',
  'has_multisig',
  'has_exchange_addr',
];

describe('Transactions', () => {
  let txid: string;

  beforeAll(async () => {
    const { data: blockList } = await axios.get(`${BASE}/blocks`, {
      params: { limit: 1 },
    });
    const { data: block } = await axios.get(`${BASE}/blocks/${blockList.blocks[0].height}`);
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
      expect(LEGACY_TYPES).toContain(tx.type);
      expect(CATEGORIES).toContain(tx.category);
      expect(Array.isArray(tx.flags)).toBe(true);
      for (const flag of tx.flags) {
        expect(FLAGS).toContain(flag);
      }

      expect(typeof tx.size).toBe('number');
      expect(typeof tx.confirmations).toBe('number');
      expect(typeof tx.time).toBe('number');
      expect(typeof tx.blockHash).toBe('string');
      expect(typeof tx.blockHeight).toBe('number');
      expect(typeof tx.chainlock).toBe('boolean');
      expect(typeof tx.instantlock).toBe('boolean');
      expect(Array.isArray(tx.vin)).toBe(true);
      expect(Array.isArray(tx.vout)).toBe(true);

      for (const vin of tx.vin) {
        expect(VIN_KINDS).toContain(vin.kind);
      }
      for (const vout of tx.vout) {
        expect(VOUT_KINDS).toContain(vout.kind);
        expect(typeof vout.isPrivate).toBe('boolean');
        expect(typeof vout.n).toBe('number');
        expect(typeof vout.value).toBe('number');
        expect(Array.isArray(vout.addresses)).toBe(true);
      }
    });

    it('recent txs should include at least one coinbase', async () => {
      const { data } = await axios.get(`${BASE}/transactions/recent`, {
        params: { limit: 10 },
      });
      const hasCoinbase = data.some((tx: any) => tx.category === 'coinbase');
      expect(hasCoinbase).toBe(true);
    });
  });

  describe('GET /transactions/:txid', () => {
    it('should return transaction details by txid', async () => {
      const { status, data } = await axios.get(`${BASE}/transactions/${txid}`);
      expect(status).toBe(200);
      expect(data.txid).toBe(txid);
      expect(LEGACY_TYPES).toContain(data.type);
      expect(CATEGORIES).toContain(data.category);
      expect(Array.isArray(data.flags)).toBe(true);
      expect(typeof data.size).toBe('number');
      expect(Array.isArray(data.vin)).toBe(true);
      expect(Array.isArray(data.vout)).toBe(true);
    });

    it('coinbase txs should have a coinbase vin', async () => {
      const { data } = await axios.get(`${BASE}/transactions/${txid}`);
      if (data.category === 'coinbase') {
        expect(data.vin.length).toBeGreaterThan(0);
        expect(data.vin[0].kind).toBe('coinbase');
        expect(typeof data.vin[0].coinbase).toBe('string');
      }
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
