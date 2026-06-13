# Drift — 5d6-query

Append-only. Reality vs RFC/doctrine/plan divergences.

## D-5d6-1 — Prior run produced no research/design/plan artifacts

- Trace `.llm/tmp/run/openhands/pr-39/run-27442118991-1/` hit the 500-iteration limit.
- Only skeleton files (`drift.md`, `commits.md`, `worklog.md`) were created; `research.md`, `design.md`, `plan.md`, `context-pack.md` were NOT written.
- Impact: this run must rebuild research from scratch, reusing only the distilled findings in the prior summary as a starting baseline.
- Status: noted; superseded by this run's deliverables.

## D-5d6-2 - `deno publish --dry-run` is blocked by workspace `exclude`, not slow types

- Measurement: package-local `deno publish --dry-run` from `packages/fresh/` reports 58 `excluded-module` errors.
- Root cause: root `deno.json` workspace `exclude` includes `"packages/fresh/"`, which overrides package `publish.include`.
- Doctrine expectation: publish gates should run clean before a wave closes.
- Mitigation: final 5d6 closeout slice must lift the workspace exclusion (mirroring 5b SDK / fresh-ui precedent) and run a one-time root fmt/lint/check pass.
- Status: design/plan blocker tracked; implementation deferred pending supervisor review.

## D-5d6-3 - `./query/hooks.ts` convenience re-exports conflict with JSR doc-lint

- Measurement: 49 of 64 `./query` `privateTypeRef` errors come from direct re-export of `@tanstack/preact-query` / `@tanstack/react-db` hooks.
- Doctrine expectation: public exports must not leak dependency private types (JSR `privateTypeRef`).
- Options: (A) wrap hooks with package-owned return types, (B) export only `queryOptions` / `mutationOptions` builders, (C) keep convenience re-exports and accept doc-lint failure.
- Status: decision required from supervisor before design/plan finalization.

## D-5d6-4 - `getIslandQueryClient()` is client-only; no per-request server QueryClient exists

- Observation: `query-client.ts` file comment warns against SSR use; there is no server-side factory tied to Fresh request context.
- RFC 17 target dehydrated-state bridge requires a per-request server `QueryClient` for prefetch + dehydrate without cross-request leakage.
- Status: design input; implementation deferred pending review.

## D-5d6-5 - `defineFreshApp` hard-codes Fresh `App` construction and static/fs routes

- Observation: `server/define-fresh-app.ts` calls `new App<State>()` and `staticFiles()` / `fsRoutes()` directly.
- RFC 14 unified adapter will need to swap these without breaking the public `DefineFreshAppOptions` contract.
- Mitigation: design adds optional adapter seams (`createApp`, `staticFiles`, `fsRoutes`, `preConfigure`, `telemetry`).
- Status: documented as alpha-surface protection; implementation deferred pending review.

## D-5d6-6 - `./server/sse.ts` is 408 LOC but not in the public server barrel

- Observation: `server.ts` does not re-export SSE helpers; they are internal-only today.
- Final surface pass must decide whether SSE belongs in `@netscript/fresh/server` or remains internal.
- Status: question raised for supervisor.

## D-5d6-7 — PLAN-phase design.md and plan.md written (this run)

- Trace: `openhands/pr-39/run-27467331167-1`.
- Deliverables created: `design.md`, `plan.md`.
- Decisions recorded: RFC 17 bridge via `initialData` + optional dehydration script, hook wrappers to retire upstream `privateTypeRef`, `defineFreshApp` alpha-surface seams, F-16 entrypoint lock, wave closeout lift of root workspace exclusion.
- Open questions: six supervisor questions in `design.md` §5.
- Status: READY FOR PLAN-EVAL; implementation deferred pending supervisor review.
