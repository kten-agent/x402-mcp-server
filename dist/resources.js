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
export {
  createProductResources,
  getCatalogResource
};
