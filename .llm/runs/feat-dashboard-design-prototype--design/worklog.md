# Worklog: Dev Dashboard E2E Claude Design prototype + design-sync system

## Run Metadata

| Field          | Value                                     |
| -------------- | ----------------------------------------- |
| Run ID         | `feat-dashboard-design-prototype--design` |
| Branch         | `feat/dashboard-design-prototype`         |
| Archetype      | N/A (repo tooling + design artifacts)     |
| Scope overlays | none                                      |

## Design

### Public Surface

- `deno task design:sync` — root task delegating to `tools/design-sync/mod.ts` (build | check |
  clean subcommands).
- `tools/design-sync/mod.ts` — CLI entry: reads `resources/design/dashboard/.design-sync/config.json`,
  emits the synthetic package bundle to a gitignored scratch dir, prints a parity + trap-check
  report.
- `resources/design/dashboard/` — the design artifact set (brief, proposed components, sync-back
  spec, shots, decisions).

### Domain Vocabulary

- `SyncConfig` — parsed `config.json` (projectId, pkg, globalName, srcMap, cssEntry, readmeHeader).
- `RegistryUnit` — one manifest item (kind: component | block | island | lib | support | style |
  theme) joined with its embedded source from `registry.generated.ts`.
- `ConversionResult` — per-unit outcome: emitted React source, skipped-with-reason, or shimmed
  (islands).
- `ParityReport` — manifest units vs emitted exports vs preview cards; the fitness-gate artifact.
- `TrapCheck` — one of the six encoded eis-chat traps (theme-default, token-closure, compiled-css,
  weak-dts, render-blank, raw-hex) with PASS/FAIL + evidence.

### Ports

- `RegistrySource` — reads fresh-ui's manifest + generated source (seam so the tool later works
  against any NetScript app's copied registry — the CLI-promotion path).
- `ClosureBuilder` — produces the compiled Tailwind CSS closure from a Fresh build (default:
  `apps/dashboard`); seam for the kitchen-sink fallback (OQ-4).

### Constants

- `TRAP_IDS` — `theme-default | token-closure | compiled-css | weak-dts | render-blank | raw-hex`.
- `UNIT_KINDS` — mirrors `registry.schema.ts` kinds; imported (type-only) not restated.
- `PARITY_EXCLUSIONS` — units excluded from the canvas parity set with reasons (e.g. `chat-render`
  parser internals; `f-client-nav` behavior noted inert).

### Commit Slices

| # | Slice | Gate | Files |
| - | ----- | ---- | ----- |
| 0 | Canvas pre-flight: MCP connect + round-trip smoke | manual: create/read scratch design; evidence in worklog | run dir only |
| 1 | design-sync v1: converter + closure + conventions + previews + trap checks + idempotence | wrappers (check/lint/fmt) + `design:sync --check` self-test | `tools/design-sync/**`, root `deno.json` task, `.gitignore` scratch entry |
| 2 | Dashboard design brief + proposed components distilled from seed corpus | supervisor review vs proposal §IA + voice rules | `resources/design/dashboard/{CLAUDE-DESIGN-BRIEF.md,PROPOSED-COMPONENTS.md}` |
| 3 | New Claude Design project seeded (design system + brief imported) | ParityReport green; canvas renders seeded system | `.design-sync/config.json` (+ run-dir evidence) |
| 4 | Prototype pass 1: shell + Stack Map + Flow/Trace Waterfall + Service Catalog/API Explorer + Run Inspector ×light/dark | shot-vs-IA review + owner steering; DDX-0 promote-set verdict | `resources/design/dashboard/prototype-shots/`, `DECISIONS.md` |
| 5 | Re-sync checkpoint: pass-1 components fed back; idempotence + trap checks re-run | `design:sync --check` green on updated inputs | sync-back deltas + run dir |
| 6 | Prototype pass 2: Plugin Control, Logs, Resource Control + workers/sagas/triggers/streams sections | shot-vs-IA review + owner steering | shots + `DECISIONS.md` |
| 7 | Sync-back spec + final shots + board comments (#400/#425) + handoff notes | IMPL-EVAL (separate session) | `resources/design/dashboard/NS-ONE-ADDITIONS.md`, run dir |

### Deferred Scope

- fresh-ui implementation of prototyped components — downstream WSL Codex lanes (DDX-0 amendment +
  new issues from the sync-back spec).
- `netscript ui:design-sync` CLI productization — separate framework issue.
- `plugins/dashboard/.design-sync/` placement — migrates when DDX-2/4 create the plugin.
- AI/chat collection parity on the canvas — not needed for dashboard surfaces.

### Contributor Path

A developer re-syncing after registry changes runs `deno task design:sync`, reads the printed
ParityReport + TrapCheck table, and re-imports the bundle into the Claude Design project (or lets
the MCP lane do it). To add a new prototyped component to source, they read one sync-back spec
entry (class contract + props + CSS) and implement it in fresh-ui following an existing registry
unit of the same kind.

## Progress Log

| Time | Slice | Step | Notes |
| ---- | ----- | ---- | ----- |
| 2026-07-06 | — | Bootstrap | Worktree `.llm/tmp/design-proto-wt` @ `317e4b50`; run dir scaffolded; four-lane research complete (see research.md) |

## Decisions

| Decision | Reason | Source |
| -------- | ------ | ------ |
| LD-1…LD-7 | see plan.md § Locked Decisions | owner (session 2026-07-06) + research |

## Drift

| Drift | Severity | Logged in drift.md |
| ----- | -------- | ------------------ |
| DDX-0↔DDX-15 dependency inversion | significant | yes |
| #425 superseded-in-execution | significant | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| ---- | ---------------- | ------ | ----- |
| check/lint/fmt (tools) | scoped wrappers | NOT_RUN | after slice 1 |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| Sync idempotence | NOT_RUN | — | slice 1/5 |
| Parity checklist | NOT_RUN | — | slice 3 |
| Trap checks a–f | NOT_RUN | — | slice 1/5 |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| Canvas connectivity smoke (read half) | **PASS** 2026-07-06 | `DesignSync list_projects` returned the writable set: 1 project, the stale `eis-chat — NS One` (`ea3fa1b9-906c-4b8a-8ef7-421b460e5c15`), after owner ran `claude mcp add claude-design …` + `/design-login` | OQ-1 resolved GREEN — via a better mechanism than planned: Claude Code's **native `DesignSync` tool** (localPath disk uploads that bypass model context, plan-boundary enforcement, claude.ai-login auth) rather than the raw MCP. Write half (`create_project` + round-trip) runs in slice 0 proper, after PLAN-EVAL PASS |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| -------- | ------ | -------- | ----- |
| N/A | — | — | no package surface changes |

## Handoff Notes

- Evaluator: start with plan.md § Locked Decisions + research.md findings F4–F11, then the
  ParityReport/TrapCheck evidence, then DECISIONS.md vs the ratified proposal IA.
