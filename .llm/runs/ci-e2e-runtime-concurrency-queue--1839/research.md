# Research — ci-e2e-runtime-concurrency-queue--1839

## Re-baseline

- Carried-in source: issue #1839 and the owner brief.
- Re-derived against `main` at `6c195acaf3f7e650c4235fc3fbc51232e210e7a4` on 2026-08-31.
- `HEAD`, local `main`, and the requested base SHA were identical before the first commit.
- The confirmed defect remains present: each runtime job has one repository-wide concurrency group
  with `cancel-in-progress: false` and no multi-entry queue setting.

## Findings

| # | Finding | How to verify |
| - | ------- | ------------- |
| 1 | `scaffold-runtime` uses `e2e-scaffold-runtime-global`; `scaffold-runtime-sqlite` uses its own sqlite-global group. | `.github/workflows/e2e-cli.yml` job-level `concurrency` blocks |
| 2 | Default GitHub concurrency retains only one pending entry; a later arrival replaces it. | [GitHub concurrency documentation](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency) |
| 3 | GitHub's native `queue: max` setting allows up to 100 pending entries in a concurrency group while preserving single execution. | [GitHub queue announcement](https://github.blog/changelog/2026-05-07-github-actions-concurrency-groups-now-allow-larger-queues/) and the concurrency documentation |
| 4 | The native queue resumes a pending job in the same workflow run; no redispatch and no head movement are part of the mechanism. | Native concurrency semantics; prove with scratch no-op runs and unchanged per-run head SHAs |
| 5 | A third-party/polling admission action is unnecessary and would consume runner time while waiting. | Native `queue: max` directly represents the required policy |

## jsr-audit surface scan

- N/A: this is a CI workflow-only change; no package/plugin public surface is touched.

## Open questions

- Closed: use the native bounded queue rather than a polling or redispatch mechanism.
- Evidence pending: run a no-op scratch workflow from at least three throwaway branches and derive
  non-overlap from recorded job timestamps. Do not invoke either real runtime tier.
