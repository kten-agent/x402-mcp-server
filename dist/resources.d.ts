/**
 * Hermes Asia Product Resources
 *
 * Exposes the product catalog as MCP resources.
 * Each product is a resource that AI assistants can read to understand what's available.
 */
import { Resource } from '@modelcontextprotocol/sdk/types.js';
/**
 * Create MCP resources for all products.
 */
export declare function createProductResources(): Resource[];
/**
 * Get the catalog resource content as a JSON Resource.
 */
export declare function getCatalogResource(uri: string): Resource | null;
//# sourceMappingURL=resources.d.ts.map