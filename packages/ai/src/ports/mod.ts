/**
 * `@netscript/ai/ports` — capability seams for the AI stack.
 *
 * Every injectable capability is defined here as an interface plus a default
 * factory (either a no-op or a throwing "unconfigured" default). The composition
 * root (`@netscript/ai`) wires these; provider/behavior slices (E2–E10) supply
 * concrete implementations. The model registry (`registerModelProvider` /
 * `getModelProvider` / `getModel`) also lives here and is the self-registration
 * seam for provider packages.
 *
 * @module
 */

export * from './telemetry.ts';
export * from './chat-client.ts';
export * from './model-provider.ts';
export * from './tool-registry.ts';
export * from './embedding.ts';
export * from './vision.ts';
export * from './reachability.ts';
export * from './mcp-transport.ts';
export * from './skill-loader.ts';
export * from './agent-loop.ts';
export * from './memory.ts';
