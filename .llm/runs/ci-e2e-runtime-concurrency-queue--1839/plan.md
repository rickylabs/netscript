# Plan: preserve every eligible e2e-cli runtime arrival

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `ci-e2e-runtime-concurrency-queue--1839` |
| Branch | `ci/e2e-runtime-concurrency-queue` |
| Phase | `plan` |
| Target | `.github/workflows/e2e-cli.yml` |
| Archetype | N/A — CI workflow infrastructure, not package/plugin code |
| Scope overlays | none |

## Archetype

N/A. The archetype matrix governs package/plugin surfaces; this slice changes only GitHub Actions
admission semantics and its harness evidence.

## Current Doctrine Verdict

N/A for workflow-only infrastructure. No `packages/**` or `plugins/**` surface changes.

## Goal

Keep the docker and sqlite runtime tiers independently serialized across the repository while
allowing at least three eligible arrivals to remain pending and execute without any head update.

## Scope

- Add GitHub's native multi-entry queue to both existing runtime-tier concurrency groups.
- Document the bounded queue and its run-list semantics beside the workflow cost/selection policy.
- Prove the general `queue: max` scheduler behavior with a no-op scratch workflow on throwaway
  branches and timestamp assertions.
- After explicit owner release, prove exact issue acceptance with three `e2e-cli-gate` PRs executing
  both runtime tiers; preserve their run IDs, job conclusions, head SHAs, and timing evidence.

## Non-Scope

- No real `scaffold.runtime` or `scaffold.runtime.sqlite` execution before the owner confirms the
  Aspire queue has drained. Exact acceptance is deferred, not waived.
- No other workflow concurrency cleanup.
- No package, plugin, agentic runtime, or `deno.lock` edits.
- No ready-for-review transition or IMPL-EVAL; the owner retains those actions.

## Hidden Scope

- The scratch proof must avoid the production workflow's per-ref top-level cancellation and must
  create independent arrivals that share only the simulated job-level group.
- Evidence must distinguish waiting from cancellation and show automatic admission on unchanged
  head SHAs.

## Locked Decisions

| ID | Decision | Rationale |
| -- | -------- | --------- |
| D1 | Retain both existing global group keys and `cancel-in-progress: false`. | Preserves independent repo-wide serialization for docker and sqlite. |
| D2 | Add `queue: max` to each runtime job. | Native GitHub policy queues up to 100 pending jobs instead of replacing the one pending job. |
| D3 | Do not add a polling action, custom lock, redispatch, or empty production commit. | Native admission is race-safe, needs no runner-held polling loop, and never moves the PR head. |
| D4 | Simulate with a separate no-op workflow on three or more throwaway branches. | Exercises the concurrency primitive without consuming runtime resources; it does not satisfy the exact runtime acceptance. |
| D5 | Defer the three-PR/two-tier acceptance proof until explicit owner release. | The audit ruling requires real tier conclusions, while the current Aspire lane must not be disturbed. |

## Open-Decision Sweep

| Decision | Status | Notes |
| -------- | ------ | ----- |
| Queue mechanism | resolved now | Native `queue: max` selected. |
| Queue capacity beyond 100 pending jobs | safe to defer | GitHub's maximum is 100; acceptance requires three or more and the practical lane is far below the bound. |
| Broader workflow audit | safe to defer | Explicitly out of scope; report any same-shape findings without edits. |

## Risk Register

| Risk | Mitigation |
| ---- | ---------- |
| YAML key is accepted but behavior differs from documentation | Run live no-op simulation and assert timestamps, conclusions, and unchanged heads. |
| Scratch proof accidentally invokes costly runtime work | Use a standalone no-op workflow with only timestamp and bounded sleep steps. |
| Simulation runs overlap because the group is not shared | Give all scratch branches the same literal group and assert interval non-overlap. |
| Run metadata is mistaken for production runtime evidence | Name and document every run as simulation; do not apply runtime opt-in labels. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| -- | ------ | ---- |
| N/A | workflow-only | Avoid custom queue/lock reinvention because GitHub now exposes the required primitive. |

## Fitness Gates

| Gate | Required | Expected evidence |
| ---- | -------- | ----------------- |
| Workflow syntax/shape | yes | Repository workflow validation or a YAML-aware focused check |
| General queue-mechanism simulation | yes | At least three successful no-op runs with non-overlapping job timestamps; not an exact acceptance verdict |
| Exact runtime acceptance | deferred | Three `e2e-cli-gate` PRs each execute both runtime tiers after owner release |
| Exact head immutability | deferred | Each of those three PR heads remains unchanged through actual-tier admission |
| Scope/lock hygiene | yes | Only the workflow and run dir changed; `deno.lock` SHA-256 unchanged |

## Arch-Debt Implications

| Entry | Action | Notes |
| ----- | ------ | ----- |
| none | none | No doctrine debt created or closed. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| ----- | ---- | ---------------- | --------------- |
| 1 | Focused diff | `git diff --check` and inspect owned paths | Exit 0; no out-of-scope changes |
| 2 | Workflow static validation | Discover and run the repository's focused workflow/YAML check | Exit 0 |
| 3 | Simulated queue | Push a trivial scratch workflow from at least three throwaway branches | All jobs conclude success, none conclude cancelled |
| 4 | Timestamp assertion | Query simulation job `started_at`/`completed_at` values | Serialized intervals do not overlap |
| 5 | Head immutability | Compare each run's recorded `head_sha` before/after waiting | No run needs another push to enter |
| 6 | Lock hygiene | Compare `sha256sum deno.lock` with baseline | `edfa0c24...1820c` unchanged |
| 7 | Exact runtime proof | Follow `exact-runtime-proof-procedure.md` only after owner release | All five issue boxes receive actual-run evidence |

## Dependencies

- GitHub Actions native concurrency queue support (`queue: max`).
- GitHub Actions API for simulation run/job timestamps.

## Drift Watch

- Record any rejection of `queue: max`, unexpected cancellation, timestamp overlap, or need to
  broaden permissions/scope before changing the mechanism.
