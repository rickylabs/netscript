# Drift Log — release-0.0.6-internals--orchestration

Append-only. Newest entries at the bottom.

## D-1 — PLAN-EVAL and IMPL-EVAL waived for PR-A (#1436/#1415)

- **Severity:** minor (process, owner-authorized)
- **Recorded:** 2026-08-12, stage A
- **Fact:** `netscript-harness` makes IMPL-EVAL mandatory "unless the owner explicitly waives it", and
  `lane-policy.md` (owner decision 2026-08-08) allows `PLAN-EVAL: N/A` for small/mechanical issues
  with complete contract/scope/acceptance/gates.
- **Drift:** PR-A runs neither pass.
- **Authorization:** owner brief `/tmp/ns006-internals-orchestrator.md` §3 — "#1436/#1415 are
  mechanical: no ceremonial PLAN-EVAL or IMPL-EVAL; record N/A/owner waiver and prove negative cases."
- **Substitute evidence required:** executed RED→GREEN negative cases per fix plus the orchestrator's
  own re-run of the probe against the patched parser. A waiver removes the ceremony, not the proof.

## D-2 — OpenHands not used as the formal evaluator

- **Severity:** minor
- **Recorded:** 2026-08-12, stage A
- **Fact:** the brief §5 prefers OpenHands for broad/complex IMPL-EVAL "after #1524 lands". `#1524`
  (`fix(agentic): fail closed on open evaluators`) is an **open draft PR with no milestone** at
  `01aa12b67`; `lane-policy.md` additionally records the automated cloud agent lane as
  "TEMPORARILY PAUSED by owner (2026-08-06)".
- **Drift:** none against policy — the native opposite-family route *is* the documented local default.
  Recorded so the choice is visible rather than inferred.
- **Effect:** formal PLAN-EVAL and IMPL-EVAL run in fresh native opposite-family sessions. Re-check
  #1524 before the last rail IMPL-EVAL; if it has landed, the cloud route becomes available and the
  switch is recorded here.

## D-3 — No canary declared by this lane

- **Severity:** minor
- **Recorded:** 2026-08-12, stage A
- **Fact:** `milestone-run.md` stage E declares canary points at wave boundaries.
- **Drift:** this topical lane declares none.
- **Authorization:** brief §7 — "Report merges immediately; root owns canary/stable." Stage E is
  owned by the root 0.0.6 orchestration, which computes payload from merge history
  (`canary-cadence.md`). This lane's obligation is a live `cut-trace.md` and an immediate merge report.

## D-4 — #1436's prescribed fix is a no-op; the issue's diagnosis is imprecise

- **Severity:** significant (a gate-integrity finding about a gate-integrity issue)
- **Recorded:** 2026-08-12, stage B, executed at `01aa12b67`
- **Fact:** #1436 states the parser "matches closing keywords **without a word boundary**" and
  prescribes `\b(clos(e|es|ed)|fix(es|ed)?|resolv(e|es|ed))\b\s+#\d+`. Executed against
  `.llm/tools/validation/acceptance-evidence.ts:43`, the word boundary is **already present** (landed
  by #1303) and the fence-stripping the issue does not mention is present too (`:47`).
- **Executed evidence** (`evidence/probe-1436-baseline.ts`):
  - `'Exact pre-fix #1431 head'` → `[1431]` — the reported defect, reproduced.
  - `'un-fixed #555'` → `[555]` — a second instance, **not** in the issue.
  - `'hotfix #999 landed'` → `[]`, `'prefixes #888 there'` → `[]`, `'This is a bugfix #777'` → `[]` —
    the three cases the issue predicts would break are already handled.
- **Why it matters:** `\b` is the cause, not the cure. `-` is a non-word character, so `\bfix\b`
  matches the `fix` inside `pre-fix`. Implementing the issue's literal prescription yields a patch
  that changes nothing while appearing to fix the bug — the exact class `milestone-run.md`
  § Gate integrity records ("two guards whose predicate could never be true … both did nothing and
  looked correct").
- **Action:** the correct predicate excludes a preceding hyphen as well as a preceding word character
  (`(?<![\w-])` shape). PR-A's brief carries `pre-fix`, `un-fixed`, `hotfix`, `prefixes`, `bugfix` as
  mandatory cases and the orchestrator re-runs the probe against the patched parser before merge.
  #1436's acceptance is unaffected (it has no checkboxes); the issue's *analysis* section is corrected
  by a comment on the issue, so the record is not silently better than the issue.

## D-5 — `quality:scan:repo` is RED on `main`, and #1378's gate box is unsatisfiable until it is fixed

- **Severity:** significant
- **Recorded:** 2026-08-12, stage B, executed at `01aa12b67`
- **Fact:** #1378 § Current surface records "The scan is green today at 0 findings / 7 default / 10
  repo-wide allowances" (measured 2026-08-08 at `fac9e339042c`). Executed now:
  `deno task quality:scan:repo` exits **1** with **5** `ts-error-suppression` findings.
- **Cause:** `scan-code-quality.ts:86-89` exempts `_test`/`.test`/`.spec` files but not `*_type.ts`, so
  negative type fixtures are scanned as production source and their `@ts-expect-error` assertions —
  the whole point of the fixture — are reported as violations. `b3dc006e8` ("accept typed SDK client
  contributions (RFC 0001)") added `packages/sdk/tests/type-fixtures/sdk-client-contributions-rfc_type.ts`
  and turned the gate red.
- **Blast radius:** the **blocking** `code-quality-repo` job has failed on **7 consecutive pushes to
  `main`** (first `b3dc006e8` 2026-08-11T20:15Z; last green `0fbe3dadd` 2026-08-11T11:48Z). #1378's
  `gate:` acceptance box requires `quality:scan:repo` green after its change, so that box cannot be
  truthfully ticked until this is cleared.
- **Also observed:** the PR-side `code-quality` job scans only changed files and skips drafts
  (`code-quality.yml:28,36-42`), so the repo-wide job is the only path that ever scanned the file — and
  it runs post-merge. The violation was structurally invisible until it was already on `main`.
- **Action:** filed as **#1530** (p1, milestone 0.0.6) with the executed evidence and a narrow fix
  keyed on `tests/type-fixtures/**/*_type.ts`. Sequenced as PR-E before PR-D (`plan-quality-rail.md`
  R-1). Two now-redundant `// quality-allow:` lines are removed by it, lowering the repo-wide count
  10 → 8, which matters because #1378 wires `--max-allow` as a budget that can only fall.

## D-6 — #1529 added to the lane by the owner, then withdrawn by the owner

- **Severity:** significant (scope, owner-directed both ways)
- **Recorded:** 2026-08-12, stage C
- **Sequence:** the owner added #1529 (`fix(ci): ready_for_review can report every required lane as
  skipped`, p0 release blocker) to this lane as a separate leaf PR, requiring proof of both `ci` and
  `e2e` visibility semantics. The orchestrator created worktree `/home/codex/repos/ns006-cigate`,
  branch `fix/1529-required-lane-visibility`, and a brief. The owner then closed #1529 as **not
  planned**, stating the observed core-CI skip is intended, and withdrew it from the lane.
- **Independent finding, which agrees with the owner's call:** before the withdrawal the orchestrator
  reconstructed the event sequence from the Actions API and found the issue's repro **misattributed**.
  Run `31575007718` (all six jobs skipped) was created at `07:41:03Z`, while the `ready_for_review`
  timeline event is at `07:41:14Z` — 11 seconds later. That run was a **draft `synchronize`**, and
  draft pushes scheduling no jobs is documented intended behaviour (`ci.yml:59-60`). The real
  `ready_for_review` run is `31575023887`, which was **`cancelled`** 82s in by the next push under
  `concurrency.cancel-in-progress` (`ci.yml:48-50`). So the cited evidence did not demonstrate the
  claimed mechanism.
- **Action:** worktree removed, branch deleted, brief deleted. No workflow or visibility behaviour was
  changed. Two incidental observations made during that analysis are recorded in D-7 as **observations
  only** — not acted on, not filed, per the owner's instruction to drop the item completely.

## D-7 — observations recorded but deliberately not acted on

Kept because `agent-milestone-orchestrator` § Honesty rules requires recording what a run learns
rather than discarding it, and because an unrecorded observation gets rediscovered at cost. Neither is
being fixed, filed, or briefed by this lane. Both are the owner's call.

1. **Both `lane-visibility` jobs are reporters, not gates.** `ci.yml:347-395`
   (`core CI lane visibility`) and `e2e-cli.yml:509-564` (`scaffold CI lane visibility`) each consist of
   one step that writes a Markdown table to `$GITHUB_STEP_SUMMARY`. Neither contains `exit 1`
   (`grep -n "exit 1" .github/workflows/ci.yml` returns only Aspire-version checks in other jobs). They
   cannot fail.
2. **`pr-checks.ts` classifies a `skipped` check-run at head as a pass.**
   `.llm/tools/agentic/github/pr-checks.ts:141-157` chains superseded → stale-post-merge → pending →
   cancelled → failure → **else `current-pass`**, so `conclusion: 'skipped'` and `'neutral'` fall
   through to `current-pass`, and `buildPrCheckReport` then reports `ok: true`. This is the tool
   `netscript-pr`'s close-gate playbook directs operators to for "establish currency first".

## D-8 — orchestrator brief error, corrected mid-slice (Gate 1 permissions)

- **Severity:** minor
- **Recorded:** 2026-08-12, stage C
- **Fact:** PR-A's brief prescribed `deno test --allow-read --allow-env .llm/tools/validation/` as
  Gate 1. The implementation agent ran it, got exit 1 with 39 passed / 9 failed, correctly diagnosed
  all 9 as pre-existing `NotCapable: Requires write access` at `Deno.makeTempDir()` calls in
  `check-aspire-host-ports_test.ts`, `check-netscript-jsr-specifiers_test.ts` and
  `fresh-ui-quality_test.ts`, **refused to weaken unrelated tests**, recorded it, and continued with
  the unblocked gates.
- **Verdict:** the brief was wrong, the agent was right. Gate 1 is amended to include
  `--allow-write`, and that permission requirement is carried into the rail plan's validation table so
  the next three briefs do not repeat the error.
- **Worth noting:** this is the escalate-don't-idle instruction working as intended. The recorded
  failure mode it was written against — supervisors going idle at a red gate, four occurrences in
  0.0.4 — did not recur.

## D-9 — never wrap an attached Codex launch or resume in a shell `timeout`

- **Severity:** significant (tooling practice; owner-corrected)
- **Recorded:** 2026-08-12, stage C
- **What the orchestrator did wrong:** wrapped `agentic:launch-codex-slice` in `timeout 580` and
  `codex exec resume` in `timeout 900`, to keep the foreground stream from blocking the supervisor turn.
- **Why it is wrong:** the wrapper's SIGTERM at expiry **kills the attached slice**, not merely the log
  stream. The launch wrapper did fire (exit 143 / SIGTERM); this thread survived it, and the worklog
  initially recorded that as "an observation, not a failure". That conclusion was wrong — surviving once
  is not evidence the practice is safe, and treating a SIGTERM on an attached agent as harmless is
  exactly the "verify the artefact, never the exit code" mistake in reverse.
- **Correct practice, owner-stated:** attached launch and resume run **unwrapped**. For bounded
  observation use `deno task agentic:codex-watch --mode turn --thread-id <id> --timeout-seconds N`,
  which is designed to expire without touching the slice. Preserve the same thread and worktree
  throughout; never launch a rival.
- **Also learned (and independently useful):** `codex exec resume` fails fast with
  `thread-store conflict: … already has an active writer` while the thread is mid-turn. That is the
  mechanical signal for "you are not at a turn boundary" — steer on `codex-watch --mode turn`
  completion, not on git activity.
