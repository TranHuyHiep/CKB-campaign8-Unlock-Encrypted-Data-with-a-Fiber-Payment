import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash } from 'node:crypto';
import { decryptBytes, encryptBytes, fromHex } from './lib/crypto.ts';

const sample = Uint8Array.from({ length: 5000 }, (_, i) => (i * 31) % 256);

test('file bytes round-trip with the revealed key', async () => {
  const { key, payload } = await encryptBytes(sample);
  assert.deepEqual(await decryptBytes(payload, key), sample);
});

test('a wrong key or tampered ciphertext is rejected', async () => {
  const { key, payload } = await encryptBytes(sample);
  const wrong = `0x${'00'.repeat(32)}`;
  await assert.rejects(decryptBytes(payload, wrong));
  const flipped = payload.ciphertext.slice(0, -2) + (payload.ciphertext.endsWith('00') ? '01' : '00');
  await assert.rejects(decryptBytes({ ...payload, ciphertext: flipped }, key));
});

test('the encryption key is a 32-byte value whose SHA-256 can serve as the payment hash', async () => {
  const { key } = await encryptBytes(sample);
  assert.equal(fromHex(key).length, 32);
  assert.match(createHash('sha256').update(fromHex(key)).digest('hex'), /^[0-9a-f]{64}$/);
});
