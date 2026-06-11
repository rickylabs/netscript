# Context pack — Sub-wave 5a: `@netscript/service`

## Current state

Implementation has started after PLAN-EVAL PASS. Slices 1-12/15 are complete:
`packages/service/deno.json` is standardized, and service sources now live under `src/` with only
path updates required by the move. `src/types.ts` now defines the package-owned structural mirror
types. Handler primitives now use those mirrors for plugins, fetch handlers, not-found handlers, and
error handlers. OpenAPI primitives now use `ServiceRouter`/`ServiceHandler` returns and named
Scalar/OpenAPI constants. Health primitives now return `ServiceHandler` and expose named
`HEALTH_STATUS` vocabulary. Builder is now an exported interface backed by internal
`ServiceBuilderImpl`, uses package-owned mirror types, and custom checks are renamed to
`withHealthCheck` / `withReadinessCheck`. `serve()` now returns `RunningService`, supports external
abort signals, and logs its banner/error path through `@netscript/logger`. Implementation commits:
`0785a8f`, `d9897c0`, `88e0cc0`, `b62dfbe`, `aabcde2`, `65c6512`, `ff9ca2d`, `58e7d1e`.
Database connectivity diagnostics are now internal under `src/diagnostics/`, logger-backed, and
`define-service.ts` is 143 lines. `defineService()` now returns `Promise<RunningService>` and uses
package-owned router/db context types. `mod.ts` is now a 130-line documented public contract and
still barrel-only. README is 234 lines with package docs scaffold under `docs/`. Next slice: doctest
runner and unit tests.

Known caveat: `deno check --unstable-kv packages/service/mod.ts` still exits 0 with `No matching
files found` because root `deno.json` excludes `packages/service/` until slice 15 (drift D-2). Do
not treat root-exclude lift as available before slice 15.

## What this session did

Wave 5 GENERATOR, RESEARCH + PLAN & DESIGN only. No implementation, no locked plan.
PLAN-EVAL (you, a separate session) must review `plan.md` against
`.llm/harness/gates/plan-gate.md` and either lock or bounce.

## Where things are

- Branch `feat/package-quality-wave5-apps-5a-service` @ forked from `09f4845`
  (umbrella tip; drift D-1). Worktree `.worktrees/wave5-apps-5a-service`.
- Run dir (this dir): `research.md`, `plan.md` (PROPOSED), `worklog.md` (incl.
  `## Design`), `drift.md` (3 entries), `measure-5a.json` (raw measure-first),
  `commits.md`.
- Umbrella run dir: `.llm/tmp/run/feat-package-quality-wave5-apps--umbrella/`
  (handover `fable5-handover.md`, re-baseline research.md §0.5, split-strategy.md).

## Baseline (verified locally, raw deno)

check PASS · doc-lint 23 (14 ptr / 8 ret / 1 jsdoc) · dry-run FAIL = 8 slow-types +
6 excluded-module (root deno.json exclude — drift D-2) · 0 tests · no README/docs.

## Plan in one paragraph

src/ restructure (1,643 LOC); builder exported as interface w/ internal impl;
all 14 ptr cleared via package-owned structural types (logger/telemetry precedent),
incl. `build(): ServiceApp` and `serve() → RunningService` with AbortSignal/stop
(A3 concept-of-done); `add…`→`with…` renames (zero consumers, no shims); `any`
returns → structural `FetchHandler`; diagnostics (~280 LOC) extracted to internal
`src/diagnostics/`; console.* → logger; scalar.min.js kept vendored+published (debt
entry); deno.json standardized; README+docs+tests from zero incl. doctest runner and
serve/stop integration test; final slice lifts `packages/service/` from root exclude
and runs the full sweep. 15 slices. Gate set A4 ∪ A3.

## Review hot-spots (where to push back)

1. **D-4 `ServiceApp`/`RunningService`** — exact member list deliberately deferred to
   impl start; is the bound tight enough?
2. **D-8 diagnostics through logger** — accepts a possible F-14 partial-debt outcome
   if multi-line rendering degrades; acceptable?
3. **D-9 3.3 MB vendored scalar asset in publish** — correctness-over-size at alpha.
4. **`LoggerMiddlewareOptions` sibling re-export kept** — argued F-15 targets
   third-party upstream, not `@netscript/*` siblings (open-decision sweep).
5. **D-13 `defineService → RunningService`** — return-type change on the most-used
   entrypoint (consumers ignore the value; verify census in research §5).

## Hard rules in force

No `deno cache --reload`; never delete locks/caches; targeted checks need
`--unstable-kv`; use `.llm/tools/run-deno-check.ts`; doc-lint verdict = combined over
entrypoints + full-barrel mod.ts run; raw deno via `Deno.Command`/direct binary for
verdict sources (rtk filtering); no `@netscript/ui-primitives`; no RFC 14 unified mode.
