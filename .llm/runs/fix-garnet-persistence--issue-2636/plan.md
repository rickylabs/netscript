# Plan

## SKILL

netscript-doctrine, netscript-harness, netscript-cli, netscript-pr, netscript-tools, netscript-deno-toolchain and jsr-audit. Aspire diagnostic skill applies to the required full runtime gate.

## Locked contract

Existing CacheEntry.DataPath is the opt-in persistence contract; no new settings. With it, every managed Garnet launch arm (Container, Executable and both Auto arms) enables AOF, recovery and immediate per-operation commits with acknowledgement waiting for flush. Docker logdir/checkpointdir both use /data, already bound from resolved DataPath. Executable uses the native resolveDataPath result for both directories. Preserve Lua flags and endpoint allocation. Without DataPath, argv and directory behavior remain unchanged. External/Local and Redis container behavior unchanged; the Docker-less Garnet fallback of Auto inherits persistence when its data path is configured.

Durability favors acknowledged work over throughput; document flush latency and the underlying data directory requirement. Do not add unsupported checkpoint timers or unsafe AOF truncation. Checkpoints are native on-demand SAVE/BGSAVE; AOF recovers writes after the last checkpoint.

## Slices

S1 bootstrap plus failing static and real queue/container regressions, under12files. Runtime consumes emitted container argv, stores checkpointed and post-checkpoint jobs, restarts the owned Garnet container and observes delivery; no Redis Streams. Test resource bounds do not override persistence flags. Exact IDs plus unique ownership labels fence container/volume cleanup.
S2 minimal generator/helper import adjustments, green regressions, docs for durable vs ephemeral and commit tradeoff, under12files.
S3 canonical generated assets/prose/corpus/publish consumers, scoped CLI config check/lint/fmt/test, quality:gate, release:preflight, docs:accuracy, JSR/doc lint, one final full scaffold.runtime with cleanup, ownership audit and independent evaluation, under20files.

Full runtime required because generated Aspire output changes. Local environment has remote Docker: do not weaken doctor or reproduce unrelated full-gate failures by changing product logic; supported-runner evidence must provide the complete verdict. No merge/auto-merge/ready-merge/rebase/force-push/publication.

## Risks

Unacknowledged async AOF tail loss -> explicit per-operation flush wait. Docker-less fallback silently ephemeral -> same policy on executable and both Auto arms. Latest documentation unsupported flags -> exact pinned help and real restart test. Unbounded log without checkpoints -> native on-demand checkpoint documented; no unsafe size cap. Wrong resource cleanup -> exact created identities, immutable unique label verification, keep foreign resources untouched. No new dependency or transport change.
