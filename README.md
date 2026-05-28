# Hermes Asia x402 MCP Server

Exposes Hermes Asia intelligence products as MCP tools with built-in x402 USDC payment handling on Base chain.

## Products (11 total)

**API Products** (high volume, low cost)
- `asia_news_api` — $0.005 USDC — Real-time Asian news headlines
- `cn_jp_currency_api` — $0.001 USDC — USD/CNY/JPY exchange rates
- `asia_market_data` — $0.01 USDC — Macro economic data

**Intelligence Products** (high value)
- `asia_intelligence` — $0.02 USDC — China/Taiwan/Japan trade policy
- `japanese_research` — $0.02 USDC — Nikkei news + BOJ policy
- `bilingual_bridge` — $0.03 USDC — CN-JP patent translation
- `anime_industry_intel` — $0.02 USDC — Japan anime industry investment
- `kabukicho_guide` — $0.02 USDC — Tokyo night economy investment
- `china_silver_economy` — $0.02 USDC — China 297M seniors market
- `lying_flat_report` — $0.02 USDC — China's lying-flat phenomenon
- `china_real_estate_2026` — $0.03 USDC — China property market 2026

## Installation

```bash
# For Claude Code / Franklin / any MCP client
npx hermes-asia-x402-mcp@latest

# Or install globally
npm install -g hermes-asia-x402-mcp-server
```

## Configuration

Set the wallet private key and Worker URL:

```bash
export X402_WALLET_PRIVATE_KEY="0x..."
export WORKER_URL="https://base-worker-01.j23726919.workers.dev"
```

## MCP Client Integration

**Claude Code:**
```bash
claude mcp add hermes-asia -- npx hermes-asia-x402-mcp@latest
```

**Cursor / Other MCP clients:**
Add to your MCP settings JSON:
```json
{
  "mcpServers": {
    "hermes-asia": {
      "command": "npx",
      "args": ["hermes-asia-x402-mcp@latest"]
    }
  }
}
```

## Payment Flow

1. AI agent calls an MCP tool (e.g. `asia_news_api`)
2. MCP Server POSTs to Hermes Worker → receives HTTP 402
3. MCP Server parses `WWW-Authenticate` header (x402 v2 manifest)
4. MCP Server signs manifest with wallet private key (EIP-191)
5. MCP Server retries with `Authorization` header
6. Worker returns data; USDC transferred on-chain

No API keys. No subscriptions. Pay per call.

## Requirements

- Node.js >= 20.0.0
- Wallet with USDC on Base chain (for payment)
- ETH on Base chain (for gas)

## License

MIT