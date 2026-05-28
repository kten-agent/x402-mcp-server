/**
 * Hermes Asia Wallet Utilities
 * 
 * Manages the wallet used for x402 payments.
 * Private key is read from X402_WALLET_PRIVATE_KEY environment variable.
 * Uses ethers.js v6 for signing.
 */

import { ethers } from 'ethers';

// Environment variables
const PRIVATE_KEY = process.env.X402_WALLET_PRIVATE_KEY;
const WORKER_URL = process.env.WORKER_URL || 'https://base-worker-01.j23726919.workers.dev';

// Validate that we have a private key
if (!PRIVATE_KEY) {
  console.error('[Wallet] X402_WALLET_PRIVATE_KEY not set in environment');
  // Don't throw at import time - allow the server to start but fail at payment time
}

// Derive wallet address from private key
let _wallet: ethers.Wallet | null = null;
let _walletAddress: string | null = null;

function getWallet(): ethers.Wallet {
  if (!_wallet) {
    if (!PRIVATE_KEY) {
      throw new Error('X402_WALLET_PRIVATE_KEY is not set in environment');
    }
    _wallet = new ethers.Wallet(PRIVATE_KEY);
    _walletAddress = _wallet.address;
    console.log(`[Wallet] Initialized with address: ${_walletAddress}`);
  }
  return _wallet;
}

/**
 * Get the wallet address.
 */
export function getWalletAddress(): string {
  return getWallet().address;
}

// Legacy export for compatibility
export const WALLET_ADDRESS = getWalletAddress();
export { WORKER_URL };

/**
 * Get the raw private key bytes (for signing).
 */
export function getPrivateKey(): string {
  if (!PRIVATE_KEY) {
    throw new Error('X402_WALLET_PRIVATE_KEY is not set in environment');
  }
  return PRIVATE_KEY;
}

/**
 * Sign a message using EIP-191 (eth_sign / personal_sign).
 * This is the standard signing method for x402 payment manifests.
 * 
 * @param message JSON string of the x402 manifest
 * @param privateKeyHex Raw private key as hex string (with or without 0x prefix)
 */
export async function signMessage(message: string, privateKeyHex: string): Promise<string> {
  // Ensure private key has 0x prefix
  const key = privateKeyHex.startsWith('0x') ? privateKeyHex : `0x${privateKeyHex}`;
  
  const wallet = new ethers.Wallet(key);
  const signature = await wallet.signMessage(message);
  
  console.log(`[Wallet] Signed message (${message.length} chars), signature: ${signature.slice(0, 20)}...`);
  
  return signature;
}

/**
 * Get current wallet balance (for debugging).
 * Uses a public RPC endpoint.
 */
export async function getBalance(): Promise<{ usdc: number; eth: number }> {
  const wallet = getWallet();
  
  // Base mainnet RPC - public (no API key needed for this)
  const rpcUrl = 'https://mainnet.base.org';
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  
  const usdcContract = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
  
  // ERC-20 balanceOf
  const usdcAbi = [
    'function balanceOf(address) view returns (uint256)',
    'function decimals() view returns (uint8)',
  ];
  const usdc = new ethers.Contract(usdcContract, usdcAbi, provider);
  
  const [usdcBalance, ethBalance] = await Promise.all([
    usdc.balanceOf(wallet.address),
    provider.getBalance(wallet.address),
  ]);
  
  return {
    usdc: Number(usdcBalance) / 1e6, // USDC has 6 decimals
    eth: Number(ethBalance) / 1e18,  // ETH has 18 decimals
  };
}