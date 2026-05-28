/**
 * Hermes Asia x402 MCP Server
 *
 * MCP server that exposes Hermes Asia intelligence products as AI agent tools,
 * with built-in x402 v2 USDC payment handling.
 *
 * Payment flow:
 * 1. POST to Worker endpoint → 402 with WWW-Authenticate header (base64 JSON blob)
 * 2. Decode header → extract amount (wei), payTo address, USDC contract
 * 3. Sign ERC-20 transfer (USDC approval + transferFrom) using ethers.js v6
 * 4. Retry with Authorization header containing the signed payment manifest
 */
export {};
//# sourceMappingURL=index.d.ts.map