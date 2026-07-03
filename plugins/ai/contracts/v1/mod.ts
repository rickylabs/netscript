/**
 * AI Plugin Contracts - Version 1.
 *
 * Re-exports the oRPC `/v1/ai` contract surface owned by
 * `@netscript/plugin-ai-core`. The connector declares this loader on its
 * manifest (`withContractVersions`) so a host binds the AI plugin against a
 * single pinned contract surface.
 *
 * @module
 */

export * from '@netscript/plugin-ai-core/contracts/v1';
