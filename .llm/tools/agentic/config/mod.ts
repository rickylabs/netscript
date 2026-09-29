/**
 * Transitional config barrel for the local agentic suite. Harness owns fleet
 * model IDs and routing bindings; this module re-exports that pinned catalog
 * alongside local provider settings.
 *
 * Concern → module:
 *  - models    → pinned Harness routing IDs + local provider presets
 *  - versions  → `config/versions.ts`
 *  - endpoints → `config/endpoints.ts`
 */
export * from './models.ts';
export * from './versions.ts';
export * from './endpoints.ts';
export * from './codex-failure-patterns.ts';
export * from './subscriptions.ts';
