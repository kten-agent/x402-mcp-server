# Hermes Asia x402 MCP Server

An MCP (Model Context Protocol) server that exposes Hermes Asia intelligence products as AI agent tools — with **built-in x402 USDC payment handling** on Base mainnet.

## What This Does

AI assistants (Claude Desktop, Cursor AI, etc.) can call these 11 tools directly. When a tool requires payment, the MCP server automatically:

1. Detects the HTTP 402 response
2. Parses the `WWW-Authenticate` header (x402 v2 manifest)
3. Signs the payment manifest using your Base wallet (ethers.js v6)
4. Retries the request with the signed `Authorization` header
5. Returns the content to the AI assistant

All payment complexity is hidden from the AI agent.

## Products (11 tools)

| Tool | Price | Description |
|------|-------|-------------|
| `asia_news_api` | $0.005 | Real-time Asian news headlines for AI agents |
| `cn_jp_currency_api` | $0.001 | USD/CNY/JPY exchange rates for trading agents |
| `asia_market_data` | $0.01 | Macro data (GDP, indices, rates) for quant agents |
| `asia_intelligence` | $0.02 | China/Taiwan/Japan trade policy intelligence |
| `japanese_research` | $0.02 | Nikkei news, earnings, BOJ policy analysis |
| `bilingual_bridge` | $0.03 | CN-JP patent & regulatory document translation |
| `anime_industry_intel` | $0.02 | Japan anime industry investment analysis |
| `kabukicho_guide` | $0.02 | Tokyo night economy investment guide |
| `china_silver_economy` | $0.02 | China 297M seniors market analysis |
| `lying_flat_report` | $0.02 | China's lying-flat phenomenon & consumer behavior |
| `china_real_estate_2026` | $0.03 | China property market 2026 rebound analysis |

## Quick Start

### 1. Prerequisites

- Node.js >= 20.0.0
- A Base mainnet wallet with USDC for payments
- npm or yarn

### 2. Install

```bash
cd /Users/k.ebisu/.hermes/x402-mcp-server
npm install
npm run build   # Build with esbuild (or: npx esbuild src/index.ts --bundle ...)
```

### 3. Configure your wallet

The MCP server needs your Base wallet private key for signing x402 payments:

```bash
# Option A: Environment variable
export X402_WALLET_PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE

# Option B: .env file (copy from .env.example)
cp .env.example .env
# Edit .env and add your private key
```

**⚠️ WARNING: Never commit .env to version control!**

### 4. Run

```bash
# Production
npm start

# Development (with hot reload)
npm run dev
```

The server uses stdio transport (MCP standard) — it communicates via stdin/stdout.

## Configuration for AI Clients

### Claude Desktop (macOS)

Edit: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "hermes-asia-x402": {
      "command": "node",
      "args": ["/Users/k.ebisu/.hermes/x402-mcp-server/dist/index.js"],
      "env": {
        "X402_WALLET_PRIVATE_KEY": "0xYOUR_PRIVATE_KEY_HERE",
        "WORKER_URL": "https://base-worker-01.j23726919.workers.dev"
      }
    }
  }
}
```

### Claude Desktop (Windows)

Edit: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "hermes-asia-x402": {
      "command": "node",
      "args": ["C:\\Users\\YOUR_USER\\.hermes\\x402-mcp-server\\dist\\index.js"],
      "env": {
        "X402_WALLET_PRIVATE_KEY": "0xYOUR_PRIVATE_KEY_HERE",
        "WORKER_URL": "https://base-worker-01.j23726919.workers.dev"
      }
    }
  }
}
```

### Cursor AI

In Cursor settings, add MCP server:

```json
{
  "mcpServers": {
    "hermes-asia-x402": {
      "command": "node",
      "args": ["/Users/k.ebisu/.hermes/x402-mcp-server/dist/index.js"],
      "env": {
        "X402_WALLET_PRIVATE_KEY": "0xYOUR_PRIVATE_KEY_HERE"
      }
    }
  }
}
```

### Zed Editor

Add to `.zed/mcp.json` in your project or home directory:

```json
{
  "mcpServers": {
    "hermes-asia-x402": {
      "command": "node",
      "args": ["/Users/k.ebisu/.hermes/x402-mcp-server/dist/index.js"],
      "env": {
        "X402_WALLET_PRIVATE_KEY": "0xYOUR_PRIVATE_KEY_HERE"
      }
    }
  }
}
```

## Architecture

```
AI Assistant (Claude/Cursor)
       |
       | stdio (MCP protocol)
       v
┌──────────────────────────────────┐
│  Hermes Asia x402 MCP Server     │
│  - tool definitions (11 tools)    │
│  - payment flow handler          │
│  - wallet signing (ethers.js)    │
└──────────────────────────────────┘
       |
       | HTTP POST + x402 headers
       v
┌──────────────────────────────────┐
│  Hermes x402 Worker              │
│  https://base-worker-01.j23726919 │
│  - 11 product endpoints          │
│  - x402 v2 payment verification  │
│  - returns content on success    │
└──────────────────────────────────┘
```

## x402 Payment Flow (Technical)

1. **First request**: POST to `/api/{product-id}` without payment headers
2. **402 Response**: Worker returns HTTP 402 with `WWW-Authenticate: x402 <base64url manifest>`

   The manifest contains:
   - `amount`: payment amount in wei (e.g., `"5000"` = $0.005 USDC)
   - `payTo`: receiving wallet address
   - `asset`: USDC contract address (`0x833589f...`)
   - `network`: `eip155:8453` (Base mainnet)

3. **Sign**: MCP server signs the manifest JSON using EIP-191 (`eth_sign` / personal_sign)
4. **Retry**: POST again with `Authorization: x402 <base64url(signed manifest + signature)>`
5. **Success**: Worker returns the actual content (JSON)

## File Structure

```
x402-mcp-server/
├── src/
│   ├── index.ts       # MCP server entry point (stdio transport)
│   ├── tools.ts       # 11 tool definitions + handler dispatch
│   ├── payment.ts     # x402 payment flow (402 → sign → retry)
│   ├── wallet.ts      # ethers.js wallet + message signing
│   └── resources.ts   # Product catalog as MCP resources
├── dist/              # esbuild output (runnable)
├── package.json
├── tsconfig.json
└── README.md
```

## Troubleshooting

### "Module not found: @modelcontextprotocol/sdk"

This is a TypeScript `moduleResolution` issue. The package uses `exports` field but `NodeNext` module resolution can't find it. Run the build with esbuild instead of tsc:

```bash
npx esbuild src/index.ts --bundle --platform=node --target=node20 --outdir=dist --format=esm --packages=external
```

### Payment failing

1. Check your wallet has enough USDC on Base mainnet
2. Verify `X402_WALLET_PRIVATE_KEY` is correct (no `0x` prefix needed, but it's OK if present)
3. Try a test call to the Worker directly:

```bash
curl -X POST https://base-worker-01.j23726919.workers.dev/api/asia-news-api \
  -H "Content-Type: application/json" \
  -d '{"query": "test"}'
```

Expected: HTTP 402 with `WWW-Authenticate` header (not a 500 error).

## GitHub

This MCP server is part of the Hermes Asia x402 project:
- Worker: https://github.com/NoFxAiOS/claw402-open (PR #3)
- Awesome x402 listing: https://github.com/tatemccord/awesome-x402 (PR #438)