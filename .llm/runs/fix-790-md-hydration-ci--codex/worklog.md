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
| 2026-07-17 | S1 | regression red | The focused Signals resolver test failed with `Expected Signals to resolve` on unchanged framework code. |
| 2026-07-17 | S1 | owning-layer fix | Canonicalized bare/versioned Signals imports through the app import map, added Signals dedupe, retained delegated metadata, and documented the policy. |
| 2026-07-17 | S1 | actionable diagnostics | Markdown build failures now report exit code, command, labeled stdout, and labeled stderr. |
| 2026-07-17 | S1 | clean-cache proof | A brand-new isolated `DENO_DIR` production-built the generated Fresh Markdown island: 1 passed, 0 failed. |
| 2026-07-17 | S1 | focused/package gates | Vite 10/10, Markdown 2/2, and Fresh package 200/200 passed. |
| 2026-07-17 | S1 | static/fitness gates | Root check and touched-root check/lint/fmt passed; scoped quality and architecture passed; publish dry-run passed; existing external quality/doc findings were attributed. |

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
| Repository quality/doc gates contain untouched baseline findings | minor | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| ---- | ---------------- | ------ | ----- |
| Root scoped check | `deno task check` | PASS | 2,304 files, 20 batches, zero findings. |
| Fresh check | scoped wrapper, `packages/fresh` | PASS | 164 files, 2 batches, zero findings. |
| Fresh UI check | scoped wrapper, `packages/fresh-ui` | PASS | 131 files, 2 batches, zero findings. |
| Touched-root lint | scoped wrappers | PASS | 164 + 131 files, zero findings. |
| Touched-root format | scoped wrappers | PASS | 164 + 131 files, zero findings after one mechanical wrap. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| F-3 architecture | PASS | `deno task arch:check` exit 0 | Existing warnings only; no failure. |
| F-5/F-6 public surface | PASS with baseline doc residue | doc-lint + publish dry-run | `./vite` has 0 doc findings; all 25 findings are in untouched route contract types; publish dry-run passed. |
| F-10 semantic test shape | PASS | resolver + generated consumer tests | No snapshot/skip; actual build and bundle asserted. |
| F-19 scoped runners | PASS | touched-root wrapper evidence | Check/lint/fmt all clean. |
| Code quality | PASS scoped / FAIL_BASELINE repository | scoped scan + `quality:gate` | Changed Vite root has 0 findings/allowances. Repository scan still reports only `plugins/streams/services/src/proxy.ts:180` and `plugins/triggers/streams/producer.ts:34`. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| CI job reproduction | FAIL_EXPECTED | job `87754952044` | Rollup cannot resolve versioned Signals import. |
| Isolated-cache local reproduction | FAIL_EXPECTED | focused test with `.llm/tmp/deno-cache-md-ci` | Exact CI error reproduced. |
| Signals resolver | PASS | focused Vite suite | 10 passed; bare/`npm:`/`npm:/`, regex boundary, metadata, `skipSelf`, and merged dedupe covered. |
| Isolated-cache production build | PASS | focused test with `.llm/tmp/deno-cache-md-ci-fixed` | 1 passed, 0 failed from a brand-new cache. |
| Markdown renderer suite | PASS | focused test file | 2 passed, 0 failed. |
| Fresh package suite | PASS | package test task | 200 passed, 0 failed. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| -------- | ------ | -------- | ----- |
| Generated Fresh Markdown app (baseline) | FAIL_EXPECTED | isolated-cache production build | Established the owning-layer defect before implementation. |
| Generated Fresh Markdown app (fixed) | PASS | isolated-cache production build | Client/server production bundle emitted without cache prewarming. |
| Draft PR check-test | PENDING | PR #797 | Terminal acceptance gate after S1 push. |

## Handoff Notes

- Review the exact Signals regex boundary, canonical bare import, `skipSelf`, metadata preservation,
  merged dedupe behavior, isolated-cache evidence, and explicit stdout/stderr assertion first.
