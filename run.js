const express = require('express');
const app = express();
const {
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
  Keypair,
} = require('@solana/web3.js');
const bip39 = require('bip39');
const { derivePath } = require('ed25519-hd-key');
const bs58 = require('bs58');
const fetch = require('node-fetch');
const path = require("path");

const DEVNET_URL = 'https://devnet.sonic.game/';
const connection = new Connection(DEVNET_URL, 'confirmed');

// Set seed phrase and private key (for demonstration purposes only, not for production)
const SEED_PHRASE = "deer uphold gadget friend slight game into flower float pool tilt notable";
const PRIVATE_KEY = "4N7kTHpWKSUU4YDGUF51XWZoy5GKjH2wfJfncLVjXRHNE9CSyi9PJJPf1eanUAC61c96QPTy7H9HFwbfxdL8i9pQ";

const keypair = loadKeypairFromEnv();

function loadKeypairFromEnv() {
  if (SEED_PHRASE) {
    const seed = bip39.mnemonicToSeedSync(SEED_PHRASE);
    const derivedSeed = derivePath("m/44'/501'/0'/0'", seed.toString('hex')).key;
    return Keypair.fromSeed(derivedSeed.slice(0, 32));
  } else if (PRIVATE_KEY) {
    const decoded = bs58.decode(PRIVATE_KEY);
    return Keypair.fromSecretKey(decoded);
  } else {
    throw new Error('No valid SEED_PHRASE or PRIVATE_KEY found in the code');
  }
}

async function sendSol(toAddress, amount) {
  const fromKeypair = keypair;
  const toPublicKey = new PublicKey(toAddress);

  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: fromKeypair.publicKey,
      toPubkey: toPublicKey,
      lamports: amount * LAMPORTS_PER_SOL,
    })
  );

  try {
    const signature = await sendAndConfirmTransaction(connection, transaction, [fromKeypair]);
    return signature;
  } catch (error) {
    throw new Error(`Failed to send SOL: ${error.message}`);
  }
}

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, './public')));

app.post('/send-sol', async (req, res) => {
  const { toAddress, 'cf-turnstile-response': turnstileToken } = req.body;
  const amount = 0.5; // Fixed amount to send, 0.5 SOL

  // Verify Turnstile CAPTCHA
  const secretKey = 'your-secret-key'; // Replace with your secret key
  const verifyURL = `https://challenges.cloudflare.com/turnstile/v0/siteverify`;

  try {
    const verifyResponse = await fetch(verifyURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        secret: secretKey,
        response: turnstileToken,
      }),
    });

    const verifyResult = await verifyResponse.json();

    if (!verifyResult.success) {
      return res.status(400).json({ success: false, error: 'CAPTCHA verification failed' });
    }

    const signature = await sendSol(toAddress, amount);
    res.json({ success: true, signature });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
