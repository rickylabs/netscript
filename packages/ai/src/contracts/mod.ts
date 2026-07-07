/**
 * `@netscript/ai/contracts` — the domain vocabulary of the AI stack.
 *
 * Pure types plus the typed error hierarchy. No IO, no ports, no runtime state.
 * Provider adapters (E2), the agent loop (E3), tool/vision/embedding slices, and
 * the plugin surface all speak this vocabulary.
 *
 * @module
 */

export * from './content.ts';
export * from './generation.ts';
export * from './message.ts';
export * from './tool.ts';
export * from './usage.ts';
export * from './model.ts';
export * from './chunk.ts';
export * from './ui.ts';
export * from './errors.ts';
