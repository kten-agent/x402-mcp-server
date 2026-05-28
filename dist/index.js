// src/index.ts
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema
} from "@modelcontextprotocol/sdk/types.js";

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

// src/tools.ts
var TOOLS = [
  // === API Tools (cheapest, good for testing) ===
  {
    name: "asia_news_api",
    description: "Real-time Asian news headlines and summaries for AI agents. Covers China, Japan, Taiwan, Korea. $0.005 USDC per request.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query for Asian news" },
        numResults: { type: "number", description: "Number of results (max 10)", minimum: 1, maximum: 10, default: 5 },
        region: { type: "string", description: 'Target region code (e.g., "CN", "JP", "TW")' },
        focus: { type: "string", description: "Research focus area" },
        days: { type: "number", description: "Time window in days", minimum: 1, maximum: 30, default: 7 }
      },
      required: ["query"]
    }
  },
  {
    name: "cn_jp_currency_api",
    description: "Real-time USD/CNY/JPY exchange rates for AI trading agents. $0.001 USDC per request.",
    inputSchema: {
      type: "object",
      properties: {
        base: { type: "string", description: "Base currency code", enum: ["USD", "CNY", "JPY"], default: "USD" },
        target: { type: "string", description: "Target currency code", enum: ["USD", "CNY", "JPY"] }
      },
      required: ["target"]
    }
  },
  {
    name: "asia_market_data",
    description: "Macro economic data (GDP, indices, interest rates) for AI quantitative agents. $0.01 USDC per request.",
    inputSchema: {
      type: "object",
      properties: {
        region: { type: "string", description: 'Target region: "CN", "JP", "TW", "KR", "ALL"' },
        indicators: { type: "array", items: { type: "string" }, description: "Economic indicators to fetch" }
      },
      required: ["region"]
    }
  },
  // === Intelligence Products ===
  {
    name: "asia_intelligence",
    description: "China/Taiwan/Japan trade policy intelligence and cross-border investment opportunities. $0.02 USDC per request.",
    inputSchema: {
      type: "object",
      properties: {
        topic: { type: "string", description: 'Topic: "china-trade", "taiwan-semiconductor", "japan-policy", "general"', enum: ["china-trade", "taiwan-semiconductor", "japan-policy", "general"], default: "general" },
        depth: { type: "string", description: '"brief" (1-2 ideas) or "comprehensive" (5+ ideas)', enum: ["brief", "comprehensive"], default: "brief" }
      }
    }
  },
  {
    name: "japanese_research",
    description: "Nikkei news, corporate earnings surprises, BOJ policy signals, and sector rotation analysis. $0.02 USDC per request.",
    inputSchema: {
      type: "object",
      properties: {
        focus: { type: "string", description: 'Focus: "nikkei", "corporate-earnings", "boj-policy", "sector-analysis", "all"', enum: ["nikkei", "corporate-earnings", "boj-policy", "sector-analysis", "all"], default: "all" },
        days: { type: "number", description: "Days to look back (1-7)", minimum: 1, maximum: 7, default: 3 }
      }
    }
  },
  {
    name: "bilingual_bridge",
    description: "Professional CN-JP patent and regulatory document translation with domain terminology matching. $0.03 USDC per request.",
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string", description: "Text content to translate" },
        source_lang: { type: "string", description: 'Source language: "zh" or "ja"', enum: ["zh", "ja"] },
        target_lang: { type: "string", description: 'Target language: "ja" or "zh"', enum: ["ja", "zh"] },
        domain: { type: "string", description: 'Domain: "patent", "regulatory", "technical", "business", "general"', enum: ["patent", "regulatory", "technical", "business", "general"], default: "general" }
      },
      required: ["text", "source_lang", "target_lang"]
    }
  },
  {
    name: "anime_industry_intel",
    description: "Japan anime industry investment guide covering studio potential, IP licensing revenue, streaming battle analysis. $0.02 USDC per request.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query or topic within anime industry" },
        scope: { type: "string", description: 'Scope: "investment", "licensing", "streaming", "merch", "general"', enum: ["investment", "licensing", "streaming", "merch", "general"], default: "general" }
      },
      required: ["query"]
    }
  },
  {
    name: "kabukicho_guide",
    description: "Tokyo night economy and entertainment district investment analysis. $0.02 USDC per request.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Investment focus or specific area in Kabukicho/Shinjuku" }
      },
      required: ["query"]
    }
  },
  {
    name: "china_silver_economy",
    description: "China 297 million seniors market analysis covering consumption patterns, healthcare opportunities, and\u9280\u9AEE\u7ECF\u6D4E trends. $0.02 USDC per request.",
    inputSchema: {
      type: "object",
      properties: {
        sector: { type: "string", description: 'Focus sector: "healthcare", "tourism", "food", "finance", "general"', enum: ["healthcare", "tourism", "food", "finance", "general"], default: "general" }
      }
    }
  },
  {
    name: "lying_flat_report",
    description: "Analysis of Chinas lying-flat phenomenon (\u8EBA\u5E73) and its impact on consumer behavior, birth rate, and economic implications. $0.02 USDC per request.",
    inputSchema: {
      type: "object",
      properties: {
        aspect: { type: "string", description: 'Focus aspect: "demographics", "economic-impact", "policy-response", "generational"', enum: ["demographics", "economic-impact", "policy-response", "generational"], default: "economic-impact" }
      }
    }
  },
  {
    name: "china_real_estate_2026",
    description: "China property market rebound analysis covering policy effects, investment opportunities, and risk assessment for 2026. $0.03 USDC per request.",
    inputSchema: {
      type: "object",
      properties: {
        city: { type: "string", description: "Specific city or region to analyze" },
        focus: { type: "string", description: 'Focus: "policy-outlook", "investment-calls", "risk-assessment", "market-data"', enum: ["policy-outlook", "investment-calls", "risk-assessment", "market-data"], default: "market-data" }
      }
    }
  }
];
var TOOL_ENDPOINTS = {
  asia_news_api: "/api/asia-news-api",
  cn_jp_currency_api: "/api/cn-jp-currency-api",
  asia_market_data: "/api/asia-market-data",
  asia_intelligence: "/api/asia-intelligence",
  japanese_research: "/api/japanese-research",
  bilingual_bridge: "/api/bilingual-bridge",
  anime_industry_intel: "/api/anime-industry-intel",
  kabukicho_guide: "/api/kabukicho-guide",
  china_silver_economy: "/api/china-silver-economy",
  lying_flat_report: "/api/lying-flat-report",
  china_real_estate_2026: "/api/china-real-estate-2026"
};
async function executeTool(toolName, args) {
  const endpoint = TOOL_ENDPOINTS[toolName];
  if (!endpoint) {
    return {
      content: [{ type: "text", text: JSON.stringify({ error: `Unknown tool: ${toolName}` }) }],
      isError: true
    };
  }
  try {
    const result = await x402RequestWithPayment(endpoint, args);
    return {
      content: [
        {
          type: "text",
          text: typeof result === "string" ? result : JSON.stringify(result, null, 2)
        }
      ],
      isError: false
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${toolName}] Error:`, message);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ error: "Tool execution failed", tool: toolName, details: message })
        }
      ],
      isError: true
    };
  }
}

// src/resources.ts
var PRODUCTS = [
  // === API Products (low cost, high volume) ===
  {
    id: "asia-news-api",
    name: "Asia News API",
    desc: "Real-time Asian news headlines and summaries for AI agents. Covers China, Japan, Taiwan, Korea.",
    price: "$0.005",
    priceWei: "5000",
    endpoint: "/api/asia-news-api",
    method: "POST",
    category: "API"
  },
  {
    id: "cn-jp-currency-api",
    name: "CN/JP Currency API",
    desc: "Real-time USD/CNY/JPY exchange rates for AI trading agents.",
    price: "$0.001",
    priceWei: "1000",
    endpoint: "/api/cn-jp-currency-api",
    method: "POST",
    category: "API"
  },
  {
    id: "asia-market-data",
    name: "Asia Market Data API",
    desc: "Macro economic data (GDP, indices, interest rates) for AI quantitative agents.",
    price: "$0.01",
    priceWei: "10000",
    endpoint: "/api/asia-market-data",
    method: "POST",
    category: "API"
  },
  // === Intelligence Products ===
  {
    id: "asia-intelligence",
    name: "Asia Intelligence",
    desc: "China/Taiwan/Japan trade policy intelligence and cross-border investment opportunities.",
    price: "$0.02",
    priceWei: "20000",
    endpoint: "/api/asia-intelligence",
    method: "POST",
    category: "Intelligence"
  },
  {
    id: "japanese-research",
    name: "Japanese Research",
    desc: "Nikkei news, corporate earnings surprises, BOJ policy signals, and sector rotation analysis.",
    price: "$0.02",
    priceWei: "20000",
    endpoint: "/api/japanese-research",
    method: "POST",
    category: "Intelligence"
  },
  {
    id: "bilingual-bridge",
    name: "Bilingual Bridge",
    desc: "Professional CN-JP patent and regulatory document translation with domain terminology matching.",
    price: "$0.03",
    priceWei: "30000",
    endpoint: "/api/bilingual-bridge",
    method: "POST",
    category: "Intelligence"
  },
  {
    id: "anime-industry-intel",
    name: "Anime Industry Intel",
    desc: "Japan anime industry investment guide covering studio potential, IP licensing revenue, streaming battle analysis.",
    price: "$0.02",
    priceWei: "20000",
    endpoint: "/api/anime-industry-intel",
    method: "POST",
    category: "Intelligence"
  },
  {
    id: "kabukicho-guide",
    name: "Kabukicho Business Guide",
    desc: "Tokyo night economy and entertainment district investment analysis.",
    price: "$0.02",
    priceWei: "20000",
    endpoint: "/api/kabukicho-guide",
    method: "POST",
    category: "Intelligence"
  },
  {
    id: "china-silver-economy",
    name: "China Silver Economy",
    desc: "China 297M seniors market analysis covering consumption patterns, healthcare opportunities.",
    price: "$0.02",
    priceWei: "20000",
    endpoint: "/api/china-silver-economy",
    method: "POST",
    category: "Intelligence"
  },
  {
    id: "lying-flat-report",
    name: "Lying Flat Report",
    desc: "Analysis of China's lying-flat phenomenon and impact on consumer behavior, birth rate, economic implications.",
    price: "$0.02",
    priceWei: "20000",
    endpoint: "/api/lying-flat-report",
    method: "POST",
    category: "Intelligence"
  },
  {
    id: "china-real-estate-2026",
    name: "China Real Estate 2026",
    desc: "China property market rebound analysis covering policy effects, investment opportunities, risk assessment for 2026.",
    price: "$0.03",
    priceWei: "30000",
    endpoint: "/api/china-real-estate-2026",
    method: "POST",
    category: "Intelligence"
  }
];
function createProductResources() {
  const resources = [];
  resources.push({
    uri: "hermes://products/catalog",
    name: "Hermes Asia Product Catalog",
    description: "Complete catalog of Hermes Asia x402 products with pricing in USDC",
    mimeType: "application/json"
  });
  for (const product of PRODUCTS) {
    resources.push({
      uri: `hermes://products/${product.id}`,
      name: product.name,
      description: `${product.desc} \u2014 ${product.price} USDC via x402 on Base`,
      mimeType: "application/json"
    });
  }
  const categories = [...new Set(PRODUCTS.map((p) => p.category))];
  for (const category of categories) {
    resources.push({
      uri: `hermes://products/category/${category.toLowerCase()}`,
      name: `${category} Products`,
      description: `All ${category} products available on Hermes Asia x402 marketplace`,
      mimeType: "application/json"
    });
  }
  return resources;
}
function getCatalogResource(uri) {
  const products = createProductResources();
  const resource = products.find((r) => r.uri === uri);
  if (!resource) {
    return null;
  }
  return resource;
}

// src/index.ts
var RESOURCES = createProductResources();
var server = new Server(
  {
    name: "hermes-asia-x402",
    version: "1.0.0"
  },
  {
    capabilities: {
      tools: {},
      resources: {}
    }
  }
);
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: TOOLS
  };
});
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: RESOURCES
  };
});
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri;
  const resource = getCatalogResource(uri);
  if (!resource) {
    return {
      content: [],
      isError: true
    };
  }
  return {
    contents: [resource]
  };
});
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;
  return executeTool(name, args);
});
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
main().catch(console.error);
