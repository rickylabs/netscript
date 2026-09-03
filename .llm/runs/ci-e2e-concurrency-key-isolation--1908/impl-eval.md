# IMPL-EVAL — #1908 runtime concurrency-key isolation

- Evaluator: separate opposite-family session (Claude), head `5fe82956d`, clean tree.
- Author: GPT-5.6 Sol / Codex (PR #1910, issue #1908).
- All exits below are real captured exits via `out=$(cmd 2>&1); rc=$?`. Pipelines were avoided;
  where a `$( )` wrapper around a pipeline was used for token compression, the exit shown is the
  command's own, re-captured without the pipeline where the verdict depends on it.
- Environment note: this eval host has no `rtk`; plain `git`/`gh api` were used throughout.

---

## Q1 — Is the change exactly what it claims?

**Yes, mechanically.** The branch contains exactly two product files plus run artifacts:

```
$ git diff origin/main...HEAD --stat -- .github          rc=0
 .github/scripts/ci-classify-changes.test.ts | 12 ++++++++++--
 .github/workflows/e2e-cli.yml               | 24 ++++++++++++++++++++++--
```

`e2e-cli.yml` has exactly **3 hunks** (`git diff origin/main...HEAD -- .github/workflows/e2e-cli.yml
| grep -c '^@@'` → `3`, rc=0): the header comment block plus the two key literals.

Concurrency surface, HEAD vs `origin/main` (grep over both trees, rc=0 each):

| Location | origin/main | HEAD |
| --- | --- | --- |
| top-level per-ref group | `e2e-cli-${{ github.workflow }}-${{ github.ref }}`, `cancel-in-progress: true` | **unchanged** |
| `scaffold-runtime` | `group: e2e-scaffold-runtime-global`, `cancel-in-progress: false`, `queue: max` | `...-global-v2`, `cancel-in-progress: false`, `queue: max` |
| `scaffold-runtime-sqlite` | `group: e2e-scaffold-runtime-sqlite-global`, `cancel-in-progress: false`, `queue: max` | `...-sqlite-global-v2`, `cancel-in-progress: false`, `queue: max` |

Exactly two group literals changed; both `cancel-in-progress: false` / `queue: max` pairs are
untouched; the per-ref supersession group is untouched. Nothing else moved in the file.

### The mechanism in the claim is wrong — the fix is right anyway

The header says a pre-#1846 branch arrival "brings `cancel-in-progress: true` with it" and plan.md
claims the culprit branches have "`cancel-in-progress: true` **present**". Both are **false**:

```
$ git show 6bb9c00f9^:.github/workflows/e2e-cli.yml | grep -n -A2 "concurrency:"   rc=0
  253:      group: e2e-scaffold-runtime-global
  254:      cancel-in-progress: false        <- #1846 only ADDED `queue: max`; `false` predates it
```

Direct inspection of the named culprit branches (rc=0 each):

| Branch | Tier groups |
| --- | --- |
| `origin/feat/aspire-13-5-s8-typed-resource-commands` | v1 literal, `cancel-in-progress: false`, `queue: max` **present** |
| `origin/test/aspire-13-5-s10-e2e-gate-upgrades` | v1 literal, `cancel-in-progress: false`, `queue: max` **present** |
| `origin/docs/aspire-13-5-s11-public-docs-refresh` | v1 literal, `cancel-in-progress: false`, no `queue: max` |
| `origin/fix/aspire-13-5-s9-skills-mcp-alignment` (run 33592084708's branch) | v1 literal, `cancel-in-progress: false`, no `queue: max` |

```
$ sweep of all 147 origin/* branches for tier-level `cancel-in-progress: true`
branches_scanned=147 tier_cancel_true_hits=0
```

**No branch in this repository carries `cancel-in-progress: true` on a tier group.** `cancel-in-progress:
false` has been on the tiers since #1185/#1220 — before every live branch's fork point.

### What actually cancelled #1889 (verified live via `gh api`)

Run `33592310517` (PR #1889), attempts 1–3, every runtime cancellation has `steps: 0` — pure
pending/admission eviction, zero mid-execution cancellations (rc=0 per call):

| Attempt | Job | started_at | conclusion | steps |
| --- | --- | --- | --- | --- |
| 1 | scaffold-runtime-sqlite | 04:50:48Z | cancelled @04:51:13Z | 0 |
| 1 | scaffold-runtime (docker) | 04:50:48Z | cancelled @04:54:51Z | 0 |
| 2 | scaffold-runtime-sqlite | 04:56:57Z | cancelled @04:58:36Z | 0 |
| 3 | scaffold-runtime-sqlite | 05:15:10Z | cancelled @05:17:04Z | 0 |
| 4 | scaffold-runtime-sqlite | 05:36:55Z | **failure** | 17 (real test failure, not a cancellation) |

Culprit run `33592084708` (`fix/aspire-13-5-s9-skills-mcp-alignment`, attempt 2): classify completed
`05:17:03Z`; its sqlite job started `05:17:23Z`. #1889's attempt-3 sqlite job was cancelled at
`05:17:04Z` — **one second after the culprit's classify emitted its vector, 19 s before the
culprit's job started**. That is the pre-existing header's own documented default: "the default
single pending entry, which replaces and cancels overflow." An unbounded v1 arrival displaced the
v2-pending entry in the shared v1 group. No `cancel-in-progress: true` anywhere; no mid-run
cancellation.

**Consequence:** the observed defect is real and the v2 keying fixes it — disjoint group names
cannot interact regardless of which `cancel-in-progress` the arriving run declares — but the
defect's stated mechanism (and the plan's evidence section) is misattributed. See F-1.

## Q2 — Does the added test have teeth?

`workflowJob()` (`.github/scripts/ci-classify-changes.test.ts:28`) slices a job by id up to the next
top-level job key, so each job's `concurrency` block is inside the slice under assertion. The suite
runs in five CI surfaces (ci.yml:132, e2e-cli.yml:149 self-check, pages.yml, surface-diff.yml,
fresh-ui-quality trigger paths), so the teeth are exercised on every PR touching the file.

```
$ deno test --allow-read --allow-env .github/scripts/ci-classify-changes.test.ts   (repo root, HEAD)
rc=0 | 60 passed | 0 failed
```

Adversarial experiments ran on a faithful mirror in `.llm/tmp/eval-1908/` (scratch, since removed):
test file + `ci-classify-changes.ts` + all four workflows the suite reads + `cli-surface.ts`,
executed with `deno test --no-config` from the scratch root (the root `deno.json` excludes `.llm`
— config-ful runs there exit 1 with "No test modules found", rc=1). Scratch baseline: rc=0,
60 passed. (One `cd` into the scratch dir leaked into a later call and was corrected; all final
evidence used absolute-path subshells.)

- **Experiment A — plain revert to v1** (both keys un-suffixed): **rc=1**, 1 failed,
  `workflow: sqlite runtime uses sibling diff guard and fails closed` → AssertionError at test line
  816 (the `-v2\n` positive no longer matches). Teeth confirmed.
- **Experiment B — adversarial revert**: v1 keys **plus** a commented
  `# group: e2e-scaffold-runtime-*-global-v2` line inside each job slice to satisfy the positives
  via substring. **rc=1**, 1 failed. The new `\n`-anchored negative assertions
  (`group: e2e-scaffold-runtime-sqlite-global\n` / `group: e2e-scaffold-runtime-global\n` must be
  absent) catch the bare v1 line. The prefix/comment hole is closed for a v1 revert.
- **Experiment C — residual probe**: real keys moved to fresh `-v3` with the commented v2 literals
  retained: **rc=0, 60 passed**. The positives are `includes`-based and satisfiable by a comment,
  so the test pins "v1 must be gone and v2 present" but does not pin "no third key". This is not a
  revert: a `-v3` key shares with neither v1 nor v2 and reintroduces no eviction. F-5, informational.

The `\n` anchoring itself matters and works: the pre-change positives
(`includes('group: e2e-scaffold-runtime-sqlite-global')`) were prefix-satisfied by the v2 line, so
they could not distinguish v1 from v2; the anchored positives plus the new negatives can.

## Q3 — Header operational claims

| Claim | Verdict |
| --- | --- |
| Label edit on a pre-#1846 branch is a full runtime dispatch | **Supported.** `on:` includes `labeled` (rc=0); any opt-in label event re-runs classify and the tiers on that branch's own copy. Corroborated by `c726220aa` (#1302 label-event churn) and run entry `3ff8ed9d4` ("label changes dispatch runtime on pre-#1846 branches"). |
| Cancel-and-redispatch is net-negative; the redispatch "can evict the job it was meant to save" | **Overstated post-fix** (F-4). Within v1 the clause holds (v1 redispatch displaces pending v1 entries); for the primary audience — saving a v2 job — a v1 redispatch cannot touch it, and the premise "to free the mutex" is void since a v1 run no longer holds the v2 mutex. Advice (don't cancel) stands; causal clause stale. |
| `ci:skip-e2e` jobs "never admitted and never claim a mutex" | **Overstated** (F-2). True only when the PR is not opted in (classify skipped → tier `if` false via `needs.classify.result != 'skipped'`, verified at e2e-cli.yml:115-121, 287, 374). For an opted-in PR carrying `ci:skip-e2e`, classify **runs and succeeds** (fail-closed policy), the job-level `if` is satisfied, and the tier jobs are admitted as seconds-long no-ops (skip is at step level via `env.RUN`). Harm is negligible under v2 + `queue: max` (they queue behind pending runs, no displacement), but the literal claim is false in the case that matters. |
| Merge `main` accepted, cherry-pick refused without PAT `workflow` scope | **Ambiguous; git-path reading contradicted by this repo's own evidence** (F-3). Recorded: routing drift 2026-08-30 "GitHub rejected the HTTPS push before updating the branch (`workflow` scope absent)" for a push containing `.github/workflows/**`; 1839 drift 2026-08-31 identical, `git push origin HEAD:refs/heads/...` exit 1; this run's own D-04. Those pushes included merges/republications of already-remote trees — refused on the git path. Acceptance holds only for GitHub-server-side merges (Update branch button, merge button, API connector). The header does not say which path it means. |

## Q4 — Transition trade-off statement

**Accurate.** Within a key generation the group is still a repo-wide literal, so at most one v2 job
runs per tier (and at most one v1 job among stale branches); repo-wide at-most-one returns only
when every live branch carries v2. Both tier jobs are `runs-on: ubuntu-latest`
(e2e-cli.yml:289, 376 — verified), as is every job in every workflow, so the transitional
one-v1-plus-one-v2 concurrency is two isolated hosted VMs: no host-resource collision is possible;
the cost is runner minutes/quota, not correctness. One soft caveat, not a defect: "live" is doing
real work — dormant-but-unmerged branches keep the doubling alive indefinitely; only deletion or
integration retires a generation.

## Q5 — Anything missed?

Full sweep of `group:` across `.github/workflows/` (rc=0) and `runs-on:` across all 13 workflows
(rc=0; every job `ubuntu-latest`, no self-hosted):

| Group | Keying | Exposure |
| --- | --- | --- |
| ci.yml:51, e2e-cli-prod.yml:19, e2e-cli-prod-local.yml:30 | ref-templated | Immune to cross-ref sharing. |
| openhands-agent.yml:137, openhands-phase-eval.yml:22 | per-PR/issue | Immune. |
| e2e-cli.yml:111 top-level | per-ref, `cancel-in-progress: true` | Intended supersession, disclosed (#1846 F-3). Unchanged. |
| pages.yml:50 — non-PR arm `pages-deploy` | **repo-wide literal**; `workflow_dispatch` present; `cancel-in-progress: false`, no `queue: max` | **Same defect class**: a dispatch from any branch's Actions tab joins the literal group with that branch's copy; with default single-pending admission it can displace a pending main deploy. Low probability/harm. Follow-up, does not block. |
| release-canary.yml:25 — `release-canary-${{ inputs... }}` | version-keyed literal, dispatch-only | Same class in principle for the same version dispatched cross-branch; maintainer-run. Follow-up. |

`--lock`-style shared resources: none found. `run-gate.ts` receipt paths are caller-supplied
(`--output`, `.llm/tools/entry.md:127`), not a fixed shared path; `fresh-ui-quality.yml`'s lock
reference is a lockfile-hygiene check, not a shared runtime resource.

## Findings

| # | Severity | Finding |
| --- | --- | --- |
| F-1 | MODERATE (doc/evidence accuracy; fix unaffected) | The stated mechanism — pre-#1846 arrivals bringing `cancel-in-progress: true` — is false: 147/147 origin branches carry `false` on the tier groups; #1846's diff only added `queue: max`; plan.md's evidence bullet ("all … `cancel-in-progress: true` present") is contradicted by every branch it names. The real mechanism is single-pending displacement by an unbounded v1 arrival (all four observed cancellations `steps: 0`; attempt-3 timing matches culprit admission to the second). The v2 keying fixes the real mechanism; the header/plan explanation and evidence should be corrected in a follow-up commit. |
| F-2 | LOW | Header `ci:skip-e2e` claim overstated: opted-in skip-labeled PRs admit the tier jobs as step-level no-ops, which do enter the concurrency group. Negligible harm under v2 + `queue: max`; wording should say "skip at policy level" not "never claim a mutex". |
| F-3 | LOW | Header merge-vs-cherry-pick claim ambiguous: on the git path, merging `main` and pushing is refused too (repo's own drift evidence shows workflow-modifying pushes refused even when republicating remote trees); only GitHub-server-side merges (Update branch / merge button / API) bypass the wall. Header should name the path. |
| F-4 | LOW | Header cancel-and-redispatch clause only holds within the v1 generation; a v1 redispatch cannot evict a v2 job. Advice stands; reasoning stale. |
| F-5 | INFO | Test residual: positives are `includes`-based and comment-satisfiable (Experiment C passes with a `-v3` key + commented v2 literal). Not a revert; no sharing reintroduced; the v1-vs-v2 invariant the PR needs is fully enforced. |
| F-6 | INFO (follow-up, non-blocking) | `pages-deploy` literal (pages.yml:50, reachable via `workflow_dispatch` from any branch) and `release-canary-*` share the same generation-defect class with no `queue: max`. |

## Verdict rationale

The functional change is exactly what it claims: two group literals versioned, nothing else moving,
policy keys untouched. The defect it fixes is real (live-verified pending displacement in the shared
group) and disjoint keys eliminate it under either candidate mechanism. The test has teeth against
plain and adversarial v1 reverts (Experiments A/B, rc=1 both). All defects found are documentation
accuracy and follow-up scope items; none undermines the change's correctness or its guard.

VERDICT: PASS
