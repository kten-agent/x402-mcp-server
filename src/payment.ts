/**
 * x402 v2 Payment Handler
 * 
 * Implements the x402 protocol v2 payment flow:
 * 1. POST request → 402 with WWW-Authenticate header
 * 2. Parse the base64url-encoded JSON manifest from WWW-Authenticate
 * 3. Sign the manifest using EIP-191 (eth personal_sign)
 * 4. Retry with Authorization header containing the signed payment blob
 */

import axios, { AxiosError } from 'axios';

// Known constants
const USDC_CONTRACT = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const BASE_CHAIN_ID = 8453n;

// Import wallet utilities
import { signMessage, WALLET_ADDRESS, getPrivateKey } from './wallet.js';

export interface X402Manifest {
  x402Version: number;
  resource: {
    url: string;
    description: string;
    mimeType: string;
  };
  accepts: Array<{
    scheme: 'exact' | string;
    network: string;
    amount: string; // in wei
    payTo: string;
    maxTimeoutSeconds: number;
    asset: string; // USDC contract address
    extra?: {
      name: string;
      version: string;
      breakdown: Record<string, number>;
      totalUsd: number;
    };
  }>;
  error: string;
  extensions?: Record<string, unknown>;
}

export interface X402PaymentHeader {
  'WWW-Authenticate': string;
}

/**
 * Parse the WWW-Authenticate header value.
 * Format: x402 <base64url-encoded JSON manifest>
 * The x402 v2 spec uses a compact binary encoding in the WWW-Authenticate header.
 */
export function parseWwwAuthenticate(header: string): X402Manifest | null {
  if (!header.startsWith('x402 ')) {
    return null;
  }
  
  try {
    const token = header.slice(5); // Remove "x402 " prefix
    // Use base64url decoding (url-safe base64)
    const jsonStr = Buffer.from(token, 'base64url').toString('utf-8');
    const manifest = JSON.parse(jsonStr) as X402Manifest;
    
    if (manifest.x402Version !== 2) {
      console.error(`Unsupported x402 version: ${manifest.x402Version}`);
      return null;
    }
    
    return manifest;
  } catch (error) {
    console.error('Failed to parse WWW-Authenticate header:', error);
    return null;
  }
}

/**
 * Build the Authorization header for the payment retry.
 * Format: x402 <base64url-encoded signed payload>
 */
export function buildAuthorizationHeader(
  manifest: X402Manifest,
  signature: string
): string {
  // The authorization payload is: manifest + signature (both base64url)
  const manifestToken = Buffer.from(JSON.stringify(manifest)).toString('base64url');
  const authPayload = Buffer.from(JSON.stringify({
    manifest: manifestToken,
    signature: signature,
    sender: WALLET_ADDRESS,
  })).toString('base64url');
  
  return `x402 ${authPayload}`;
}

/**
 * Execute an x402 request with automatic payment handling.
 * 
 * Flow:
 * 1. POST to Worker with JSON body → may return 402 (payment required)
 * 2. If 402: parse WWW-Authenticate header → decode manifest → sign → retry
 * 3. Return the actual content on success
 */
export async function x402Request<T = unknown>(
  endpoint: string,
  body: Record<string, unknown>
): Promise<T> {
  const workerUrl = process.env.WORKER_URL || 'https://base-worker-01.j23726919.workers.dev';
  const url = `${workerUrl}${endpoint}`;
  
  // First attempt
  let response = await axios.post<T>(url, body, {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'Hermes-Asia-MCP/1.0',
    },
    timeout: 30000,
  });
  
  return response.data;
}

/**
 * Execute x402 request with payment retry.
 * Handles the 402 → sign → retry flow automatically.
 */
export async function x402RequestWithPayment<T = unknown>(
  endpoint: string,
  body: Record<string, unknown>
): Promise<T> {
  const workerUrl = process.env.WORKER_URL || 'https://base-worker-01.j23726919.workers.dev';
  const url = `${workerUrl}${endpoint}`;
  
  // First attempt - POST without payment
  let lastError: Error | null = null;
  
  try {
    const response = await axios.post<T>(url, body, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Hermes-Asia-MCP/1.0',
      },
      timeout: 30000,
    });
    return response.data;
  } catch (error) {
    if (!(error instanceof AxiosError)) {
      throw error;
    }
    
    const axiosError = error as AxiosError<unknown>;
    
    // Check for 402 Payment Required
    if (axiosError.response?.status === 402) {
      const wwwAuth = axiosError.response.headers['www-authenticate'] as string | undefined;
      
      if (!wwwAuth) {
        throw new Error('402 response received but no WWW-Authenticate header found');
      }
      
      // Parse the payment manifest
      const manifest = parseWwwAuthenticate(wwwAuth);
      
      if (!manifest) {
        throw new Error('Failed to parse WWW-Authenticate header as x402 v2 manifest');
      }
      
      // Get the accepted payment option (we use the first/only one)
      const acceptOption = manifest.accepts[0];
      console.log(`[x402] Payment required: ${Number(acceptOption.amount) / 1e6} USDC to ${acceptOption.payTo}`);
      
      // Sign the manifest using EIP-191 personal_sign
      const privateKey = getPrivateKey();
      const manifestJson = JSON.stringify(manifest);
      const signature = await signMessage(manifestJson, privateKey);
      
      // Build the Authorization header
      const authHeader = buildAuthorizationHeader(manifest, signature);
      
      // Retry with payment
      const retryResponse = await axios.post<T>(url, body, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Hermes-Asia-MCP/1.0',
          'Authorization': authHeader,
        },
        timeout: 30000,
      });
      
      return retryResponse.data;
    }
    
    // Not a 402 - re-throw the original error
    throw axiosError;
  }
}

/**
 * Convert wei amount to USDC decimal (6 decimals).
 */
export function weiToUsdc(weiAmount: string): number {
  return Number(BigInt(weiAmount)) / 1e6;
}