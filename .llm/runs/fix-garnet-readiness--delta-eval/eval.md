# Delta IMPL-EVAL Re-anchor — PR #1858

PASS_IMPL

## Identity and scope

| Field | Value |
| --- | --- |
| Head judged | `1feb8256c9337ac55d54858ea5277dcaf514a8b6` (`git rev-parse HEAD` verified; GitHub PR head matches) |
| Merge shape | Parents `ebe818b70363c361de482035987564785c6a60d8` and current main `77ad823dcb1874ccfc8964b4679ad92a3a145e0b` |
| Lane | Codex · OpenAI · GPT-5.6 Sol · xhigh, `review_claude`; same separate evaluator session |
| Re-anchor scope | F1 and its follow-on status/delimiter repairs, poll-path preservation, current-main concurrency keys, and exact-head hosted evidence |
| Carried findings | Questions 2–5 remain the prior non-blocking observations and were not re-derived |

## Findings

### F1 and both follow-on holes remain closed

- The listener fixture and its focused matcher test are blob-identical between passed head
  `ebe818b70` and re-anchored head `1feb8256c`:
  - fixture blob `d5b69cb11f9354e9114f39050b2722b7262bdeb8`;
  - test blob `ed63de222aae5d2ab860a7ef2a8020020af6fbbb`.
- Current source still enforces `report.status !== 'Unhealthy'` as an immediate false result.
- The fallback remains anchored and delimited by `(?=$|\s)`; a fixed-string search finds zero
  `(?!\w)` occurrences.
- The authoritative structured-code behavior is unchanged: expected code passes only on an
  Unhealthy report, unexpected or malformed present code fails closed, and prose is considered only
  when the code is absent.
- The direct negative/positive matrix from the prior evaluation is unchanged. Independent focused
  wrapper at this head:
  `run-deno-test.ts -- --allow-all .../listener-unreachable-fixture_test.ts` → exit 0,
  **15 passed / 0 failed**.

### The main merge did not restore the old poll path

- The fixture still uses `observeTestOnlyUnhealthy()` for bounded departure observation and
  `requireResourceHealthy()` with `aspire wait --status healthy` for arrival/recovery.
- Searches find no `pollReport` or `pollHealthyReport` definitions or calls.
- Because the fixture blob is identical to the previously passed tree, the merge introduced no
  behavioral edit at this seam.

### Current-main reconciliation is exact

- The only change from `ebe818b70` affecting runtime-lane scheduling is inherited from main.
- `.github/workflows/e2e-cli.yml` is byte-identical between main `77ad823dc` and head
  `1feb8256c`.
- Its runtime mutexes use `e2e-scaffold-runtime-global-v2` and
  `e2e-scaffold-runtime-sqlite-global-v2`, preserving #1910's queue isolation.
- `deno.lock` has the same Git blob at main and head:
  `4f7ea6eac5e2c4bc187ec3edb42aa1883abe45b4`.
- `deno task check:assets-barrel` exited 0. The embedded carrier remained byte-identical across
  regeneration, SHA-256
  `01b5d7ccabbc3fe213c594949b45bd2337d0b2b9a2ff17201d905cfc286fdbac`.

## Exact-head hosted CI read

GitHub PR #1858 reports head `1feb8256c9337ac55d54858ea5277dcaf514a8b6` and base
`77ad823dcb1874ccfc8964b4679ad92a3a145e0b`. The PR workflow merge ref
`4ed90933eeeb9451336b04ea40a0de73f9b987ac` and the judged head have the identical tree
`d8f2add020982b694f8fcfa26ade09b43a0e1c86`.

Run `33616511104`:

- `scaffold-runtime (aspire + docker + postgres)` succeeded: **93 passed / 0 failed / 0 skipped**;
  `runtime.health.listener-unreachable` passed in **43,366 ms**.
- `scaffold-runtime-sqlite (aspire + sqlite + garnet)` succeeded:
  **87 passed / 0 failed / 0 skipped**; the listener gate passed in **20,192 ms**.
- `classify changes`, `scaffold-static`, and `scaffold CI lane visibility` succeeded.
- `desktop-native-linux` failed at `Enforce active desktop exception boundary (#859)`, so the
  exact-head E2E workflow and exact-head CI as a whole must **not** be called green.

The desktop failure is a shared/pre-existing condition, not attributable to this branch:

- PR #1759 at `3ba9c414be804b87231e39bc5a9d95c86feaeae6`, also based on
  `77ad823dc`, fails the same desktop step.
- Both jobs emit the exact diagnostic:
  `desktop failure is outside active issue #859: missing Update written to , .so.update. Will be applied on next launch.`
- PR #1759 does not change this listener fixture, its matcher tests, or the canonical
  `_aspire-compat.ts.template`. Its only path overlap with #1858 is the monolithic generated
  `embedded.generated.ts`, changed from different generator inputs.
- Therefore this red does not contradict the exact-head runtime evidence and does not fail this
  delta implementation.

Exact-head code-quality, public-surface, docs, core `check-test`, core `quality`, and dependency
jobs passed. The separate core `close-gate` failure was evaluated before the PR body was updated:
its log at 09:53 UTC still read `Closes #1844`, while the live body updated at 10:06 UTC correctly
uses `Refs #1844` and records this PR as partial. That stale close-gate plus the new IMPL-EVAL/DoD
state requires an existing-workflow rerun before merge. Review threads are zero.

## Carried non-blocking observations

Questions 2–5 stand unchanged:

- #1906 owns replacement of the surviving departure poll. The 90 s calendar deadline is an honest
  ceiling at 1 s cadence, subject to the already-recorded caveat that one `aspire describe`
  process has no inner timeout. The prior 49.7 s whole-gate observation left adequate but not
  generous interim margin; the current exact-head gate observations were 20.2 s and 43.4 s.
- Native arrival wait cannot make the fixture pass with no health check attached because the named
  test-only report key is read and required `Healthy` immediately afterward.
- Real-backing continuity remains meaningful sampled evidence at baseline, departure, timeout, and
  recovery, not a claim of continuous observation during blocking waits.
- The `finally` path reopens both listeners on ordinary failure and throw and preserves dual
  failure through `AggregateError`; the previously recorded hung-`describe` caveat remains.

## Non-blocking precision note

The matcher comment still says “non-word lookahead,” while the implementation correctly uses the
stricter end-or-whitespace lookahead. This documentation drift did not change in the re-anchor.

## Verdict

The exact matcher/test blobs that earned the prior PASS survived unchanged, the main merge preserved
bounded departure observation plus native arrival, current-main concurrency isolation is present,
and both hosted runtime tiers pass at the exact judged tree. The unrelated shared desktop failure is
reported rather than hidden, and no blocking implementation finding remains.

PASS_IMPL
