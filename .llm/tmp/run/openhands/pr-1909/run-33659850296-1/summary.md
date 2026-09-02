# IMPL-EVAL Summary — PR #1909 (D-101 Aspire follow stream)

## Summary

IMPL-EVAL for `fix(e2e): observe D-101 transitions through Aspire follow stream` at immutable head
`c3805e1d2b29e68a496676e79ee8658f64a9d1b7` against trusted base `850cc7757d11d420b9061dbe6a61536357ab77fe`.
Evaluator lane: OpenHands (OpenRouter `z-ai/glm-5.3-flash`), run `33659850296-1`, separate session
from the generator (Codex `gpt-5.6-sol`, thread `01a0606e-e6da-7bf1-8760-753a71eb715d`); effort not
attested (adapter does not expose it). No source edits were made by this session (protocol
invariant). Full evaluation written to
`.llm/runs/fix-aspire-event-observation--impl-33659850296-1/evaluate.md`.

## Changes

None by the evaluator. The PR diff at head confines itself to `packages/cli/e2e/**` (new
`resource-state-stream.ts` 292-LOC subscription seam, rewired `listener-unreachable-fixture.ts`
515 LOC, 394 LOC of tests) plus `.llm/runs/**` artifacts — inside the approved slice-1 file scope.

## Validation

- **Process**: justified `PLAN-EVAL: N/A` in worklog (per protocol rule 2); design section precedes
  the slice commit; commit trail (5 commits) matches the plan; no speculative seams; constants for
  finite vocabularies (`follow-event` attribution, 120s failure ceilings).
- **Static (re-run at head)**: scoped `deno check` 137 files / 0 findings; scoped
  `deno fmt --check` 194 files / 0 findings; repo `deno lint` 0 problems; `deno task arch:check`
  and `quality:scan` exit 0; `git diff 850cc7757..c3805e1d2 -- deno.lock` empty (lock hygiene).
- **Runtime (re-run at head)**: focused unit tests 15 passed (10 steps) / 0 failed, 204ms —
  synthetic NDJSON parse/buffer/close/failure paths plus fixture matcher truth table.
- **Live CI proof** (local `e2e:cli` intentionally not run; CI owns live schema proof): run
  33659793007 at head — `scaffold-static` PASS, `scaffold-runtime-sqlite` PASS; the critical step
  `runtime.health.listener-unreachable` passed (attempt 1, 30.7s) and its artifact receipt shows
  `transitionEvidence: {"departure": "follow-event", "recovery": "follow-event"}` with real-key
  continuity held during the fault — the two-directional D-101 requirement is proven on Aspire
  13.5.3. Prior run 33617534840 at `d44fb2a6f` shows the postgres lane green for the same fixture.
- **Doctrine/anti-patterns**: all in-scope APs CLEAR; F-1 file-size at 515/800 LOC is flag-level
  only; F-CLI-* gates PENDING_SCRIPT per archetype S9 disposition; arch-debt delta zero.
- **Review/close-gate**: 0 open review threads; PR body carries `Refs #1906` (no closing keyword —
  correct for a partial slice); issue #1906 D-101 DoD box not self-closed by this PR.

## Responses to review comments or issue comments

No open review threads and no new review comments at evaluation time; nothing to answer.

## Remaining risks

- **Desktop-native Linux lane fails at head and sibling runs** ("v1 failed to stage v2" in the deb
  update smoke; a `@orpc/contract` import-map error in a backend module path). Both are
  pre-existing, not introduced by this PR (diff touches no desktop surface; the import issue traces
  to #1889, which is in the trusted base). Track in the owning desktop epic; do not block D-101.
- `listener-unreachable-fixture.ts` crossed the F-1 500-LOC flag line (515/800) — optional
  extraction in the follow-up adoption slice.
- Postgres e2e lane was still pending at eval time; the sqlite lane already proves the live
  follow-stream contract at this head, and the postgres lane proved it at `d44fb2a6f`.
- The PR-body DoD box "CI confirms D-101 against the live Aspire 13.5.3 follow stream" should be
  ticked on merge prep now that the evidence exists.

OPENHANDS_VERDICT: PASS
