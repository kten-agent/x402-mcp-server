/**
 * Hermes Asia MCP Tools
 * 
 * Maps MCP tools to the Hermes x402 Worker API endpoints.
 * Each tool corresponds to a specific product endpoint on the Worker.
 */

import { Tool } from '@modelcontextprotocol/sdk';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { x402RequestWithPayment } from './payment.js';

// All 11 products available from the Worker
// Each product maps to an API endpoint: POST /api/{product-id}

export const TOOLS: Tool[] = [
  // === API Tools (cheapest, good for testing) ===
  {
    name: 'asia_news_api',
    description: 'Real-time Asian news headlines and summaries for AI agents. Covers China, Japan, Taiwan, Korea. $0.005 USDC per request.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query for Asian news' },
        numResults: { type: 'number', description: 'Number of results (max 10)', minimum: 1, maximum: 10, default: 5 },
        region: { type: 'string', description: 'Target region code (e.g., "CN", "JP", "TW")' },
        focus: { type: 'string', description: 'Research focus area' },
        days: { type: 'number', description: 'Time window in days', minimum: 1, maximum: 30, default: 7 },
      },
      required: ['query'],
    },
  },
  {
    name: 'cn_jp_currency_api',
    description: 'Real-time USD/CNY/JPY exchange rates for AI trading agents. $0.001 USDC per request.',
    inputSchema: {
      type: 'object',
      properties: {
        base: { type: 'string', description: 'Base currency code', enum: ['USD', 'CNY', 'JPY'], default: 'USD' },
        target: { type: 'string', description: 'Target currency code', enum: ['USD', 'CNY', 'JPY'] },
      },
      required: ['target'],
    },
  },
  {
    name: 'asia_market_data',
    description: 'Macro economic data (GDP, indices, interest rates) for AI quantitative agents. $0.01 USDC per request.',
    inputSchema: {
      type: 'object',
      properties: {
        region: { type: 'string', description: 'Target region: "CN", "JP", "TW", "KR", "ALL"' },
        indicators: { type: 'array', items: { type: 'string' }, description: 'Economic indicators to fetch' },
      },
      required: ['region'],
    },
  },

  // === Intelligence Products ===
  {
    name: 'asia_intelligence',
    description: 'China/Taiwan/Japan trade policy intelligence and cross-border investment opportunities. $0.02 USDC per request.',
    inputSchema: {
      type: 'object',
      properties: {
        topic: { type: 'string', description: 'Topic: "china-trade", "taiwan-semiconductor", "japan-policy", "general"', enum: ['china-trade', 'taiwan-semiconductor', 'japan-policy', 'general'], default: 'general' },
        depth: { type: 'string', description: '"brief" (1-2 ideas) or "comprehensive" (5+ ideas)', enum: ['brief', 'comprehensive'], default: 'brief' },
      },
    },
  },
  {
    name: 'japanese_research',
    description: 'Nikkei news, corporate earnings surprises, BOJ policy signals, and sector rotation analysis. $0.02 USDC per request.',
    inputSchema: {
      type: 'object',
      properties: {
        focus: { type: 'string', description: 'Focus: "nikkei", "corporate-earnings", "boj-policy", "sector-analysis", "all"', enum: ['nikkei', 'corporate-earnings', 'boj-policy', 'sector-analysis', 'all'], default: 'all' },
        days: { type: 'number', description: 'Days to look back (1-7)', minimum: 1, maximum: 7, default: 3 },
      },
    },
  },
  {
    name: 'bilingual_bridge',
    description: 'Professional CN-JP patent and regulatory document translation with domain terminology matching. $0.03 USDC per request.',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Text content to translate' },
        source_lang: { type: 'string', description: 'Source language: "zh" or "ja"', enum: ['zh', 'ja'] },
        target_lang: { type: 'string', description: 'Target language: "ja" or "zh"', enum: ['ja', 'zh'] },
        domain: { type: 'string', description: 'Domain: "patent", "regulatory", "technical", "business", "general"', enum: ['patent', 'regulatory', 'technical', 'business', 'general'], default: 'general' },
      },
      required: ['text', 'source_lang', 'target_lang'],
    },
  },
  {
    name: 'anime_industry_intel',
    description: 'Japan anime industry investment guide covering studio potential, IP licensing revenue, streaming battle analysis. $0.02 USDC per request.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query or topic within anime industry' },
        scope: { type: 'string', description: 'Scope: "investment", "licensing", "streaming", "merch", "general"', enum: ['investment', 'licensing', 'streaming', 'merch', 'general'], default: 'general' },
      },
      required: ['query'],
    },
  },
  {
    name: 'kabukicho_guide',
    description: 'Tokyo night economy and entertainment district investment analysis. $0.02 USDC per request.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Investment focus or specific area in Kabukicho/Shinjuku' },
      },
      required: ['query'],
    },
  },
  {
    name: 'china_silver_economy',
    description: 'China 297 million seniors market analysis covering consumption patterns, healthcare opportunities, and銀髮经济 trends. $0.02 USDC per request.',
    inputSchema: {
      type: 'object',
      properties: {
        sector: { type: 'string', description: 'Focus sector: "healthcare", "tourism", "food", "finance", "general"', enum: ['healthcare', 'tourism', 'food', 'finance', 'general'], default: 'general' },
      },
    },
  },
  {
    name: 'lying_flat_report',
    description: 'Analysis of Chinas lying-flat phenomenon (躺平) and its impact on consumer behavior, birth rate, and economic implications. $0.02 USDC per request.',
    inputSchema: {
      type: 'object',
      properties: {
        aspect: { type: 'string', description: 'Focus aspect: "demographics", "economic-impact", "policy-response", "generational"', enum: ['demographics', 'economic-impact', 'policy-response', 'generational'], default: 'economic-impact' },
      },
    },
  },
  {
    name: 'china_real_estate_2026',
    description: 'China property market rebound analysis covering policy effects, investment opportunities, and risk assessment for 2026. $0.03 USDC per request.',
    inputSchema: {
      type: 'object',
      properties: {
        city: { type: 'string', description: 'Specific city or region to analyze' },
        focus: { type: 'string', description: 'Focus: "policy-outlook", "investment-calls", "risk-assessment", "market-data"', enum: ['policy-outlook', 'investment-calls', 'risk-assessment', 'market-data'], default: 'market-data' },
      },
    },
  },
];

// Tool name to API endpoint mapping
const TOOL_ENDPOINTS: Record<string, string> = {
  asia_news_api: '/api/asia-news-api',
  cn_jp_currency_api: '/api/cn-jp-currency-api',
  asia_market_data: '/api/asia-market-data',
  asia_intelligence: '/api/asia-intelligence',
  japanese_research: '/api/japanese-research',
  bilingual_bridge: '/api/bilingual-bridge',
  anime_industry_intel: '/api/anime-industry-intel',
  kabukicho_guide: '/api/kabukicho-guide',
  china_silver_economy: '/api/china-silver-economy',
  lying_flat_report: '/api/lying-flat-report',
  china_real_estate_2026: '/api/china-real-estate-2026',
};

/**
 * Execute an MCP tool by calling the corresponding Worker endpoint with x402 payment handling.
 */
export async function executeTool(
  toolName: string,
  args: Record<string, unknown>
): Promise<CallToolResult> {
  const endpoint = TOOL_ENDPOINTS[toolName];

  if (!endpoint) {
    return {
      content: [{ type: 'text', text: JSON.stringify({ error: `Unknown tool: ${toolName}` }) }],
      isError: true,
    };
  }

  try {
    const result = await x402RequestWithPayment(endpoint, args as Record<string, unknown>);

    return {
      content: [
        {
          type: 'text',
          text: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
        },
      ],
      isError: false,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${toolName}] Error:`, message);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: 'Tool execution failed', tool: toolName, details: message }),
        },
      ],
      isError: true,
    };
  }
}