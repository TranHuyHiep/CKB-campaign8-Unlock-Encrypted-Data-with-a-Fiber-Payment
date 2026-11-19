# Paid File Unlock on Fiber (Testnet)

A browser-only demo where a **seller encrypts a file, shows a free preview, and sells the key for 1 Testnet CKB** over a Fiber payment channel. The **buyer pays, and the payment itself reveals the key** that unlocks and downloads the file. No server, no escrow, no account.

Built for the CKBoost "Unlock Encrypted Data with a Fiber Payment" campaign (Quest 2, Advanced). Based on the starter project from the [Fiber tutorial](https://www.fiber.world/docs/build/encrypted-data-payment).

## Use case

Selling a digital file (for example a research PDF, dataset or design asset) with a **free preview** the buyer can read before paying.

1. **Seller** picks a file and writes a short public preview.
2. The browser encrypts the file with a fresh AES-256-GCM key.
3. That key becomes the **payment preimage** of a 1 CKB Fiber invoice.
4. The seller shares the **offer JSON** (ciphertext, invoice, file name and size, preview).
5. **Buyer** validates the offer, reads the preview, and confirms the file cannot be opened without the key.
6. Buyer pays 1 CKB. Fiber returns the preimage after the seller claims the payment.
7. The buyer's browser uses the preimage as the AES key, decrypts the file, checks its size, and offers it for **download**.

## What I changed from the starter

| Area | Starter | This project |
|---|---|---|
| `lib/crypto.ts` | Encrypts a text string | Encrypts and decrypts **raw bytes** (`encryptBytes` / `decryptBytes`); text helpers now reuse the same code |
| `lib/offer.ts` | Offer holds ciphertext, iv, invoice, hop hint | Offer also carries **`file`** (name, type, size) and a free **`preview`**; both are validated on parse; file names are sanitised; size limit 100 KB; preview limit 1000 chars |
| `app/page.tsx` Seller | Text area for the secret | **File picker** plus preview editor |
| `app/page.tsx` Buyer | Shows nothing before payment | Shows the **free preview and file details** after validation, still locked |
| `app/page.tsx` result | Shows decrypted text | **Verifies the decrypted size and offers a download** (text files also shown inline) |
| Tests | Payment tests | Adds `crypto.test.mjs`: byte round-trip, wrong key and tampered ciphertext rejected, key and hash shape |

The payment, channel and recovery logic (`payment.ts`, `payment-submission.ts`, `progress.ts`, `node-session.ts`) is unchanged from the starter.

## How to run

Requires Node.js 22.18 or newer and npm.

```sh
npm install
npm run dev
```

Open http://localhost:3001 (use `localhost` or HTTPS; the Fiber WASM runtime needs a secure, cross-origin-isolated context).

1. Click **Start node** for Buyer A and Seller C.
2. Copy each funding address into the [Testnet faucet](https://faucet.nervos.org) and wait for at least 500 CKB each (plus fee).
3. Click **Open 500 CKB channel** for both and wait for `CHANNEL_READY`.
4. **Seller:** choose a file (up to 100 KB), edit the preview, click **Encrypt file & create 1 CKB Invoice**, then **Copy offer**.
5. **Buyer:** paste the offer, **Validate offer**, read the preview, click **Decrypt without key** (it must be rejected), then **Pay 1 CKB**.
6. Click **Unlock file with revealed key** and download the file.

Checks:

```sh
npm run typecheck
npm test
npm run build
```

## Notes and limits

- **Testnet only.** Never send Mainnet CKB.
- The file travels inside the offer JSON as hex, so the demo caps files at 100 KB. A real product would store the ciphertext elsewhere (for example object storage) and put only its hash and location in the offer.
- Payment proves the **key matches the ciphertext**. It does not prove the file is accurate or useful. That is why the buyer sees a preview first. A marketplace would add seller reputation and dispute rules.
- Keep one tab per saved node. After a refresh, start the same nodes, revalidate the offer and use **Check payment status**. Never fund a replacement channel to resolve a wait.

## Security

The AES key and decrypted file are never stored by the application. Do not share private keys, seed phrases or browser storage contents.
