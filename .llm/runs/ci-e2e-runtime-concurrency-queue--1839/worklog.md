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
| 1 | Retain all eligible runtime arrivals with native bounded queues and document the mechanism | static workflow check + general queue-mechanism simulation | `.github/workflows/e2e-cli.yml`, run evidence |

### Deferred Scope

- Queue settings in other workflows — explicitly excluded by the owner.
- Exact three-arrival runtime proof — deferred until the owner confirms the Aspire runtime queue has
  drained. The standalone simulation is not a substitute for three `e2e-cli-gate` PRs executing
  both modified runtime tiers.
- IMPL-EVAL and ready transition — owner-controlled after this handoff.

### Contributor Path

Future maintainers start at the `e2e-cli.yml` header's queue policy, then inspect the two runtime
jobs' matching concurrency blocks. Queue behavior changes must preserve distinct tier groups. A
no-op timestamp simulation can prove the scheduler primitive generally, but acceptance for these
jobs requires timestamp evidence from the actual runtime tiers.

## Plan Gate

- `PLAN-EVAL: N/A` recorded before implementation. This is a small workflow-policy fix whose issue
  body supplies the complete contract, scope, acceptance criteria, and evidence constraints; current
  GitHub documentation supplies a direct native setting with no remaining architecture decision.

## Progress Log

| Time | Slice | Step | Notes |
| ---- | ----- | ---- | ----- |
| 2026-08-31T16:26:05Z | 0 | Bootstrap | Baseline exact; research and design locked before workflow implementation. |
| 2026-08-31T16:30:43Z | 0 | Draft PR | Opened draft PR #1846 from bootstrap commit; applied final taxonomy labels once and milestone 0.0.7. |
| 2026-08-31T16:33:00Z | 1 | Implement | Added `queue: max` to both existing tier groups and documented native deferral in the header. |
| 2026-08-31T16:34:37Z | 1 | Simulate | Created three no-op arrivals on independent throwaway branches within 2 seconds. |
| 2026-08-31T16:34:41Z | 1 | Observe queue | One run was in progress while two were simultaneously pending; none was cancelled. |
| 2026-08-31T16:36:48Z | 1 | Gate | All three runs succeeded; timestamp assertion reported zero overlap and exit 0. |
| 2026-08-31T16:37:00Z | 1 | Reconcile | #1839 remains open at milestone 0.0.7; PR #1846 carries `Closes #1839`, one `status:impl`, and no external review findings. |
| 2026-08-31T16:43:00Z | 1 | Push fallback | HTTPS explicit-refspec push failed (exit 1: PAT lacks `workflow`); SSH preflight failed (exit 128). Connector wrote the identical workflow as `e74f8bdc6`; evidence rebase succeeded (exit 0). |
| 2026-09-01T05:50:48Z | 1 | Audit correction | Relabelled the no-op evidence as a general scheduler-mechanism simulation. Issue acceptance boxes 1, 2, 3, and 5 remain deferred pending the owner-released exact three-arrival runtime proof. |
| 2026-09-01T05:50:48Z | 1 | Prepare | Wrote the exact proof procedure and classifier-checked its inert marker path (exit 0) without opening PRs, changing labels/readiness, or consuming runtime slots. |

## Decisions

| Decision | Reason | Source |
| -------- | ------ | ------ |
| Use `queue: max` on both job groups | Directly converts replace-one-pending semantics into a bounded native queue while retaining serialization | GitHub docs + issue #1839 |
| Use scratch no-op branches | Proves the live `queue: max` scheduler primitive generally without entering either scarce runtime tier; it does not prove issue acceptance box 1 | owner constraint + audit ruling |

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
| Diff whitespace | `git diff --check` | PASS (exit 0) | Workflow and run-artifact diff. |
| Runtime queue shape | focused Deno assertion over both concurrency blocks | PASS (exit 0) | Exactly two `queue: max` settings, each adjacent to the expected group and `cancel-in-progress: false`. |
| YAML parser probe | Ruby `YAML.load_file` | NOT_RUN (exit 127) | Ruby is unavailable; not counted as evidence. GitHub accepted and executed the same scratch concurrency syntax. |
| GitHub workflow parse | scratch workflow scheduling/execution | PASS | All three live workflows scheduled and ran, proving `queue: max` is accepted by GitHub Actions. |
| Scope hygiene | base diff + `deno.lock` byte diff | PASS (exits 0/0) | Only `e2e-cli.yml` plus this run directory changed; lock SHA-256 remains `edfa0c24...1820c`. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| Package/plugin fitness | N/A | workflow-only scope | No framework source touched. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| Exact three-PR runtime proof | DEFERRED | `exact-runtime-proof-procedure.md` | Must wait for owner release after the Aspire queue drains; no real runtime slot has been consumed for this proof. |
| General no-op queue simulation | PASS (exit 0) | `simulation-evidence.md`; runs 33414867389, 33414868688, 33414870475 | Establishes generic `queue: max` retention and serial admission only; it did not exercise `e2e-cli.yml` or either runtime tier. |
| Simulated-group serialization | PASS (exit 0) | API `started_at`/`completed_at` assertion | The standalone simulated group had intervals 16:34:40–16:35:13, 16:35:16–16:35:49, 16:35:52–16:36:27 and zero overlap. Actual per-tier serialization remains deferred. |
| Simulated-head stability | PASS (exit 0) | API head checks plus raw remote-ref assertion | The three throwaway simulation branches remained unchanged. Actual `e2e-cli-gate` PR head immutability remains deferred. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| -------- | ------ | -------- | ----- |
| GitHub Actions scheduler primitive | PASS | one active + two simultaneous pending, followed by three serial successes | This validates the standalone no-op concurrency shape generally, not the two modified runtime jobs' exact acceptance. |

## Handoff Notes

- Owner review should inspect the two concurrency blocks, the header policy, the bounded simulation
  claim in `simulation-evidence.md`, and `exact-runtime-proof-procedure.md` before releasing the real
  proof.
- This implementation session does not issue an IMPL-EVAL verdict.
- The scratch branches are evidence-only and are intentionally absent from the PR diff.
- The separate-session IMPL-EVAL owned by the coordinator targets `a8f3f9e81`; this later
  artifact-honesty correction must not be represented as part of that exact-head evaluation.
