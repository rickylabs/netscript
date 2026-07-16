# Worklog: generated Fresh Markdown clean-runner build

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `fix-790-md-hydration-ci--codex` |
| Branch | `fix/790-md-hydration-ci` |
| Archetype | `4 — Public DSL / Builder` |
| Scope overlays | `frontend` |

## Design

### Public Surface

- `createNetScriptVitePlugin(options?)` remains the only affected public entry point; its type and
  exports remain unchanged.
- Observable policy: generated Fresh apps resolve one app-owned Preact/Signals hydration runtime.

### Domain Vocabulary

- **Preact runtime import** — `preact` or `@preact/signals`, optionally expressed as a versioned
  `npm:`/`npm:/` specifier by an upstream JSR module.
- **App-owned Signals import** — the bare `@preact/signals` entry pinned in generated `deno.json`.
- **Delegated resolution** — Vite's ordinary resolver result with the NetScript plugin skipped.
- **Command failure detail** — command context plus independently labeled stdout and stderr.

### Ports

- Vite plugin context `this.resolve` is the existing upstream resolution seam; focused tests replace
  it with a deterministic fixture.

### Constants

- `PREACT_IMPORT_PATTERN` — existing Preact package matching policy.
- `PREACT_SIGNALS_IMPORT_PATTERN` — exact bare/versioned npm Signals matching policy.
- `PREACT_SIGNALS_IMPORT` — canonical bare generated-app import-map key.

### Commit Slices

| # | Slice | Gate | Files |
| - | ----- | ---- | ----- |
| S0 | Activate the harness and expose the plan on a draft PR | artifact review + clean git status | `.llm/runs/fix-790-md-hydration-ci--codex/**` |
| S1 | Make Fresh hydration runtime resolution deterministic and failures actionable | focused resolver + isolated-cache Markdown build + touched-root gates | `packages/fresh/src/application/vite/vite.ts`, `vite.test.ts`, `README.md`; `packages/fresh-ui/tests/registry/markdown-renderer.test.ts`; run evidence |

### Deferred Scope

- TanStack AI peer-version alignment — unrelated warning, not the Rollup failure.
- Browser re-automation — hydration remains covered by the production-build fixture and the
  previously green Playwright proof; this slice restores the CI build prerequisite rather than
  deleting or skipping it.
- Evaluator dispatch and merge — explicitly reserved to the owner/supervisor.

### Contributor Path

Open `packages/fresh/src/application/vite/vite.ts` for package identity policy, copy the adjacent
resolver fixture in `vite.test.ts` for another runtime import form, then use the generated Markdown
consumer test to prove a clean production bundle.

## Progress Log

| Time | Slice | Step | Notes |
| ---- | ----- | ---- | ----- |
| 2026-07-17 | S0 | CI evidence | Read GitHub job `87754952044` through `resolveGithubToken()` and identified the Rollup Signals resolution failure. |
| 2026-07-17 | S0 | constrained reproduction | Exact focused test failed under isolated `DENO_DIR` with the same unresolved import. |
| 2026-07-17 | S0 | design checkpoint | Locked owning-layer resolver/dedupe fix, explicit diagnostics, gates, and non-scope before source edits. |

## Decisions

| Decision | Reason | Source |
| -------- | ------ | ------ |
| Fix `@netscript/fresh/vite` | It owns generated Fresh dependency resolution and already normalizes Preact runtime identity. | CI log + source inspection |
| Retain the hydration build gate | It is the compensating runtime proof and caught a real clean-runner defect. | user constraint + frontend overlay |
| Do not change AI peer pins | The warning precedes but does not cause Rollup failure. | full GitHub job log |

## Drift

| Drift | Severity | Logged in drift.md |
| ----- | -------- | ------------------ |
| Evaluator dispatch is supervisor-owned | significant | yes |
| Warm native-WSL cache masked the clean-runner failure | significant | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| ---- | ---------------- | ------ | ----- |
| Scoped check/lint/fmt | planned | NOT_RUN | Run after S1. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| F-3/F-5/F-10/F-19 | NOT_RUN | planned gates | No public signature change planned. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| CI job reproduction | FAIL_EXPECTED | job `87754952044` | Rollup cannot resolve versioned Signals import. |
| Isolated-cache local reproduction | FAIL_EXPECTED | focused test with `.llm/tmp/deno-cache-md-ci` | Exact CI error reproduced. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| -------- | ------ | -------- | ----- |
| Generated Fresh Markdown app | FAIL_EXPECTED | isolated-cache production build | Establishes the owning-layer defect before implementation. |

## Handoff Notes

- Review the exact Signals regex boundary, canonical bare import, `skipSelf`, metadata preservation,
  merged dedupe behavior, isolated-cache evidence, and explicit stdout/stderr assertion first.

