# IMPL-EVAL — PR #1823 (`fix/harness-cluster-state-liveness`)

## Verdict

**PASS** — non-blocking findings recorded (1 Minor executed, 2 Minor plan-adjacent, 2 Info). No
assertion weakening, no scope drift, no fail-open on source unavailability. All five attack
priorities re-derived from primary evidence; nothing inherited from the supervisor.

## Evaluated Head

- PR #1823, base `main`, evaluated at exact head `c3b3b4cb6f9c311732e74b56444c657c3841c9db`
  (matches `gh pr view 1823` `headRefOid` and `origin/fix/harness-cluster-state-liveness`).
- Base `main`: `584caa03f474de36b2d6e62e7162ab410c6ccb59`.
- Commits: `5f41e90dc` (RED, test-only) → `d5bfc9d6c` (GREEN, implementation) → `c3b3b4cb6`
  (merge of `origin/main` into the branch — no harness-tool changes in the merge side).
- Run dir `.llm/runs/fix-harness-cluster-state-liveness--1753/`; worktree
  `007-eval-1753`, detached, tree clean except this artifact.

## Evaluator Identity

- Requested route: OpenRouter · GLM 5.3 Flash · max (sanctioned opposite-family escalation per
  `lane-policy.md`). Effort is not introspectable from inside the session; requested preset was
  max and no contrary signal was observed.
- Generator: Codex · OpenAI · GPT-5.6-Sol (author of all evaluated commits). Generator ≠ evaluator
  holds: this is a separate session that produced none of the evaluated commits.
- Read-only pass: the only tracked edit is this file. Probe scripts live in gitignored
  `.llm/tmp/eval-1753/`; the throwaway RED worktree (`.llm/tmp/eval-1753/red-wt` at `5f41e90dc`)
  was created for RED re-measurement and removed afterwards (`git worktree list` clean).

## Re-measured evidence (own numbers, real `out=$(cmd); rc=$?` capture)

| Gate | Command | Result |
|---|---|---|
| RED reproduction | `deno test --allow-all .llm/tools/harness/validate-milestone-cluster_test.ts` at `5f41e90dc` (throwaway worktree) | **rc=1, 13 passed / 2 failed** — exactly the two new reconciliation tests |
| Focused harness | `deno test --allow-all .llm/tools/harness/` at head | **rc=0, 27 passed / 0 failed** |
| Root full suite | `deno task test` at head | **rc=0, 4,432 passed / 0 failed / 19 ignored** (213,530 ms) |
| Scoped check | `deno check --unstable-kv` on both harness files at head | **rc=0** |
| Doctrine gate | `deno task arch:check` at head | **rc=0** |
| Lock + untouched file | `git diff 584caa03f c3b3b4cb6 -- deno.lock .llm/tools/harness/extract-verdict.ts` | **empty** (both unchanged) |
| fmt (known pre-existing) | `deno fmt --check .llm/tools/harness/` at head | rc=1, exactly one finding, in `extract-verdict.ts` |

All supervisor numbers reproduce exactly. Process correction recorded for honesty: my first
scoped-check/arch:check invocation ran with a persisted `cd` inside the RED worktree (wrong
commit); both were re-run at the true head with absolute paths before scoring — results identical.

## Attack 1 — Is the RED→GREEN real? (test file changed between commits)

**Real. Re-derived from `git show`/`git diff 5f41e90dc d5bfc9d6c` on the test file.**

- RED commit touches the test file plus run artifacts only — no implementation exists yet
  (`git show --stat 5f41e90dc`).
- GREEN's test-file diff removes exactly what the supervisor described: local placeholder types
  (`TestLiveMilestonePr`, `TestMilestonePrSource`, `TestReconciliationFinding`) and the
  `validateMilestoneCluster as unknown as (...)` cast, replaced by real imports
  (`LiveMilestonePr`, `MilestonePrSource`, `milestonePrSourceFromExport`).
- The two RED tests' assertions are **byte-identical** across RED→GREEN:
  `assertEquals(result.ok, false)` plus a full deep-equal of `result.findings` against a single
  structured object (`kind`/`issueNumber`/`prNumber`/`lane`/`recordedHead`/`liveHead`). Only the
  call syntax changed (helper vs cast). Zero assertions removed, zero loosened.
- Additions, not subtractions: 4 new tests (coordinator-artifact exclusion, merged-leaf exclusion,
  unavailable-source fail-closed, export adapter contract) and 2 *added* assertions elsewhere
  (CLI `--github-prs` parsing; `result.findings` must be `[]` on the valid cluster). Count 15 → 19
  confirmed by `grep -c 'Deno.test('`.
- Why RED could not fake a pass: at `5f41e90dc` the validator's signature takes only artifacts, so
  the injected source was ignored and the validator returned its old verdict. My independent RED
  run (throwaway worktree) failed the two tests on `AssertionError: Values are not equal` — the
  `as unknown as` cast cannot manufacture `findings` that the old function never returns. RED is
  a genuine two-assertion-failing reproduction, not a staged one.

The supervisor's judgment was correct; no weakening found.

## Attack 2 — Does reconciliation work, or only appear to? (fail-open hunt)

Method beyond reading: I built an executed probe (`.llm/tmp/eval-1753/probe.ts`) cloning the test
suite's canonical valid fixture and ran the reconciliation edge scenarios the suite does *not*
cover, plus CLI-level invocations of the script itself against a synthetic run dir.

**Core detections verified working (execution, not just tests):**

- Stale live head on an allocated leaf → `ok:false` with `stale-head` finding; CLI exits 1 with
  `kind: "stale-head"` (CLI probe against `export-stale-head.json`).
- Open milestone PR absent from cluster leaves → `ok:false` with `missing-leaf` finding.
- `ok` is computed as `errors.length === 0 && findings.length === 0`
  (`validate-milestone-cluster.ts:833`) — findings cannot be dropped while `ok` stays true.

**Fail-open on unavailability: not present — fails closed on every path I could construct:**

- No source provided (programmatic default) → `source-unavailable` finding → `ok:false`
  (unit test + CLI without `--github-prs`, rc=1, detail "pass --github-prs <export.json>").
- `listOpenMilestonePrs` rejects (e.g. GitHub 503) → single `source-unavailable` finding, `ok:false`.
- Per-leaf `readPrHead` rejects (leaf PR absent from export) → per-leaf `source-unavailable`
  finding carrying the leaf's issue/pr/lane/recordedHead, `ok:false`.
- Missing `intake.repo`/`state.milestone` → explicit `source-unavailable` finding, **not** a silent
  skip (`validate-milestone-cluster.ts:815-827`).
- Malformed export (`schemaVersion: 2`), export with duplicate/malformed entries, wrong
  repo/milestone identity (`requireIdentity`), or missing export file → source unavailable or
  thrown-and-caught → rc=1. The CLI never degrades a bad export into "no findings".

**Fail-open on state disagreement: found, and narrower than code-reading suggested** — see
Findings F1–F3. Critically, the plan explicitly specified the exclusion direction
(plan.md line 42 D5 "Terminal cluster leaves and live merged PRs do not create liveness findings";
risk line 56 "Reconcile only open listed PRs and skip terminal state leaves"), so these are
residual-coverage observations, not plan violations. Drift log ("No drift recorded") is accurate.

## Attack 3 — Test isolation

**Clean.** `grep -nE 'fetch\(|Deno\.command|Deno\.connect|createHttpClient|GITHUB|api\.github'`
over both files: zero matches. The seam is the injected `MilestonePrSource` parameter; the CLI
adapter `milestonePrSourceFromExport` is a pure in-memory reader over a JSON document. The default
source is the fail-closed unavailable stub, so no test can accidentally pass via a live call —
and the unavailable-source test asserts exactly that failure. All 27 focused tests pass with no
network dependence.

## Attack 4 — Scope

`git diff --name-only 584caa03f c3b3b4cb6` = 7 files under
`.llm/runs/fix-harness-cluster-state-liveness--1753/` + exactly
`.llm/tools/harness/validate-milestone-cluster.ts` and
`.llm/tools/harness/validate-milestone-cluster_test.ts`. Nothing outside `.llm/`; no
`packages/`, `plugins/`, or `deno.lock` changes. Confirmed clean.

## Attack 5 — Pre-existing fmt condition (not scored)

Reproduced at head: rc=1, one finding, `extract-verdict.ts:128-129`. The file is byte-identical to
`main` (diff empty) and was equally dirty in the RED worktree. Per the brief, not scored against
this PR and not required to be fixed here.

## Findings by severity

1. **F1 · Minor (confirmed by execution) — live closed/merged PR on an *active* leaf passes
   silently.** With leaf `phase: 'implementing'` and the live PR `state: 'closed'` (or `'merged'`)
   at the same head, the result is `ok:true, findings: []` — the stale-head condition requires
   `livePullRequest.state === 'open'` and the missing-leaf scan only covers PRs *not* in
   `leafByPrNumber`. Plan D5's rationale covers terminal *cluster leaves*; it does not cover the
   cluster-state-behind-reality direction (GitHub says the PR is dead, cluster still says
   `implementing`). This is the closest surviving relative of the original defect, though it is
   neither of the two detections this leaf claims — both of which work. Suggested follow-up: emit a
   finding (e.g. `dead-live-pr`) when a non-terminal leaf's live PR is closed/merged.
2. **F2 · Minor (confirmed by execution) — live base-branch retarget is not reconciled.** A leaf
   recorded with `baseBranch: 'main'` passes `ok:true` when the live PR is retargeted to another
   base (same head, still open): the validator reads live `baseBranch` but uses it only to filter
   missing-leaf candidates, never cross-checking it against the recorded leaf. The "must target
   main directly" invariant is enforced against the recorded field only.
3. **F3 · Minor (plan-sanctioned deferral, recorded for the follow-up ledger) — export freshness is
   unbounded.** `capturedAt` is required but never compared to any clock; a week-old export
   silently yields `ok:true` while live GitHub has newer PRs/heads. plan.md line 48 explicitly
   defers fresh-export creation to external tooling ("this slice defines and validates its consumer
   contract only"), so this is not drift — but nothing in the consumer contract bounds export age.
   Recommend a freshness bound (or an explicit caller obligation) in a follow-up.
4. **F4 · Info (read) — terminal leaf with a live open PR passes.** `leafByPrNumber` includes
   terminal-phase leaves, so an open PR matched to a `closed`/`moved` leaf is excluded from
   missing-leaf, and terminal leaves are skipped in the stale-head loop. Low impact; same family
   as F1.
5. **F5 · Info (read) — export `headSha` accepts any non-empty string** (no 40-hex shape check) in
   `milestonePrSourceFromExport`. Comparisons are string equality, so behavior is unaffected;
   cosmetic input-validation nit.

## Verdict

VERDICT: PASS
