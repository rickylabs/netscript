# Worklog: issue #802 plugin CLI usage truthfulness

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `beta11-cli--orchestrator/slices/g10-802-help` |
| Branch | `fix/802-plugin-cli-help` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | `none` |

## Design

### Public Surface

- Existing `WorkersCliCommandDefinition.usage`, `SagasCliCommandDefinition.usage`, and
  `TriggersCliCommandDefinition.usage` string metadata; no new exports or commands.

### Domain Vocabulary

- `usage` — complete runnable command synopsis returned in command metadata.
- `invocation prefix` — version-pinned JSR executable form preceding the verb and arguments.

### Ports

- None. This is immutable command metadata and needs no external dependency or new test seam.

### Constants

- No new runtime constants. Each plugin's exact expected prefix is test-local finite evidence; a
  shared production constant would create an unnecessary public/internal abstraction for three literals.

### Commit Slices

| # | Slice | Gate | Files |
| - | ----- | ---- | ----- |
| 1 | Make all affected sibling usage strings directly runnable and assert every definition. | touched/full plugin tests + scoped wrappers + quality/architecture gates | workers/sagas/triggers command and test files; this run dir |

### Deferred Scope

- Streams usage metadata — no affected pattern exists.
- Alias installation and docs prose — separately owned alternatives/scope.

### Contributor Path

Add or edit a command beside its siblings in the plugin's `src/cli/commands.ts` (or triggers
`management-commands.ts`) and extend the exhaustive CLI metadata assertion so the package-specific
`deno x` prefix remains true.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-07-18 | plan | research | Read live #802; audited all four sibling CLI source/test surfaces. |
| 2026-07-18 | plan | decision | Selected option (b) for consistency with direct executable forms already printed/documented in sibling CLI code. |
| 2026-07-18 | plan-eval | hard stop | Awaiting separate-session supervisor PLAN-EVAL before implementation. |

## Gate Results

All implementation gates are `NOT_RUN` until PLAN-EVAL is `PASS`.

## Handoff Notes

- Review the locked option-(b) rationale first, then the exhaustive single-slice test design.

