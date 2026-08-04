# Plan — #1247 editor-aware agent init

## Shape

- Archetype 6 CLI/tooling; no package public API expansion.
- Contract first: shared editor choices enter `InitAgentInput`, then command parsing, resolution,
  config adapters, tests, and docs.
- Reuse `generateEditorConfigFiles`; add only the editor-native MCP merge policy at the agent edge.

## Slices

1. Bootstrap and draft PR.
2. Add RED command and use-case tests for `none`, `zed`, `vscode`, detection, ambiguity, and merge
   preservation.
3. Implement editor application and native MCP configuration.
4. Update CLI/docs supported-target tables and unsupported-editor remediation.
5. Run focused tests, CLI package task, scoped static/fitness/doc/publish gates, then post evidence.

## Evaluation

Milestone ruling D6 composes evaluation; no local PLAN-EVAL session is spawned. The orchestrator
owns the expensive scaffold runtime and merge gate.
