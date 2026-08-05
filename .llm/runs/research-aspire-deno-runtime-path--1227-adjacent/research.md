# Research — can the Deno-runtime path remove our NuGet dependency?

Status: **in progress**. This is the slice's sole substantive deliverable; the other files in this
directory are harness control/evidence metadata.

## Verdict

Pending controlled Aspire 13.4.6 experiments and upstream verification.

## Re-baseline

- Carried-in source: owner brief; the comment in
  `packages/cli/src/kernel/templates/aspire/generate-aspire-config.ts`; issue #1227.
- Re-derived against `origin/main` at `00f96af76e5825422e8bc716a9c27d4c13e16f7f` on 2026-08-05.
- Established but still to verify: NetScript uses Aspire 13.4.6; upstream issues aspire#15119 and
  aspire#16220 are reported open; the version threshold in the comment is met but its capability
  threshold may not be.

## Questions and evidence ledger

| # | Question                                                                             | Required proof                                                                       |
| - | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| 1 | Does `[AspireExport]` on an external NuGet package work in 13.4.6?                   | Executed external-package fixture; generated TypeScript module and exit/log evidence |
| 2 | Is `CommunityToolkit.Aspire.Hosting.Deno` viable and does `addDenoApp(...)` surface? | Stable version/support provenance; controlled TypeScript AppHost generation          |
| 3 | Does adoption shrink or grow `aspire restore`'s NuGet surface?                       | Current vs candidate package graphs, identities, and counts under isolated caches    |
| 4 | Can a Deno-only graph avoid NuGet restore entirely?                                  | Executed AppHost configuration variants and explicit loss inventory                  |
| 5 | Do the expected next-milestone PRs change the verdict?                               | Upstream issue/PR state, milestone/release signal, and capability delta              |

## Recommendation on a 0.0.6 epic

Pending the verdict.

## Sources

Pending. Final citations will link primary upstream sources and identify local commands/artifacts.
