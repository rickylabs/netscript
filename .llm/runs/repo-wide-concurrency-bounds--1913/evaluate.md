# Evaluation: bound remaining repo-wide concurrency groups (#1913)

Formal IMPL-EVAL. Evaluated head `a0aafb18dd4cc42ee484cb95880371f84b560866` against true merge
base `77ad823dc` (PR #1923, `Closes #1913`). Plan was PLAN-LOCKED at 2026-09-02T11:06:53Z
(`plan.md`; bootstrap slice `6f9a1de4f`); the prior local IMPL-EVAL supervisor packet
(11:52:08Z, `VERDICT: PASS_WITH_FINDINGS`) is recorded in the issue trail and was independently
re-verified here rather than trusted.

## Metadata

| Field          | Value |
| -------------- | ----- |
| Run ID         | `repo-wide-concurrency-bounds--1913` |
| Target         | `.github/workflows/pages.yml`, `.github/workflows/release-canary.yml` (concurrency `queue: max` on both remaining repo-wide literal groups) + parsed 13-workflow sweep test in `.llm/tools/release/release-canary-workflow_test.ts` |
| Archetype      | CI/release tooling surface; no package/plugin archetype touched (doctrine not triggered) |
| Evaluator      | OpenHands · `openrouter/z-ai/glm-5.3-flash` · run `33628586109-1` · 2026-09-02. Reasoning effort **not attested** — the OpenHands adapter does not expose effort identity; no effort claim is made. |
| Independence   | Separate session from the generator (Codex · GPT-5.6, per supervisor packet) and from the prior local Fable 5.1 evaluator. |
| Output contract| Verdict also written to `OPENHANDS_SUMMARY_PATH` (`/home/runner/work/_temp/openhands/33628586109-1/summary.md`) as its first line. |

## Acceptance criteria (plan §Definition of Done) — verified

| # | Criterion | Result | Evidence (independently re-derived, not re-stated) |
| - | --------- | ------ | -------------------------------------------------- |
| 1 | Both authorized groups retain justified keying and carry `queue: max` | **PASS** | Parsed read-back (PyYAML): `pages.yml` top-level `concurrency: {group: pages-${{ … 'pull_request' … 'deploy' }}, cancel-in-progress: false, queue: max}`; `release-canary.yml` top-level `concurrency: {group: release-canary-${{ inputs.republish-version \|\| inputs.target-version }}, cancel-in-progress: false, queue: max}`. Justification headers present in both diffs (`pages.yml` +14, `release-canary.yml` +13 lines, all comments + the one `queue: max` line each). Keying decisions evaluated on their merits and upheld: a Pages site is one global publication resource (ref-templating would trade eviction for concurrent deploys); one immutable registry version is a global entity (a generation suffix would split the correctness mutex). |
| 2 | Queue-eviction evidence is genuine (not fabricated) | **PASS** | Live GitHub API cross-examination of the three-run trio: run 33624345836 (feature branch) `deploy` job 100228804476 = failure with **0 executed steps** and deployment 6221263357 status history `waiting -> failure`; run 33624383095 (main) `build`/`deploy` cancelled with 0 steps; run 33624408650 admitted **0 jobs** (empty jobs array — third arrival evicted while pending). Deployment 6221041984 (main, sha 634b83d64) = success 11:11:52Z, retiring the packet's "no successful deploy on this head" concern; all post-merge main deployments (ec848e6b0, 97eace32d, 37452f11f) succeed. |
| 3 | Parsed sweep enumerates all 13 workflows and every top-level/job-level block | **PASS** | Independent PyYAML sweep: 13 workflow files, 10 concurrency blocks across 8 workflows, 5 with none, 0 unbounded repo-wide literals — matches plan census exactly, including the job-level `scaffold-runtime`/`scaffold-runtime-sqlite` blocks in `e2e-cli.yml` that a top-level-only scan misses. Encoded as regression invariant (test 2), proven fail-closed by scratch mutation (`queue: max` -> `queue: 2` flips test 2 to `not ok`; file restored byte-identical). |
| 4 | Focused test, check, format, YAML parse gates pass with real exit codes | **PASS** | Evaluator reruns at head: `deno test --reporter=tap --allow-all .llm/tools/release/release-canary-workflow_test.ts` = 6 passed / 0 failed (REAL_EXIT=0); `deno check` on the test file = exit 0. Sandbox note: the same test run through `.llm/tools/run-deno-test.ts` reports 5/6 because `LD_LIBRARY_PATH` triggers a subprocess `NotCapable` in `verify-canary-pair.ts` — environmental, not code; passes with `env -u LD_LIBRARY_PATH`. Hosted CI gates on this head were green per the run trail. |

## Process verification

| Check | Result | Evidence |
| ----- | ------ | -------- |
| Approved plan exists and matches changed state | PASS | `plan.md` (PLAN-LOCKED) prescribes exactly the two `queue: max` additions plus the sweep test; `git diff --name-only 77ad823dc..a0aafb18d` shows exactly `pages.yml`, `release-canary.yml`, the sweep test, and 7 tracked run artifacts. No scope creep. |
| Plan-eval record present | PASS | PLAN verdict LOCKED at 2026-09-02T11:06:53Z (issue trail + `plan.md`); no `PLAN-EVAL: N/A` claim. |
| Separate-session evaluator | PASS | This session is an OpenHands GLM 5.3 Flash cloud run, distinct from the Codex generator and the prior local Fable evaluator. |
| Lock hygiene | PASS | `deno.lock` absent from the PR diff; no lock mutation in this session; scratch probes restored. |
| Public surface | PASS | No `packages/` or `plugins/` file changed; workflow + internal test tooling only. |
| False-done scan | PASS (one bookkeeping finding) | Definition-of-Done boxes in the PR body are all checked and each is backed by verifiable evidence; the slice checkboxes S1–S3 are unchecked despite completed, verified work — bookkeeping drift only (Finding F1). |
| Review threads | PASS | 0 open review comments/threads on PR #1923 (API). |
| Debt registry | PASS | No debt entry required; no new unbounded concurrency surface remains (sweep = 0 unbounded literals). Stale-branch caveat is documented in the `pages.yml` header itself and is inherent GitHub semantics, not repo debt. |

## Findings (severity-ranked)

- **F1 [minor, non-blocking]** — PR-body slice checkboxes S1–S3 are unchecked while the
  Definition-of-Done boxes are checked and independently verified. Required action: tick S1–S3 at
  merge time (maintainer/supervisor bookkeeping). Not verdict-affecting.
- **F2 [info]** — Evaluator-transport note: `LD_LIBRARY_PATH` in this sandbox makes one focused
  test fail only through the run-deno-test wrapper (subprocess `NotCapable`); it passes unset.
  Recorded so future evaluator runs do not misread it as a regression.
- **F3 [info]** — `queue: max` guarantees apply only to arrivals carrying this workflow revision;
  stale branch copies retain their older queue policy until they converge. Documented in
  `pages.yml` header; accepted as inherent semantics.

## Verdict

All four acceptance boxes pass with genuine, independently re-derived evidence; no false-done
state blocks merge; lock, surface, and review-thread gates are clean. Findings F1–F3 are
non-blocking.

OPENHANDS_VERDICT: PASS
