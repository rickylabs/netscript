# Plan

## Scope and profile

Delete only Wave 1–2 candidates that have zero current importers. The touched surfaces use
Archetype 4 plus the frontend overlay (`fresh-ui`) and Archetype 5 (workers/sagas plugins).
Archetype 6 governs the reviewed CLI candidate retained under F-CLI-31. Current doctrine treats the
published surface as the product and favors deleting unjustified/orphan files without breaking
curated exports.

In-scope anti-patterns: AP-1 (stale accumulation), AP-16 (misleading/orphan structure), AP-22
(orphan barrels), and AP-25 (unreachable edge code). No new architecture debt is expected.

## Locked decisions

1. Delete only candidates with zero repo-wide importers or manifest/export-map consumers.
2. Treat tests, package manifests, Aspire contributions, and export maps as consumers.
3. Retain `packages/cli/src/kernel/extension-points.ts` because current doctrine requires it even
   though no module imports it directly.
4. Do not alter consumers to manufacture zero-importer status; that would exceed the mechanical
   stale-elimination contract.
5. Do not touch Waves 3–5, `deno.lock`, or orchestrator-owned E2E gates.

## Open-decision sweep

- Safe to defer: coordinated removal of currently imported/public Wave 2 SDK, workers, and Fresh UI
  APIs.
- Safe to defer: docs updates for retained candidates; docs lane carve-outs are out of scope.
- Must resolve now: none.

## Commit slices

1. Prove the re-baseline and deletion boundary: add harness artifacts containing importer evidence.
   Gate: clean baseline verification and review of exact searches. Files: this run directory.
2. Prove safe stale elimination: delete the three zero-importer files and run scoped check, lint,
   format, and targeted tests for Fresh UI, workers, and sagas. Files: the three candidates plus
   updated run evidence.

## Risk register

- Dynamic string references may evade import grep. Mitigation: search exact paths, filenames,
  selectors, manifests, docs, and package export maps, then run owning-root checks/tests.
- Removing health routers could hide runtime wiring. Mitigation: inspect service router assembly
  and run plugin checks/tests; neither router is assembled today.
- CSS could be loaded indirectly. Mitigation: search the full repo for the filename and selectors;
  the file has no stylesheet import or export.

## Gate set

- Scoped wrapper check/lint/fmt for each touched root.
- Targeted `deno check --unstable-kv` for owning entrypoints.
- Targeted package/plugin tests.
- Manual JSR export-map verification for the deleted files.
- Orchestrator-owned `e2e:cli`/`scaffold.runtime`: explicitly not run.

## Deferred scope

Waves 3–5, docs carve-outs, Prisma work, consumer/API rewrites for imported candidates, PR creation,
and orchestrator-owned E2E execution.

