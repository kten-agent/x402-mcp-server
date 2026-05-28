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

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  Resource,
} from '@modelcontextprotocol/sdk/types.js';

import { TOOLS, executeTool } from './tools.js';
import { createProductResources, getCatalogResource } from './resources.js';

// Initialize product resources
const RESOURCES: Resource[] = createProductResources();

// Create MCP server instance
const server = new Server(
  {
    name: 'hermes-asia-x402',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// Register tool list handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: TOOLS,
  };
});

// Register resource list handler
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: RESOURCES,
  };
});

// Register resource read handler
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri;
  const resource = getCatalogResource(uri);
  
  if (!resource) {
    return {
      content: [],
      isError: true,
    };
  }
  
  return {
    contents: [resource],
  };
});

// Register tool execution handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;
  return executeTool(name, args);
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  // Suppress console in production (stdio mode)
  // Comment out during development to see logs
}

main().catch(console.error);