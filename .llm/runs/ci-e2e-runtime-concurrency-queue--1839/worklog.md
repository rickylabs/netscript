# Worklog: e2e-cli runtime concurrency queue

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `ci-e2e-runtime-concurrency-queue--1839` |
| Branch | `ci/e2e-runtime-concurrency-queue` |
| Archetype | N/A — CI workflow infrastructure |
| Scope overlays | none |

## Design

### Public Surface

- `.github/workflows/e2e-cli.yml` — repository CI admission policy for both runtime tiers.

### Domain Vocabulary

- `concurrency group` — one repository-wide execution lane per runtime tier.
- `queue: max` — GitHub-native bounded queue retaining up to 100 pending entries.
- `deferred job` — a pending job that keeps its workflow run and triggering head SHA until admitted.

### Ports

- GitHub Actions concurrency scheduler — supplies serialization and deferred admission.
- GitHub Actions run/job API — supplies conclusions and timestamp evidence.

### Constants

- `e2e-scaffold-runtime-global` — docker/postgres runtime lane.
- `e2e-scaffold-runtime-sqlite-global` — sqlite/garnet runtime lane.

### Commit Slices

| # | Slice | Gate | Files |
| - | ----- | ---- | ----- |
| 0 | Activate the harness with current research, locked design, and `PLAN-EVAL: N/A` | baseline/path review | `.llm/runs/ci-e2e-runtime-concurrency-queue--1839/**` |
| 1 | Retain all eligible runtime arrivals with native bounded queues and document the mechanism | static workflow check + 3-or-more-run timestamp simulation | `.github/workflows/e2e-cli.yml`, run evidence |

### Deferred Scope

- Queue settings in other workflows — explicitly excluded by the owner.
- Runtime-tier functional execution — owner requires simulated acceptance to avoid resource contention.
- IMPL-EVAL and ready transition — owner-controlled after this handoff.

### Contributor Path

Future maintainers start at the `e2e-cli.yml` header's queue policy, then inspect the two runtime
jobs' matching concurrency blocks. Queue behavior changes must preserve distinct tier groups and be
proven with no-op timestamp simulation before real runtime use.

## Plan Gate

- `PLAN-EVAL: N/A` recorded before implementation. This is a small workflow-policy fix whose issue
  body supplies the complete contract, scope, acceptance criteria, and evidence constraints; current
  GitHub documentation supplies a direct native setting with no remaining architecture decision.

## Progress Log

| Time | Slice | Step | Notes |
| ---- | ----- | ---- | ----- |
| 2026-08-31T16:26:05Z | 0 | Bootstrap | Baseline exact; research and design locked before workflow implementation. |

## Decisions

| Decision | Reason | Source |
| -------- | ------ | ------ |
| Use `queue: max` on both job groups | Directly converts replace-one-pending semantics into a bounded native queue while retaining serialization | GitHub docs + issue #1839 |
| Use scratch no-op branches | Proves live scheduler behavior without entering either scarce runtime tier | owner acceptance constraint |

## Drift

| Drift | Severity | Logged in drift.md |
| ----- | -------- | ------------------ |
| Documented `rtk` binary is not present on this host | minor | yes |
| Owner retains IMPL-EVAL and ready/label transitions | minor | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| ---- | ---------------- | ------ | ----- |
| Baseline | compare `HEAD`, `main`, requested SHA | PASS | All resolved to `6c195acaf...`. |
| Workflow validation | pending | NOT_RUN | Run after implementation. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| Package/plugin fitness | N/A | workflow-only scope | No framework source touched. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| Real runtime E2E | N/A | owner prohibition | Must not consume runtime slots for this slice. |
| No-op concurrency simulation | NOT_RUN | pending | Requires at least three live scratch runs. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| -------- | ------ | -------- | ----- |
| GitHub Actions scheduler | NOT_RUN | pending simulation | Native queue behavior is the consumer contract. |

## Handoff Notes

- Owner review should inspect the two concurrency blocks, the header policy, and the timestamp table.
- This implementation session does not issue an IMPL-EVAL verdict.
