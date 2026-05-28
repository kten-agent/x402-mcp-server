/**
 * x402 v2 Payment Handler
 *
 * Implements the x402 protocol v2 payment flow:
 * 1. POST request → 402 with WWW-Authenticate header
 * 2. Parse the base64url-encoded JSON manifest from WWW-Authenticate
 * 3. Sign the manifest using EIP-191 (eth personal_sign)
 * 4. Retry with Authorization header containing the signed payment blob
 */
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
        amount: string;
        payTo: string;
        maxTimeoutSeconds: number;
        asset: string;
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
export declare function parseWwwAuthenticate(header: string): X402Manifest | null;
/**
 * Build the Authorization header for the payment retry.
 * Format: x402 <base64url-encoded signed payload>
 */
export declare function buildAuthorizationHeader(manifest: X402Manifest, signature: string): string;
/**
 * Execute an x402 request with automatic payment handling.
 *
 * Flow:
 * 1. POST to Worker with JSON body → may return 402 (payment required)
 * 2. If 402: parse WWW-Authenticate header → decode manifest → sign → retry
 * 3. Return the actual content on success
 */
export declare function x402Request<T = unknown>(endpoint: string, body: Record<string, unknown>): Promise<T>;
/**
 * Execute x402 request with payment retry.
 * Handles the 402 → sign → retry flow automatically.
 */
export declare function x402RequestWithPayment<T = unknown>(endpoint: string, body: Record<string, unknown>): Promise<T>;
/**
 * Convert wei amount to USDC decimal (6 decimals).
 */
export declare function weiToUsdc(weiAmount: string): number;
//# sourceMappingURL=payment.d.ts.map