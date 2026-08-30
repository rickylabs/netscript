use harness

## SKILL

- netscript-harness — evaluator protocol (`.llm/harness/evaluator/protocol.md`, `verdict-definitions.md`); you are the **independent IMPL-EVAL** for Codex-authored work; you never continue implementation and never self-certify anything.
- netscript-tools — scoped wrappers, gate receipts (`.llm/tools/gates/run-gate.ts`), raw git verification.
- netscript-pr — PR/labels/closing-keyword rules.
- aspire — Aspire CLI facts; **do not** start an AppHost or upgrade/install the host Aspire CLI (no runtime lease).

## Context

Formal IMPL-EVAL for **S3 of the Aspire 13.5 epic (phase A)** — issue #1715, draft PR #1741, epic #1712.
Route: Claude · Anthropic · Fable 5 · medium (native opposite-family evaluator of Codex · GPT-5.6 Sol work), per `.llm/harness/workflow/lane-policy.md`.

- Evaluate **exactly** head `a964a2120` on branch `test/aspire-13-5-s3-fixture-recapture` (base `origin/main` `13878a80a`). Your worktree: `<EVAL_WORKTREE>` (detached at that head; read-only for product files).
- Generator run dir (in the tree): `.llm/runs/test-aspire-13-5-s3-fixture-recapture--impl/` (`supervisor.md`, `worklog.md` incl. Design + gate tables, `context-pack.md`, `drift.md`, `receipts/parity-phase1-{red,green}.json`).
- Contract of record: issue #1715 (fixture re-capture beside kept 13.4.6 compat cases); locked decision D-13 (parity phase 2 over `compat-fixture` manifest rows). **Phase A only**: the dashboard telemetry envelopes were NOT in S2's receipts and are deferred to a lease-backed phase B — do not fail the slice for their absence; fail it if any 13.5.3 telemetry envelope was fabricated or hand-edited in `.llm/runs/research-aspire-13.5-adoption--0.0.7/plan.md` on `origin/research/aspire-13.5-0.0.7` (`git show origin/research/aspire-13.5-0.0.7:.llm/runs/research-aspire-13.5-adoption--0.0.7/plan.md`).
- Supervisor Tier-A notes: `git show origin/research/aspire-13.5-0.0.7:.llm/runs/research-aspire-13.5-adoption--0.0.7/slices/s3/review-tier-a.md`.
- S2 receipts referenced by S3: `origin/test/aspire-13-5-s2-runtime-verification` `.llm/runs/test-aspire-13-5-s2-runtime-verification--impl/receipts/02-v5-aspire-ps-final.json`, `02-v5-aspire-describe-final.json`, `02-v5-shape-comparison.md` — verify the 13.5.3 fixtures are byte-derived from these (key sets, `sdkVersion`, `logFilePath`) with only the documented redaction/normalisation.
- Known baseline (not S3's): `packages/fresh/src/application/query/hydration.ts` TS2345 on `origin/main` (#1734 / PR #1736) fails generated-project `deno task check`; classify it explicitly if any CI gate is red for that reason.

## What to verify (run the gates yourself; verdicts from executed evidence, not the generator's claims)

1. Design checkpoint exists and commit slices match it (parity RED → `aspire ps` fixture → describe/banner cases → telemetry README/deferral → gates + #413 draft).
2. Parity test `.llm/tools/validation/check-compat-fixtures_test.ts`: covers every `compat-fixture` row of `aspire-surface-manifest.tsv` (research branch); RED receipt on base (`receipts/01-parity-red.json`), green at head; telemetry row `pending-lease` and the test goes RED if a phase-B file lands without promotion.
3. Fixture provenance: `aspire-ps-13.5.3.json` and the 13.5.3 `describe` shape match S2's receipts modulo the README-documented normalisation; every fixture folder README states capture command, date (2026-08-29), CLI 13.5.3, receipt path; no `*13.4.6*` file deleted or modified.
4. Every compat case keeps 13.4.6 beside 13.5.3 (`probes_test.ts`, `service-env-evidence_test.ts`, `generated-app-endpoint_test.ts`, `service-endpoint-source-fixtures.ts`, `telemetry-live-fixture_test.ts`); no adapter behaviour change (`packages/telemetry` untouched unless a diff forced it — then a separate commit with test).
5. No fabricated 13.5.3 telemetry envelope anywhere; `packages/mcp/tests/fixtures/telemetry/README.md` states the deferral and the exact phase-B capture procedure.
6. Gates you run: configured `deno task lint`, scoped wrappers on `packages/mcp`, `packages/telemetry`, `.llm/tools/agentic/teardown`, `packages/cli/e2e`, `quality:scan`, `arch:check`, `check:mcp-export-corpus`, unit tests for those roots; no new `deno-lint-ignore`/`as unknown as`/`any`.
7. Draft PR body `Closes #1715` / `Part of #1712`, phase-B stated, labels/milestone, per-commit comments, explicit-refspec pushes; boundaries respected (no runtime, no capture, no pins, no `packages/fresh`, no skills/docs).
8. Verdict semantics: `PASS` means phase A is complete and correct and the PR may stay draft awaiting phase B; do not require phase B for `PASS`.

## Output

Write `evaluate.md` from `.llm/harness/templates/evaluate.md` into the generator run dir path **on the supervisor's research worktree** by absolute path: `/home/codex/repos/netscript-007-aspire-13-5-research/.llm/runs/research-aspire-13.5-adoption--0.0.7/slices/s3/evaluate.md` (declare the exact evaluated head in the file), and post the same verdict as a PR #1741 comment starting with `**[PHASE: IMPL-EVAL]**` and the head SHA. Verdict ∈ `PASS` / `FAIL_FIX` / `FAIL_RESCOPE` / `FAIL_DEBT`. Do not commit to the S3 branch, do not mark the PR ready, do not merge.
