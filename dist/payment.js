// src/payment.ts
import axios, { AxiosError } from "axios";

// src/wallet.ts
import { ethers } from "ethers";
var PRIVATE_KEY = process.env.X402_WALLET_PRIVATE_KEY;
var WORKER_URL = process.env.WORKER_URL || "https://base-worker-01.j23726919.workers.dev";
if (!PRIVATE_KEY) {
  console.error("[Wallet] X402_WALLET_PRIVATE_KEY not set in environment");
}
var _wallet = null;
var _walletAddress = null;
function getWallet() {
  if (!_wallet) {
    if (!PRIVATE_KEY) {
      throw new Error("X402_WALLET_PRIVATE_KEY is not set in environment");
    }
    _wallet = new ethers.Wallet(PRIVATE_KEY);
    _walletAddress = _wallet.address;
    console.log(`[Wallet] Initialized with address: ${_walletAddress}`);
  }
  return _wallet;
}
function getWalletAddress() {
  return getWallet().address;
}
var WALLET_ADDRESS = getWalletAddress();
function getPrivateKey() {
  if (!PRIVATE_KEY) {
    throw new Error("X402_WALLET_PRIVATE_KEY is not set in environment");
  }
  return PRIVATE_KEY;
}
async function signMessage(message, privateKeyHex) {
  const key = privateKeyHex.startsWith("0x") ? privateKeyHex : `0x${privateKeyHex}`;
  const wallet = new ethers.Wallet(key);
  const signature = await wallet.signMessage(message);
  console.log(`[Wallet] Signed message (${message.length} chars), signature: ${signature.slice(0, 20)}...`);
  return signature;
}

// src/payment.ts
function parseWwwAuthenticate(header) {
  if (!header.startsWith("x402 ")) {
    return null;
  }
  try {
    const token = header.slice(5);
    const jsonStr = Buffer.from(token, "base64url").toString("utf-8");
    const manifest = JSON.parse(jsonStr);
    if (manifest.x402Version !== 2) {
      console.error(`Unsupported x402 version: ${manifest.x402Version}`);
      return null;
    }
    return manifest;
  } catch (error) {
    console.error("Failed to parse WWW-Authenticate header:", error);
    return null;
  }
}
function buildAuthorizationHeader(manifest, signature) {
  const manifestToken = Buffer.from(JSON.stringify(manifest)).toString("base64url");
  const authPayload = Buffer.from(JSON.stringify({
    manifest: manifestToken,
    signature,
    sender: WALLET_ADDRESS
  })).toString("base64url");
  return `x402 ${authPayload}`;
}
async function x402Request(endpoint, body) {
  const workerUrl = process.env.WORKER_URL || "https://base-worker-01.j23726919.workers.dev";
  const url = `${workerUrl}${endpoint}`;
  let response = await axios.post(url, body, {
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "User-Agent": "Hermes-Asia-MCP/1.0"
    },
    timeout: 3e4
  });
  return response.data;
}
async function x402RequestWithPayment(endpoint, body) {
  const workerUrl = process.env.WORKER_URL || "https://base-worker-01.j23726919.workers.dev";
  const url = `${workerUrl}${endpoint}`;
  let lastError = null;
  try {
    const response = await axios.post(url, body, {
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "Hermes-Asia-MCP/1.0"
      },
      timeout: 3e4
    });
    return response.data;
  } catch (error) {
    if (!(error instanceof AxiosError)) {
      throw error;
    }
    const axiosError = error;
    if (axiosError.response?.status === 402) {
      const wwwAuth = axiosError.response.headers["www-authenticate"];
      if (!wwwAuth) {
        throw new Error("402 response received but no WWW-Authenticate header found");
      }
      const manifest = parseWwwAuthenticate(wwwAuth);
      if (!manifest) {
        throw new Error("Failed to parse WWW-Authenticate header as x402 v2 manifest");
      }
      const acceptOption = manifest.accepts[0];
      console.log(`[x402] Payment required: ${Number(acceptOption.amount) / 1e6} USDC to ${acceptOption.payTo}`);
      const privateKey = getPrivateKey();
      const manifestJson = JSON.stringify(manifest);
      const signature = await signMessage(manifestJson, privateKey);
      const authHeader = buildAuthorizationHeader(manifest, signature);
      const retryResponse = await axios.post(url, body, {
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "User-Agent": "Hermes-Asia-MCP/1.0",
          "Authorization": authHeader
        },
        timeout: 3e4
      });
      return retryResponse.data;
    }
    throw axiosError;
  }
}
function weiToUsdc(weiAmount) {
  return Number(BigInt(weiAmount)) / 1e6;
}
export {
  buildAuthorizationHeader,
  parseWwwAuthenticate,
  weiToUsdc,
  x402Request,
  x402RequestWithPayment
};
