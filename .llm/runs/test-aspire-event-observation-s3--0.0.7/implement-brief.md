use harness

## SKILL

- `netscript-harness` — run dir, worklog/drift, RED→GREEN discipline, separate-session eval.
- `aspire` — Aspire resource lifecycle, `watchResourceUpdates` event semantics, fault-injection patterns.
- `netscript-tools` — scoped validation wrappers; `.llm/tools/validation/check-aspire-resource-polling.ts` guard; durable receipts via `.llm/tools/gates/run-gate.ts`.
- `netscript-doctrine` — `packages/cli` archetype gates before touching e2e application code.
- `netscript-pr` — PR body/labels/milestone; `Refs #1906` (partial; supervisor closes the epic).

# Implement brief — #1906 slice 3: fenced Bucket-A conversions, Bucket-C disposition, allowlist pinned

Branch `test/aspire-event-observation-s3` (from `main` `3149d18e1`), worktree `007-leaf-1906`.
Generator: Codex `gpt-5.6-sol` · high. Evaluator is a separate opposite-family session (not you).
Run dir: `.llm/runs/test-aspire-event-observation-s3--0.0.7/`. Contract = `gh issue view 1906` (body incl.
supervisor correction + scope expansion) and the merged slice-2 artifacts under
`.llm/runs/test-aspire-event-observation-s2--0.0.7/` (read `plan.md`, `drift.md`, `worklog.md`).

## What already landed (do not redo)
- #1909: shared observer `packages/cli/e2e/src/application/gates/scaffold/runtime/resource-state-stream.ts` (`watchResourceUpdates` → `waitFor(predicate, ceilingMs)` / `close()`). Consume it; never write a second observer.
- #1969 (merged 02c9cf648): non-fenced Bucket A converted; regrowth guard
  `.llm/tools/validation/check-aspire-resource-polling.ts` with `ASPIRE_RESOURCE_POLL_ALLOWLIST` (six fenced files).
- #1959 (merged): listener-readiness diagnostics. The concurrency fence on the six allowlisted files is now CLEAR — no open PR touches them.

## Slices
- **S1 — RED**: (a) shrink `ASPIRE_RESOURCE_POLL_ALLOWLIST` to `[]` and record the guard's findings on the pinned base as the RED receipt (expect the fenced files that actually poll); (b) add a test that pins the allowlist as an exact set snapshot so it can only shrink by an explicit test edit (the #1969 IMPL-EVAL MINOR).
- **S2 — fenced Bucket A GREEN**: convert every remaining resource-state poll in
  `runtime/listener-readiness-gates.ts`, `runtime/listener-unreachable-fixture.ts` (D-101: both health directions via one buffered subscription established BEFORE the fault is induced; no `REPORT_DEADLINE_MS`/`REPORT_POLL_MS` resource-state constants remain), `runtime/readiness-disagreement.ts`, `runtime/owned-container-log.ts`, `runtime/verify-listener-readiness.ts`, `scaffold/verify-live-db-endpoint.ts`.
  Rules per site: observe through the shared follower or a native blocking `aspire wait` used only for coarse first arrival; any snapshot is read once AFTER the observed event; failure text must distinguish "Aspire did not observe the transition" from "observed but wrong value"; remaining numeric constants are documented failure ceilings and none may be shortened (cite hosted distributions from slice-2 worklog or run logs). A file that turns out NOT to poll resource state gets an explicit worklog + PR-body justification and is removed from the allowlist anyway. Unit tests with fake subscriptions for every converted helper (mirror the slice-2 test style).
- **S3 — Bucket C disposition**: for `http-gate.ts`, `consume-flow-b-stream.ts`, `select-flow-b-stream-change.ts`, `probe-app-home.ts`, `probe-project-boundary-dev.ts`, `durable-cli-parity.ts`, `run-documented-stream-example.ts`, `ui-ai-gates.ts`: decide per site — convert if the retry loop stands in for resource readiness; otherwise record "legitimately timing-based" with the reason in a `bucket-c-disposition.md` under the run dir and summarize in the PR body. Where a site is HTTP-effect-only, add a one-line doc comment on its constant saying so (as slice 2 did).
- **S4 — evidence**: focused tests, guard test (allowlist now `[]` or the honest residue with reasons), `deno task quality:gate`, e2e check/lint/fmt wrappers for `packages/cli/e2e`, `deno task e2e:cli suites`. No local runtime lease: hosted `ci:full` tiers are the runtime proof. Record receipts under `receipts/`.

## Ceiling
`packages/cli/e2e/**`, `.llm/tools/validation/check-aspire-resource-polling*.ts`, run artifacts. No generated AppHost template changes, no `packages/cli/src/**`, no root config/lock edits.

## PR
Non-draft once S1+S2 are pushed. Title `test(e2e): observe fenced Aspire resource transitions and dispose Bucket C`. Body: `Refs #1906` — and state explicitly whether every DoD item of #1906 is now met; if yes, say so and the supervisor will decide on the closing keyword (do not add one yourself). Labels
`type:test area:cli area:aspire gate:e2e priority:p1 orchestrator:fixes status:impl ci:full`, milestone `0.0.7`. Keep `worklog.md` current after every slice; end with the final head and PR number.
