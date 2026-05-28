/**
 * Hermes Asia MCP Tools
 *
 * Maps MCP tools to the Hermes x402 Worker API endpoints.
 * Each tool corresponds to a specific product endpoint on the Worker.
 */
import { Tool } from '@modelcontextprotocol/sdk';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
export declare const TOOLS: Tool[];
/**
 * Execute an MCP tool by calling the corresponding Worker endpoint with x402 payment handling.
 */
export declare function executeTool(toolName: string, args: Record<string, unknown>): Promise<CallToolResult>;
//# sourceMappingURL=tools.d.ts.map