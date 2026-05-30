# Hermes Asia x402 MCP Server

AI agents pay USDC directly for Asia market intelligence — no API keys, no subscriptions.

## Quick Demo（AI Agent Purchase Flow）

```bash
# Any MCP-compatible AI agent can buy data like this:
npx hermes-asia-x402-mcp@latest

# Agent calls a tool → gets HTTP 402 with payment manifest
# → Signs manifest with wallet → pays USDC on-chain → receives data
# All automatic. No human in the loop.
```

## Buy Now（Direct x402 Payment）

| Product | Price | Endpoint |
|---------|-------|----------|
| Asia Intelligence（CN/TW/JP trade policy） | $0.02 | `POST /api/asia-intelligence` |
| Japanese Research（Nikkei + BOJ policy） | $0.02 | `POST /api/japanese-research` |
| Bilingual Bridge（CN-JP patent translation） | $0.03 | `POST /api/bilingual-bridge` |
| Anime Industry Intel | $0.02 | `POST /api/anime-industry-intel` |
| Kabukicho Business Guide（Tokyo night economy） | $0.02 | `POST /api/kabukicho-guide` |
| China Silver Economy（297M seniors market） | $0.02 | `POST /api/china-silver-economy` |
| Lying Flat Report（China social trend） | $0.02 | `POST /api/lying-flat-report` |
| China Real Estate 2026 | $0.03 | `POST /api/china-real-estate-2026` |

**Payment:** USDC on Base（eip155:8453）
**Recipient:** `0xFC80725F8Fd574c030F0379Fb4F86ddCE557Db7D`
**Protocol:** x402 v2, scheme=exact
**No API keys required.**

## Installation

```bash
# Claude Code / any MCP client
claude mcp add hermes-asia -- npx hermes-asia-x402-mcp@latest

# Install globally
npm install -g hermes-asia-x402-mcp-server
```

## Configuration

```bash
export X402_WALLET_PRIVATE_KEY="0x..."   # Wallet with USDC on Base
export WORKER_URL="https://base-worker-01.j23726919.workers.dev"
```

## Payment Flow

1. AI agent calls an MCP tool（e.g. `asia_intelligence`）
2. MCP Server POSTs to Hermes Worker → receives HTTP 402
3. MCP Server parses `WWW-Authenticate` header（x402 v2 manifest）
4. MCP Server signs manifest with wallet private key（EIP-191）
5. MCP Server retries with `Authorization` header
6. Worker returns data; USDC transferred on-chain atomically

**No API keys. No subscriptions. Pay per call.**

## Worker Endpoints

| Endpoint | Price | Description |
|----------|-------|-------------|
| `POST /api/asia-intelligence` | $0.02 | China/Taiwan/Japan trade policy intelligence |
| `POST /api/japanese-research` | $0.02 | Nikkei news + BOJ monetary policy |
| `POST /api/bilingual-bridge` | $0.03 | CN-JP patent & technical document translation |
| `POST /api/anime-industry-intel` | $0.02 | Japan anime industry investment analysis |
| `POST /api/kabukicho-guide` | $0.02 | Tokyo night economy business opportunities |
| `POST /api/china-silver-economy` | $0.02 | China 297M seniors market deep dive |
| `POST /api/lying-flat-report` | $0.02 | China's lying-flat phenomenon analysis |
| `POST /api/china-real-estate-2026` | $0.03 | China property market outlook 2026 |

## Requirements

- Node.js >= 20.0.0
- Wallet with USDC on Base chain
- ETH on Base chain（for gas, ~$0.01 per transaction）

## Repository

GitHub: [kten-agent/x402-mcp-server](https://github.com/kten-agent/x402-mcp-server)
npm: [hermes-asia-x402-mcp-server](https://www.npmjs.com/package/hermes-asia-x402-mcp-server)
MCP Registry: [io.github.kten-agent/x402-mcp-server](https://registry.modelcontextprotocol.io/servers/io.github.kten-agent/x402-mcp-server)

## License

MIT