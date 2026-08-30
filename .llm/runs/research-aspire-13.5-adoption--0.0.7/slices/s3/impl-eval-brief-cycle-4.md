use harness

## SKILL

- netscript-harness — evaluator protocol (`.llm/harness/evaluator/protocol.md`,
  `verdict-definitions.md`); you are the **independent IMPL-EVAL** for Codex-authored work; you
  never continue implementation and never self-certify anything.
- netscript-tools — scoped wrappers, gate receipts, raw git verification.
- netscript-pr — PR/labels/closing-keyword rules.
- aspire — Aspire CLI facts; **do not** start an AppHost, start containers, or touch any
  `relay-*` container / `loopback-relay.ts` process (another slice's runtime lease is active on
  this host; everything Docker/Aspire is read-only for you).

## Context

This is **IMPL-EVAL cycle 4 — S3 Phase B (delta re-eval after cycle-3 FAIL_FIX)** (lease-backed telemetry capture). Phase A passed at
cycle 2 (`slices/s3/evaluate-cycle-2.md`, head `fe4f496bd`). Phase B attempts 1–2 were
environment-blocked (D-42/D-43); attempt 3 ran under the supervisor's owner-scoped loopback relay
(D-74) and completed the capture. Supervisor Tier-A: `slices/s3/review-tier-a-phase-b.md` (PASS).

Formal IMPL-EVAL for **S3 of the Aspire 13.5 epic (phase B)** — issue #1715, draft PR #1741, epic
#1712. Route: Claude · Anthropic · Fable 5 · medium.

- Evaluate **exactly** head `6c699ab66` on `test/aspire-13-5-s3-fixture-recapture` (Phase-A
  base `85bd49673`). Your worktree: `/home/agent/projects/netscript/worktrees/007-aspire-s3-eval`
  (detached at that head; read-only for product files; write only your `evaluate-cycle-4.md`
  into the supervisor run dir named below).
- Generator run dir (in the tree): `.llm/runs/test-aspire-13-5-s3-fixture-recapture--impl/`
  (`receipts/09-phase-b-attempt-3-capture.md`, `run-resources.json`, `worklog.md`).
- Contract of record: `packages/mcp/tests/fixtures/telemetry/README.md` "Pending Aspire 13.5.3
  capture (phase B)" at the Phase-A head, plus issue #1715: start the exact 13.5.3 AppHost, wait
  for required resources, trigger the scaffolded `health-check` worker job, capture
  `/api/telemetry/resources` and `/api/telemetry/spans` raw, save as
  `aspire-13.5.3-resources.json`/`-spans.json`, add `aspire-13.5.3-fixture.ts`, add the 13.5.3
  case beside the kept 13.4.6 case, promote parity `pending-lease → required`. **Never
  fabricated, copied forward, or hand-edited.**

## What to verify (all at the exact head, reproduced yourself)

1. Provenance: the envelopes are byte-level plausible outputs of a real 13.5.3 dashboard
   (structure, versions, timestamps consistent with the receipt's capture window 2026-08-30
   ~18:2xZ, ephemeral ports); no 13.4.6 content re-labelled; 13.4.6 files unchanged vs
   `85bd49673`.
2. Redaction: no dashboard URL/token/secret in committed text (span-attribute localhost URLs of
   the scaffold services are expected and fine).
3. Consumer: `telemetry-live-fixture_test.ts` 13.5.3 case + the parity manifest state
   (`.llm/tools/validation/check-compat-fixtures_test.ts` `required`) — run the scoped gates
   (`run-deno-test.ts`, `run-deno-check.ts --root packages/mcp`, `quality:scan`,
   `arch:check`, `check:mcp-export-corpus` if applicable) and record exit codes.
4. Contract honesty: the fixture asserts `listedRunCount: 0, jobFound: false` because the scratch
   lacked the `streams` plugin (supervisor D-75 O-2) while the trigger POST succeeded. Decide
   explicitly whether the #1715 contract is satisfied with a captured-but-not-listed worker run,
   or whether this is a scope gap that must be named (not silently accepted). Cite the README
   contract lines.
5. PR hygiene: draft, base, labels, closing keywords unchanged from cycle 2; the
   `[PHASE: IMPL] S3 phase B` comment matches the branch facts.

Verdicts: `PASS`, `FAIL_FIX` (bounded, name each fix), or `FAIL_PLAN`. Write
`/home/agent/projects/netscript/worktrees/007-aspire/.llm/runs/research-aspire-13.5-adoption--0.0.7/slices/s3/evaluate-cycle-4.md` and post
the same verdict as a PR #1741 comment headed `[PHASE: IMPL-EVAL] [VERDICT: …] — cycle 4 (phase B)`.
Do not modify the branch, the PR metadata, or any file outside your evaluate file.

## Cycle-4 scope (delta)

Cycle 3 (`slices/s3/evaluate-cycle-3.md`, head `1611c5868`) returned `FAIL_FIX` with F-1 (README /
fixture header omit the degraded semantics), F-2 (unexplained `producer` / `listedRunCount: 0` /
`jobFound: false`), F-3 (stale run artifacts, phase-A PR body). The fix is one commit `6c699ab66`
("test(mcp): document scoped 13.5.3 capture semantics", 5 files, +66/−9, envelopes untouched).
Re-evaluate F-1..F-3 against the exact head, re-run the regression gates from cycle 3 (provenance,
redaction, scoped tests/check), confirm the PR body/labels/base/draft/closing keywords are as
required, and issue the cycle-4 verdict in `evaluate-cycle-4.md` + a PR #1741 comment headed
`[PHASE: IMPL-EVAL] [VERDICT: …] — cycle 4 (phase B)`.
