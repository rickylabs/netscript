OPENHANDS_VERDICT: PASS

# IMPL-EVAL - repo-wide-concurrency-bounds--1913 (PR #1923)

## Summary

Independent IMPL-EVAL (separate session from the generator) for PR #1923, closing issue #1913:
bound the two remaining repo-wide GitHub Actions concurrency groups (`pages-deploy` and
`release-canary`) with `queue: max` while preserving their justified keying. Evaluated head
`a0aafb18dd4cc42ee484cb95880371f84b560866` against approved, PLAN-LOCKED plan
(`.llm/runs/repo-wide-concurrency-bounds--1913/plan.md`, PLAN verdict LOCKED 2026-09-02T11:06:53Z,
bootstrap slice `6f9a1de4f`). All four acceptance boxes verified PASS with genuine evidence -
including live GitHub API cross-examination of the three-run queue-eviction probe - not just
claimed. Verdict: **PASS**.

Reasoning-effort attestation: the OpenHands adapter does not expose effort identity; this run makes
no effort claim (per `.agents/skills/openhands-handoff/SKILL.md` and AGENTS.md).

## Changes

None. Evaluator session is read-only by contract: no source edits, no commits, no pushes, no lock
mutation. Scratch probes (sed mutation of pages.yml) were restored byte-for-byte;
git status --porcelain is clean.

## Validation performed (independent re-derivation, not re-statement)

- **Focused test gate** - `deno test --allow-all .llm/tools/release/release-canary-workflow_test.ts`
  with TAP reporter: **6 passed / 0 failed** (REAL_EXIT=0). Test 2 is the new class-closing
  invariant ("all workflow concurrency mappings are classified and repo-wide literals are bounded").
  Initial run through `.llm/tools/run-deno-test.ts` showed 5/6 with a sandbox-only failure
  (`LD_LIBRARY_PATH` subprocess-spawn `NotCapable` in verify-canary-pair.ts) - environmental, not a
  code defect; passes with `env -u LD_LIBRARY_PATH`.
- **Type gate** - `deno check` on the test file: exit 0.
- **Independent parsed sweep** (PyYAML, separate implementation from the Deno test): 13 workflow
  files, 10 concurrency blocks across 8 workflows (5 workflows with none), **0 unbounded
  repo-wide literal groups** - matches the plan's 13/10/5 census exactly, including both
  job-level blocks in `e2e-cli.yml` that a top-level-only scan would miss.
- **Mutation (fail-closed) proof** - scratch edit `queue: max` -> `queue: 2` in `pages.yml` flips
  test 2 to `not ok` (TAP-verified); restored byte-identical afterwards.
- **Byte-level mapping read-back** - `pages.yml`: `group: pages-${{ ... pull_request ... 'deploy' }}`,
  `cancel-in-progress: false`, `queue: max`; `release-canary.yml`:
  `group: release-canary-${{ inputs.republish-version || inputs.target-version }}`,
  `cancel-in-progress: false`, `queue: max`. Triggers confirmed via parsed YAML (PyYAML parses
  `on:` as `True`): `pages.yml` carries `push: main`, `release: [published]`, `workflow_dispatch`
  - the corrected exposure premise; `release-canary.yml` is `workflow_dispatch` with the two
  documented inputs.
- **Acceptance box 2 (queue-eviction evidence) - live API cross-examination.** All claims in
  `.llm/runs/.../evidence.md` confirmed against the GitHub REST API, run by run:
  - Run 33624345836 (feature branch, dispatched 11:23:31Z): `classify` + `build` success; `deploy`
    job 100228804476 conclusion **failure** with **zero executed steps** -> created
    deployment 6221263357 (sha c0c3fd25c, 11:24:45Z) with status history **waiting -> failure** -
    genuine pending-victim eviction, not mid-execution cancellation.
  - Run 33624383095 (main, 11:23:56Z): `build` cancelled (step 1 only), `deploy` cancelled with
    **zero steps**, whole-run conclusion **cancelled**.
  - Run 33624408650 (feature branch, 11:24:17Z): **0 jobs admitted** (jobs array empty) - the
    third arrival was evicted while pending, matching `cancel-in-progress: false` + no-queue
    semantics.
  - Deployment 6221041984 (sha 634b83d64, main): **success 11:11:52Z** - confirms the packet's
    acknowledged safety concern ("no successful deploy on this head before the packet") was
    transient and later resolved.
  - Post-merge main deployments (sha ec848e6b0, 97eace32d, 37452f11f) all conclude **success** -
    the Pages pipeline is healthy at the evaluated configuration.
- **True-base diff census** - `git diff --name-only 77ad823dc..a0aafb18d`: exactly
  `pages.yml`, `release-canary.yml`, the sweep test, and 7 tracked run artifacts.
  `.github/scripts/ci-classify-changes.test.ts` exists and is **unchanged** at the true base
  (earlier DIFF_EXIT=128 came from invalid probe refs `e457c23a2`/`15df8010a`, which are blobs,
  not commits - `git cat-file -t` proves it).
- **Repo hygiene** - `deno.lock` not in the PR diff (lock hygiene rule upheld); labels include
  `status:impl-eval` + `type:bug`/`area:tooling`/`priority:p3`, milestone `0.0.7`; **zero open
  review threads** on the PR.

## Findings (severity-ranked)

1. **[minor, non-blocking] PR-body slice checkboxes S1-S3 remain unchecked** while the
   Definition-of-Done boxes are all checked with real evidence. The DoD evidence for S1/S2/S3 is
   independently verified by this session, so this is bookkeeping drift in the checkbox set only.
   Recommended action: maintainer/supervisor ticks S1-S3 at merge time. Not verdict-affecting.
2. **[info] Evaluator-transport note** - one focused test fails in this sandbox when spawned via
   the run-deno-test wrapper because `LD_LIBRARY_PATH` is set and `verify-canary-pair.ts` needs
   subprocess rights; it passes with the variable unset. Recorded so future evaluator runs do not
   misread it as a code regression.
3. **[info] Stale-branch queue caveat** - the `queue: max` guarantee applies only to arrivals
   carrying this workflow revision; dispatches from stale branches can still displace a pending
   entry until branch copies converge. This is documented in the `pages.yml` header itself and
   correctly not treated as debt (it is inherent GitHub semantics, and the mutex is per-ref for
   old copies).

## Responses to review comments

No review comments or threads exist on PR #1923 (API count: 0); nothing to answer.

## Remaining risks

- Acceptance box 2's evidence is a one-time hosted demonstration (workflow_dispatch trio), which
  is the correct and sufficient proof for GitHub's documented eviction behavior; no ongoing test
  can pin hosted queue behavior, so the parsed sweep invariant (test 2) is the durable regression
  guard - verified fail-closed.
- The queue bound does not cap concurrency at a small integer; `max` serializes fully, which is
  the intended policy for a single global site and an immutable-version publish. This is the plan
  decision D1-D3 and is upheld.
