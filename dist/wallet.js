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
async function getBalance() {
  const wallet = getWallet();
  const rpcUrl = "https://mainnet.base.org";
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const usdcContract = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
  const usdcAbi = [
    "function balanceOf(address) view returns (uint256)",
    "function decimals() view returns (uint8)"
  ];
  const usdc = new ethers.Contract(usdcContract, usdcAbi, provider);
  const [usdcBalance, ethBalance] = await Promise.all([
    usdc.balanceOf(wallet.address),
    provider.getBalance(wallet.address)
  ]);
  return {
    usdc: Number(usdcBalance) / 1e6,
    // USDC has 6 decimals
    eth: Number(ethBalance) / 1e18
    // ETH has 18 decimals
  };
}
export {
  WALLET_ADDRESS,
  WORKER_URL,
  getBalance,
  getPrivateKey,
  getWalletAddress,
  signMessage
};
