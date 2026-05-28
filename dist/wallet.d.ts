/**
 * Hermes Asia Wallet Utilities
 *
 * Manages the wallet used for x402 payments.
 * Private key is read from X402_WALLET_PRIVATE_KEY environment variable.
 * Uses ethers.js v6 for signing.
 */
declare const WORKER_URL: string;
/**
 * Get the wallet address.
 */
export declare function getWalletAddress(): string;
export declare const WALLET_ADDRESS: string;
export { WORKER_URL };
/**
 * Get the raw private key bytes (for signing).
 */
export declare function getPrivateKey(): string;
/**
 * Sign a message using EIP-191 (eth_sign / personal_sign).
 * This is the standard signing method for x402 payment manifests.
 *
 * @param message JSON string of the x402 manifest
 * @param privateKeyHex Raw private key as hex string (with or without 0x prefix)
 */
export declare function signMessage(message: string, privateKeyHex: string): Promise<string>;
/**
 * Get current wallet balance (for debugging).
 * Uses a public RPC endpoint.
 */
export declare function getBalance(): Promise<{
    usdc: number;
    eth: number;
}>;
//# sourceMappingURL=wallet.d.ts.map