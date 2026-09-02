# Plan — #1913 bound remaining repo-wide concurrency groups

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `repo-wide-concurrency-bounds--1913` |
| Branch | `ci/repo-wide-concurrency-bounds` |
| Phase | `plan` |
| Target | GitHub Actions workflow infrastructure |
| Archetype | N/A — no package/plugin product surface |
| Scope overlays | none |

## Goal

Prevent pending displacement in the remaining repo-wide workflow groups while preserving the
correct global mutex for Pages publication and per-version canary publication.

## Scope

- Add explanatory queue-policy headers and `queue: max` to `pages.yml` and
  `release-canary.yml`.
- Extend `release-canary-workflow_test.ts` with parsed structural assertions for the canary group
  and an exhaustive 13-workflow concurrency sweep, including job-level blocks.
- Capture structural and, only if safely constructible, live scheduler evidence.

## Non-Scope

- No change to `e2e-cli.yml`, `ci.yml`, dependencies, lock files, packages, plugins, or any run
  directory outside this slice.
- No real Pages deployment, release publication, merge, ready-for-review transition, or issue
  closure.
- No `deno task e2e:cli`; GitHub admission, not scaffold runtime, is the behavior under test.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Keep `pages-deploy`; add `queue: max`. | One Pages site is a global publication resource. Retention is safer than nondeterministic cross-ref deployment or pending eviction. |
| D2 | Keep `release-canary-<version>` branch-agnostic; add `queue: max`. | One immutable registry version is the entity. Sequential auditable outcomes are safer than silent replacement. |
| D3 | Do not generation-suffix the canary key. | Splitting generations would permit concurrent publication of the same immutable version. Unlike isolated hosted runtime jobs, this is a correctness mutex. |
| D4 | Put the sweep in the existing release workflow test. | It already owns the canary workflow contract; using one authorized TypeScript file avoids a new test entry point and keeps all concurrency closure assertions together. |
| D5 | Parse mapping structure before asserting blocks. | Text grep misses job-level blocks and cannot prove `group`, `cancel-in-progress`, and `queue` belong to the same mapping. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Queue policy for Pages | resolved now | D1 |
| Queue policy for canary | resolved now | D2 |
| Canary generation marker | resolved now | D3 |
| Safe live Pages demonstration | must resolve now for acceptance box 2 | Stop and report if a pending main victim cannot be produced without publication or foreign contention. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| A fake sweep overlooks nested concurrency. | Enumerate all 13 parsed documents and compare all 10 expected top-level/job-level blocks exactly. |
| Queueing canary retries causes redundant later work. | Existing publish guards fail closed; preserve the more important no-silent-eviction and one-version-at-a-time properties. |
| Pages live proof accidentally deploys. | Read and exploit only the classifier/build gating; cancel before deployment, or stop without ticking acceptance. |
| A stale branch carries old workflow semantics. | Dispatch from this branch so the arriving run uses the fixed queue policy; record refs and immutable run/job IDs. |
| Workflow syntax is invalid. | Parse edited workflows and read concurrency back from parsed mappings; GitHub-hosted run creation is additional evidence if available. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | Focused tests | requested structured test wrapper over `release-canary-workflow_test.ts` | exit 0 |
| 2 | Type check | requested `.llm/tools` check wrapper | exit 0 |
| 3 | Format | requested `.llm/tools` format wrapper | exit 0 |
| 4 | YAML structure | parse both edited workflows and read concurrency mappings | exit 0; exact values |
| 5 | Scope/whitespace | `git diff --check` and authorized-path audit | exit 0 |
| 6 | Hosted acceptance | fixed-branch dispatch vs pending default-branch Pages run | only PASS with run IDs and per-job conclusions/step counts |

## PLAN-EVAL

N/A. The issue and implementation brief provide an exact authorized surface, mechanism, acceptance
criteria, non-scope, and required gates. All per-group trade-offs and the generation-key decision
are resolved above before implementation; no architecture or sequencing decision remains open.

