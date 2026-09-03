use harness

## SKILL

- `netscript-harness` — run dir, worklog/drift, RED→GREEN discipline, separate-session eval.
- `aspire` — Aspire 13.5 SDK event/notification surface (`notifications()`, `onResourceReady`, `onResourceEndpointsAllocated`, …); never poll `aspire describe` on a hand-rolled deadline.
- `netscript-tools` — scoped validation wrappers; durable receipts via `.llm/tools/gates/run-gate.ts`.
- `netscript-pr` — PR body/labels/milestone; `Refs #1906` (partial) unless every DoD box is evidenced.

# Implement brief — #1906 slice 2: convert remaining Bucket-A polls to Aspire event observation + regrowth guard

Branch `test/aspire-event-observation-s2` (from `main` `79adb103b`), worktree `007-leaf-1906`.
Generator: Codex `gpt-5.6-sol` · medium. Evaluator is a separate opposite-family session (not you).
Run dir: `.llm/runs/test-aspire-event-observation-s2--0.0.7/`. Read `gh issue view 1906` first — the
issue body (with its supervisor correction and scope expansion) is the contract.

## What already landed (do not redo)

- #1858: `listener-unreachable-fixture.ts` interim blocking wait.
- #1909 (`308d99c78`): D-101 transitions observed through the Aspire follow stream — the shared
  observer is `packages/cli/e2e/src/application/gates/scaffold/runtime/resource-state-stream.ts`.
  Consume it; do not write a second observer.
- #1957/#1962: typed-db Phase-B observer and live-db endpoint resolution.

## Concurrency fences (hard ceiling exclusions)

These files are owned by in-flight PRs; do NOT modify them in this slice:
`runtime/listener-readiness-gates.ts`, `runtime/listener-unreachable-fixture.ts`,
`runtime/readiness-disagreement.ts`, `runtime/owned-container-log.ts`,
`runtime/verify-listener-readiness.ts`, `scaffold/verify-live-db-endpoint.ts`, and anything under
`packages/cli/src/kernel/templates/aspire/**`. If a conversion genuinely requires one of them, stop,
record it in `drift.md`, and leave it for a later slice.

## Slices (RED before GREEN, one commit each)

- **S1 — inventory + guard RED**: a focused test (or lint rule under `.llm/tools/` / the e2e unit
  suite) that scans `packages/cli/e2e/src/**` for hand-rolled `aspire describe` polling loops with
  their own deadline and FAILS today, listing each offender. Output in the worklog. This is the
  regrowth guard from the DoD; it must have an explicit allowlist that shrinks as conversions land.
- **S2 — conversions (Bucket A, in-scope files only)**: `scaffold/verify-endpoint-readiness.ts`,
  `scaffold/verify-producer-reconnect.ts` (`PROBE_TIMEOUT_MS = 90_000`),
  `scaffold/wait-for-workers-runtime.ts` (log-marker scraping), `scaffold/service-env/verify-service-env.ts`
  (`HEALTHY_TIMEOUT_SECONDS = 180`), `scaffold/generated-app-endpoint.ts`,
  `runtime/probe-plugin-resource.ts`, `runtime/capture-db-endpoint-allocation.ts`,
  `scaffold/runtime-gates.ts` (`KV_BACKGROUND_RUNTIME_WAIT_TIMEOUT_SECONDS`), `quickstart/aspire-walk.ts`.
  For each: either convert to the event/notification surface (via the shared observer or a native
  blocking wait; read any snapshot once *after* the wait settles; failure text must distinguish
  "Aspire did not observe the transition" from "observed but wrong value"), or record an explicit
  justification in the worklog + PR body that it is not an Aspire-resource assertion (HTTP probes
  against app endpoints are out of scope per the issue). Unit tests for every converted helper.
- **S3 — cap audit**: for every remaining blocking-wait cap in the in-scope files, cite an observed
  healthy-time distribution (hosted run logs are acceptable evidence) in the worklog; do not shorten
  any cap without that evidence. Guard allowlist shrinks to the fenced files only.

## Ceiling

`packages/cli/e2e/**` (excluding the fenced files), `.llm/tools/**` only for the guard, and the run
dir. No `packages/cli/src`, no `deno.json`/lock/catalog, no `.github/`. Never run the hosted
scaffold-runtime suite locally (no runtime lease) — unit tests against fakes only; hosted proof comes
from CI at the PR head.

## Local gates before each push

- `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli/e2e --ext ts,tsx`
- `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all packages/cli/e2e/tests`
- `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/cli/e2e --ext ts,tsx`
- `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/cli/e2e --ext ts,tsx`
- `deno task e2e:cli suites` (registry sanity) and `deno task quality:gate`

## PR

Non-draft as soon as S1+S2 are pushed so hosted tiers run. Body: `Refs #1906` (partial — Bucket A
fenced files and Bucket B/C remain), labels
`type:test area:cli area:aspire gate:e2e priority:p1 orchestrator:fixes status:impl ci:full`,
milestone `0.0.7`. Keep `worklog.md` current after every slice; end with the final head and PR number.
