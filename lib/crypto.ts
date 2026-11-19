export type EncryptedPayload = {
  ciphertext: `0x${string}`;
  iv: `0x${string}`;
};

export const toHex = (bytes: Uint8Array) =>
  `0x${Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('')}` as `0x${string}`;

export const fromHex = (value: string) =>
  Uint8Array.from(value.replace(/^0x/, '').match(/.{2}/g) ?? [], (part) =>
    Number.parseInt(part, 16),
  );

async function encryptWithFreshKey(data: Uint8Array) {
  const keyBytes = crypto.getRandomValues(new Uint8Array(32));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await crypto.subtle.importKey(
    'raw', new Uint8Array(keyBytes), { name: 'AES-GCM' }, false, ['encrypt'],
  );
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new Uint8Array(data));
  return {
    key: toHex(keyBytes),
    payload: { ciphertext: toHex(new Uint8Array(ciphertext)), iv: toHex(iv) } satisfies EncryptedPayload,
  };
}

async function decryptWithKey(payload: EncryptedPayload, keyHex: string) {
  const key = await crypto.subtle.importKey(
    'raw', new Uint8Array(fromHex(keyHex)), { name: 'AES-GCM' }, false, ['decrypt'],
  );
  return new Uint8Array(await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(fromHex(payload.iv)) },
    key,
    new Uint8Array(fromHex(payload.ciphertext)),
  ));
}

/** Encrypt raw bytes (a file). The returned key is later used as the invoice preimage. */
export const encryptBytes = (data: Uint8Array) => encryptWithFreshKey(data);

/** Decrypt raw bytes with the key revealed by the payment. */
export const decryptBytes = decryptWithKey;

export async function encryptResult(plaintext: string) {
  return encryptWithFreshKey(new TextEncoder().encode(plaintext));
}

export async function decryptResult(payload: EncryptedPayload, keyHex: string) {
  return new TextDecoder().decode(await decryptWithKey(payload, keyHex));
}
