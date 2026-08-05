# Research — #1227 reopened restore stability

## Re-baseline

PR #1297 merged the bounded-failure half: `runtime.aspire-restore` now has three 180-second
attempts, infrastructure classification, and an exact Aspire 13.4.6 NuGet cache key. Preserve it.

## Findings

1. Issue owner evidence has two consecutive `quickstart.walk` runs against canary.10: one passed
   Aspire restore/start in 22.3s; one failed restore after 180.1s with exit 6 and `A task was
   canceled`.
2. Failed run 30961102523 names `/home/runner/.aspire/logs/cli_20260804T235623_1b62993a.log`, but
   artifact 8913213616 contains only four suite report/log files. Root-cause evidence was discarded.
3. The failed report says `retried: false`: quickstart step 4 invokes `runBoundedAspireWalk` once,
   and that helper invokes restore once.
4. The workflow cache step covers `~/.nuget/packages`, but its instant success does not prove which
   Aspire SDK packages were present. The CLI log must identify the actual restore path before the
   cache policy changes.
5. The same workflow's preceding `scaffold.runtime` run also reported a prebuilt AppHost preparation
   failure, strengthening the hypothesis that the failure is below NetScript product code.

## Open questions

- Which operation is canceled in the Aspire CLI log: NuGet/feed, prebuilt AppHost preparation,
  certificate setup, or another CLI operation?
- Which exact package/cache paths must be pinned to make the successful path independent of a cold
  feed?
- What consecutive-run count is feasible and sufficient? Lock after observing the diagnostic run.

