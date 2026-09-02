# Worklog — #1913 repo-wide concurrency bounds

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `repo-wide-concurrency-bounds--1913` |
| Branch | `ci/repo-wide-concurrency-bounds` |
| Archetype | N/A — workflow infrastructure |
| Scope overlays | none |

## Design

### Public Surface

- The two GitHub Actions concurrency mappings are the executable public contract.
- The parsed sweep test is the regression contract for every workflow concurrency block.

### Domain Vocabulary

- **running entry** — protected by `cancel-in-progress: false`.
- **pending entry** — the default single waiting slot that a third arrival replaces.
- **queue eviction** — a `cancelled` job with zero executed steps.
- **repo-wide literal** — a group shared across refs, wholly or on one expression arm.
- **entity-keyed** — a group serialized by PR/issue/version identity.
- **queue bound** — explicit `queue: max`, retaining admitted arrivals for serial execution.

### Ports

- GitHub Actions workflow concurrency is the only external behavior; no local abstraction is added.
- GitHub's Actions REST API supplies immutable run/job/step evidence for any hosted exercise.

### Constants

| Resource | Group contract | Bound |
| --- | --- | --- |
| Pages site | `pages-${{ github.event_name == 'pull_request' && github.ref || 'deploy' }}` | `queue: max` on the non-PR literal arm |
| Canary version | `release-canary-${{ inputs.republish-version || inputs.target-version }}` | `queue: max` |

### Commit Slices

| # | Slice | Gate | Files |
| --- | --- | --- | --- |
| 0 | Bootstrap research, locked plan, design, and draft review surface | plan-gate checklist / PLAN-EVAL N/A | this run directory |
| 1 | Bound and explain both global groups | parsed YAML readback | `pages.yml`, `release-canary.yml`, this run directory |
| 2 | Close the class with exhaustive parsed sweep assertions | focused test + check + fmt | `release-canary-workflow_test.ts`, this run directory |
| 3 | Capture hosted or honestly blocked acceptance evidence and final gate exits | API job/step evidence + scope audit | this run directory |

### Deferred Scope

- Changes to any other workflow, especially `e2e-cli.yml`, remain with their owning issues.
- IMPL-EVAL, ready-for-review, merge, and issue closure remain with the topic supervisor.

### Contributor Path

Start at either workflow's queue-policy header, then read its adjacent `concurrency` mapping. Run
the release workflow test to see the full 13-workflow inventory and the class invariant.

## Progress Log

| Time (UTC) | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-09-02 11:01 | 0 | re-baseline | Clean branch at the required base; corrected issue #1913 after measuring ordinary main traffic. |
| 2026-09-02 11:05 | 0 | decisions locked | Both groups retain global/entity mutexes and receive `queue: max`; canary key remains generation-neutral. |
| 2026-09-02 11:08 | 1 | implementation | Added both bounds and headers preserving the running-vs-pending and `steps: 0` diagnostic. |
| 2026-09-02 11:26 | 2 | regression fix | Corrected the classifier precedence so the mixed OpenHands entity/ref key reaches its specific class; parsed reality remains 13 workflows and 10 blocks. |
| 2026-09-02 11:29 | 2 | gates | Focused test 6/6, `.llm/tools` check, format, and independent YAML readback all passed with exit 0. |

## Reconcile — slice 1

- Issue #1913 remains open at `status:plan`; PR #1923 is draft at `status:impl`, milestone `0.0.7`,
  and carries `Closes #1913`.
- No new issue or PR comments changed the locked plan.
- The executable edits remain limited to the two authorized workflow concurrency mappings.

## Reconcile — slice 2

- The parsed fixture matches all 10 mappings across all 13 workflow files, including the two
  job-level runtime groups. The brief's count was correct; no hidden additional block was found.
- The class invariant rejects any repo-wide literal arm without `queue: max`.
- PR #1923 remains draft at `status:impl`; no lifecycle transition was made.

## Gate Results

### Slice 1

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| Parsed YAML readback | `deno eval --no-lock` with cached `npm:js-yaml@4.3.2`, both edited workflows | PASS, exit 0 | Both parsed concurrency objects retain their exact group and `cancel-in-progress: false`, with `queue: max`. No lock change. |

### Slice 2 final-head gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| Focused regression | `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all .llm/tools/release/release-canary-workflow_test.ts` | PASS, exit 0 | 6 passed, 0 failed. |
| Type check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root .llm/tools --ext ts` | PASS, exit 0 | 342 files, 3 batches, 0 failed batches/occurrences. |
| Format | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root .llm/tools --ext ts` | PASS, exit 0 | 342 files, 2 batches, 0 failed batches/findings. |
| Parsed YAML readback | `deno eval --no-lock` with `npm:js-yaml@4.3.2` | PASS, exit 0 | Exact Pages and canary concurrency objects read from parsed documents. |
| Whitespace | `git diff --check 77ad823dcb1874ccfc8964b4679ad92a3a145e0b` | PASS, exit 0 | Base-to-head diff clean after removing three bootstrap trailing blank lines. |

## Handoff Notes

- Evaluator should first inspect exact scope, the 10-row sweep, and whether acceptance box 2 has
  genuine pending-victim evidence rather than a weaker completed-run comparison.
