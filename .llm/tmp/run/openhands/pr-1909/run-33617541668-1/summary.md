# IMPL-EVAL Summary — PR #1909 (head d44fb2a6fade)

OPENHANDS_VERDICT: PASS

## Summary

Formal separate-session IMPL-EVAL for slice 1 of #1906 ("fix(e2e): observe D-101 transitions
through Aspire follow stream"). Generator: Codex `gpt-5.6-sol` (thread
`01a0606e-e6da-7bf1-8760-753a71eb715d`); evaluator: this OpenHands session (OpenRouter
`z-ai/glm-5.3-flash`, effort not attested — the OpenHands adapter does not expose it). I verified
the approved plan against the changed state at the immutable head without editing source.

## Changes (evaluator-only)

- `.llm/runs/fix-aspire-event-observation--impl/evaluate.md` — formal verdict artifact, committed
  as `90f6fa550` and pushed to `fix/aspire-event-observation`.
- This summary file and the PR verdict comment. No repository source changes.

## Validation (all re-run or verified at the evaluated head)

- **CI live proof (previously the open blocker):** run 33617534840 at head `d44fb2a6fade`,
  conclusion success; `scaffold-runtime (aspire + docker + postgres)` and
  `scaffold-runtime-sqlite` both PASS; log shows `runtime.health.listener-unreachable` executed
  with `listener-unreachable-receipt.json` uploaded.
- **Focused unit tests re-run by the evaluator:** 10 passed / 0 failed across
  `resource-state-stream_test.ts` + `listener-unreachable-fixture_test.ts`.
- **Scoped static gates re-run (raw exit 0):** scoped `run-deno-check.ts` (141 files, 0 findings),
  scoped `run-deno-fmt.ts` (192 files, 0 findings), `quality:scan` ok with 0 findings,
  `arch:check` exit 0 (exit-3 warnings are pre-existing main-side WARNs).
- **Matcher truth table:** all six rows of `matchesExpectedFailure` verified against source and
  passing tests (null-data token fallback, code precedence + fail-closed on wrong/malformed codes,
  Healthy rejection with or without matching prose, token-boundary rejections, producer wordings).
- **Parser guard verified live:** sibling `{resources:[postgres,…]}` envelope rejected with the
  raw line in the error; single-resource line accepted; `readListenerHealthReport` returns the
  real Healthy report and throws (never undefined) on a missing health key.
- **Non-vacuity:** ceiling test must see a rejection via `assertRejects` and asserts child kill;
  snapshot never discovers a transition (baseline health asserted pre-fault; evidence re-read
  post-transition with real-backing continuity).
- **No poll constant:** D-101's `REPORT_DEADLINE_MS`/`REPORT_POLL_MS`/
  `HEALTHY_WAIT_TIMEOUT_SECONDS` are gone; remaining constants are commented failure ceilings.
- **Close-gate / issue hygiene:** `Refs #1906`, no closing keyword, issue D-101 DoD box still
  open — correct for a partial slice. Review threads: 0 unanswered. Locks: no PR-commit churn
  (deno.lock changes come from main merges). Debt: no new entry required.
- **PR commit isolation:** verified via per-commit `git show --stat`; unrelated main-merge noise
  does not belong to this PR.

## Responses to review comments / issue comments

- No open review threads on PR #1909 (agentic:review-threads PASS, threads=0).
- Issue #1906: only the D-101 DoD box is claimed by this slice; the remaining Bucket A/C sites and
  the regression guard intentionally remain open — the PR carries `Refs #1906` without a closing
  keyword, which is the correct partial-completion form.
- Prior opposite-family IMPL-EVAL posted `PASS_IMPL` — that was the run's PASS with IMPL
  notation; this session confirms it with a formal harness verdict and the raw re-run evidence in
  `.llm/runs/fix-aspire-event-observation--impl/evaluate.md`.

## Remaining risks

- PR DoD box "CI confirms D-101…" is now evidenced green at this head; tick the box on merge prep.
- #1906's remaining unchecked boxes are follow-up slices under #1906 (not this PR's scope).
- Minor, non-blocking: `assertThrows`-covered grammar (listener-unreachable-fixture_test.ts:3–7)
  is not exercised by any product path today; harness-external, reserved for the follow-up
  adopter slice.

OPENHANDS_VERDICT: PASS
