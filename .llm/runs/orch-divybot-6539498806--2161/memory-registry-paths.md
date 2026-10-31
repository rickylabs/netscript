# Registry selection memory

Generators live in plugins/triggers/src/cli/generate-runtime-registries.ts, plugins/workers/src/cli/runtime-registry-generator.ts and plugins/sagas/src/cli/registry-generator.ts. Host protocol-2 validation is packages/cli/src/public/features/generate/plugins/plugin-registry-renderer.ts. Doctor selection flows through installed-runtime-registry-generator.ts into runtime-registry-drift.ts. Worker scans include schedules and pluginDirs as well as local jobs.

Standalone commands have separate selectors: workers/src/cli/registry-compiler.ts, triggers/src/cli/trigger-registry-compiler.ts. AI uses ai-registry-compiler.ts with AST shape selection; directive must apply before AST selection for excluded factory visibility.
