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

## D-5d6-8 - Post-5d5 supervisor baseline retired the root-exclusion/dry-run blocker

- Original plan fact: root `deno.json` excluded `packages/fresh/`, causing package-local `deno publish --dry-run` to fail with excluded-module errors.
- Current measurement after supervisor sync: root `deno.json` `exclude` is only `.llm/tmp/`, and `(cd packages/fresh && deno task dry-run)` passes.
- Impact: planned Slice 18 (JSR dry-run unblocked) is already materially retired by the merged 5d1-5d5 baseline. Final closeout still needs a regression dry-run, but no source/config unblock is required in 5d6 implementation unless later slices regress it.
- Status: recorded as Slice 1 rebaseline evidence.

## D-5d6-9 - RTK unavailable in this WSL session

- Expected tool state: repo instructions prefer `rtk` for read-heavy git/grep/ls and `rtk proxy` for `deno task`.
- Current measurement: `command -v rtk` fails and `~/.local/bin/rtk` does not exist.
- Impact: rebaseline commands were run raw, increasing output volume only. Gate semantics and exit codes are unaffected.
- Status: use raw commands until RTK becomes available; do not block implementation on output filtering.

## D-5d6-10 - Query doc-lint required combining planned query type and hook-wrapper slices

- Original plan: Slice 1 introduced query type aliases, Slice 2 rewrote hook wrappers, and Slice 3 handled query island/hydration explicit types.
- Current implementation fact: `deno doc --lint packages/fresh/query/mod.ts` remained red until the public hook wrappers, `QueryIslandProps`, `getIslandQueryClient`, and hydration signatures all stopped referencing upstream public types together.
- Impact: implementation Slice 2 combines the query public-type scaffold, hook wrappers, and query island/hydration public signature cleanup. No server/defer/form/builders scope was pulled into the slice.
- Status: accepted as minor sequencing drift; gate evidence is stronger because the whole `@netscript/fresh/query` subpath is doc-lint clean after the slice.

## D-5d6-11 - Whole-package doc-lint is clean much earlier than the original 30-slice plan

- Original plan: many cross-cluster private-type-ref/JSDoc slices were expected for builders, defer, form, streams, vite, root, and final whole-package doc-lint.
- Current measurement after merged 5d1-5d5 plus 5d6 Slices 2-4: `(cd packages/fresh && deno task doc-lint)` passes across all 13 approved entrypoints.
- Impact: several planned source slices are now retired or reduced to final regression checks. Remaining known package-quality work is fmt/lint cleanup, final root gate inclusion, over-cap/debt handling, and any specific consumer/runtime proof the supervisor still requires.
- Status: recorded in Slice 5 rebaseline.
