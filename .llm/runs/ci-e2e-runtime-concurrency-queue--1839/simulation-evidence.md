# Simulation Evidence — #1839 runtime concurrency queue

This proof used a standalone no-op workflow on three throwaway branches. It did not apply
`e2e-cli-gate`, invoke `e2e-cli.yml`, or consume a docker/sqlite runtime slot.

## Shape

- Workflow: `.github/workflows/e2e-runtime-queue-simulation-1839.yml` on each throwaway branch only.
- Shared job group: `e2e-runtime-queue-sim-1839`.
- Admission settings: `cancel-in-progress: false`, `queue: max`.
- Simulated critical section: one 30-second sleep.
- Arrivals: three independent branch commits created between 16:34:37Z and 16:34:39Z (2 seconds).

At 16:34:41Z the GitHub Actions API reported run `33414867389` as `in_progress` and both
`33414868688` and `33414870475` as `pending`. This is the old defect's decisive threshold: the
default concurrency group could retain only one pending job, while the native queue visibly retained
both deferred jobs.

## Results

| Run | Triggering branch / immutable head | Run conclusion | Job interval (UTC) |
| --- | ---------------------------------- | -------------- | ------------------ |
| [33414867389](https://github.com/rickylabs/netscript/actions/runs/33414867389) | `ci/e2e-runtime-queue-sim-1839-1` / `8f4d1ad3b3ecfab2de01701ed33a6cdac5826db2` | `success` | 16:34:40–16:35:13 |
| [33414868688](https://github.com/rickylabs/netscript/actions/runs/33414868688) | `ci/e2e-runtime-queue-sim-1839-2` / `38d62b366b1b17d3561bb50d8585ff022db8bb68` | `success` | 16:35:16–16:35:49 |
| [33414870475](https://github.com/rickylabs/netscript/actions/runs/33414870475) | `ci/e2e-runtime-queue-sim-1839-3` / `9427c83d56c5dbd18182ea911b6e7ef9c372f8e8` | `success` | 16:35:52–16:36:27 |

## Assertions

The acceptance script fetched each run and its job from the GitHub Actions API and failed closed
unless all of these were true:

- all three runs and jobs were `completed/success`;
- arrival span was at most one minute (actual: 2,000 ms);
- each run retained its recorded triggering head SHA;
- each later job's `started_at` was greater than or equal to the prior job's `completed_at`.

Result: `PASS`, `overlap_count: 0`, exit `0`.

A separate raw `git ls-remote` assertion compared all three remote branch heads to their triggering
SHAs after the queue drained. Result: unchanged, exit `0`; no deferred run needed a push.

The throwaway branches remain available for evaluator inspection and can be deleted after the
acceptance evidence is ratified. They are not part of PR #1846.
