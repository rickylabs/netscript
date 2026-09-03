# IMPL-EVAL — PR #1909 (fix/aspire-event-observation @ d44fb2a6fade3b0fa47303c735b06e4521b13790)

Evaluator lane: OpenHands (OpenRouter `z-ai/glm-5.3-flash`), separate session from the generator
(Codex `gpt-5.6-sol`, thread `01a0606e-e6da-7bf1-8760-753a71eb715d`). Effort not attested: the
OpenHands adapter does not expose effort identity. Scope: verify the approved plan against the
changed state at the immutable head; no source edits made by this session.

## Inputs verified

- Plan disposition: worklog records a justified `PLAN-EVAL: N/A` — #1906, the implementation brief
  (`implement.md`) and supervisor addenda lock the API, container shapes, sequencing, file scope,
  and verification. IMPL-EVAL remains mandatory and is this pass.
- Design checkpoint: worklog "Design" section (surface vocabulary, ports/lifecycle, transition and
  attribution split, constants policy, commit slice, deferred scope) — present before commit, and
  commit `8681daf77` follows it.
- Commit trail: PR #1909 lists exactly the three slice commits; head `d44fb2a6f` is CI-green.

## Findings

| # | Severity | Finding | Evidence | Required action |
| - | -------- | ------- | -------- | --------------- |
| 1 | info | CI live proof (DoD item 1) now green at the evaluated head: `scaffold-runtime (aspire + docker + postgres)` and `scaffold-runtime-sqlite` PASS; run 33617534840 ran at `d44fb2a6fade` and executed `runtime.health.listener-unreachable` with `listener-unreachable-receipt.json` uploaded | `gh run view 33617534840 --json headSha` → `d44fb2a6fade…`, conclusion success | None |
| 2 | info | Focused gates re-run by the evaluator at head: 10 passed / 0 failed across `resource-state-stream_test.ts` + `listener-unreachable-fixture_test.ts` | `deno test --no-check --no-lock --allow-run` (packages/cli) exit 0 | None |
| 3 | info | Scoped static gates re-run at head, raw exit codes: scoped `run-deno-check.ts` (141 files, 0 findings) exit 0; scoped `run-deno-fmt.ts` (192 files, 0 findings) exit 0; `quality:scan` `"ok":true, 0 findings`; `arch:check` exit 0 | evaluator run log | None |
| 4 | info | Matcher truth table verified against source + tests: null data → token fallback; code-only accepted; wrong/malformed code fails closed (no prose fallback); Healthy reports rejected with or without matching prose; punctuation-suffixed/prefixed tokens rejected; both producer wordings accepted | fixture lines 212–271, test file lines 47–118, all passing | None |
| 5 | info | Parser guard verified live: sibling `{resources:[postgres,…]}` line throws `Unrecognized Aspire resource update line` including the raw line; single-resource line accepted. GATE-2 probe: `readListenerHealthReport` returns the real Healthy report from the live topology, and throws `… was never published` on a missing key rather than returning undefined | evaluator probes (scratch, removed) | None |
| 6 | info | Non-vacuity holds: ceiling test feeds a Healthy event, waits for Unhealthy, `assertRejects` at the 1,000 ms ceiling, then asserts the child is killed; snapshot path never discovers a transition (baseline health asserted pre-fault; evidence re-read post-transition with real-backing continuity) | resource-state-stream_test.ts:107–118; listener-unreachable-fixture.ts:96,290–305 | None |
| 7 | info | No poll constant: D-101's `REPORT_DEADLINE_MS`/`REPORT_POLL_MS`/`HEALTHY_WAIT_TIMEOUT_SECONDS` are gone; only the unit-ceiling and controller-protocol constants remain, each named/commented as failure ceilings per brief constraint 3 | `grep -nE '(_DEADLINE_MS\|_POLL_MS\|TIMEOUT_SECONDS)' listener-unreachable-fixture.ts` → 1 hit (unit ceiling) | None |
| 8 | info | Close-gate clean: body has `Refs #1906` and no closing keyword; issue #1906 D-101 DoD box remains unchecked; close-gate PR #1858 open, correctly treated as unlanded | `gh pr view 1909` body; issue grep | None |
| 9 | info | Debt / lock hygiene: no new arch-debt entry required; no `deno.lint-ignore`/`as unknown as` in the new surface; `deno.lock` change comes from the main-merge commits, not PR commits | grep 8681daf77/d44fb2a6f; `git diff 67c7afa76..d44fb2a6f --stat -- deno.lock` (main-merge-only) | None |
| 10 | info | Fixture at 490 LOC (limit ≤500); review threads 0 unanswered | `wc -l` = 490; `agentic:review-threads` PASS threads=0 | None |
| 11 | minor, non-blocking | `assertThrows`-covered grammar (listener-unreachable-fixture_test.ts:3–7) is not exercised by any product path today; harness-external. Reserved for the follow-up adopter slice | fixture_test.ts:3–7; test naming | Keep scoped to the adoption slice under #1906 |
| 12 | info | Final head commit `d44fb2a6f` restores the `assertEquals` import; its diff vs `8681daf77` is exactly that import, so CI test evidence carries unchanged gate substance | `diff <(git show 8681daf77:…fixture_test.ts) <(git show d44fb2a6f:…fixture_test.ts)` → 1 import line | None |

## Gate disposition

- Plan-Gate: `PLAN-EVAL: N/A` justified and recorded pre-implementation — satisfied (protocol rule 2).
- Design checkpoint: present — satisfied (rule 3).
- Named gates per slice: scoped check, affected unit tests, scoped fmt — green, re-run at head — satisfied (rule 4).
- Concept of Done: all in-slice PR DoD items checked; slice-scoped items only — satisfied (rule 5).
- Independent gate verification: done (rules 6, 7) — findings table above.
- Doctrine: no violations named or needed (rule 8); no debt delta (rule 9).
- Close-gate: honored (rule 12). Release gates: n/a — not a release cut (rule 14).

## Remaining risks (accepted, documented)

- #1906's unchecked boxes (remaining Bucket A/C sites, regression guard) are out of this slice's
  scope by design and remain open on the issue.
- PR DoD box "CI confirms D-101 against the live Aspire 13.5.3 follow stream" is now evidenced by
  the green `scaffold-runtime` jobs at this head; the PR body should be ticked on merge prep.
- The Aspire skill doc (`.agents/skills/aspire/SKILL.md`) gained the governing event-system
  section in this branch's main-merge commits, closing the drift the worklog recorded.

## Verdict

All applicable gates pass with raw evidence; approved scope for slice 1 of #1906 is complete; no
unrecorded doctrine violation or debt delta. Both PR-body blockers are resolved at the evaluated
head (CI live proof green; this document is the separate-session IMPL-EVAL).

OPENHANDS_VERDICT: PASS
