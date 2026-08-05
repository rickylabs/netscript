# Local process evidence and PR #1305 control

## Exact local mechanism

The shared WSL host currently contains six Aspire CLI 13.4.6 children with this shape:

```text
STAT Tl  aspire-managed nuget search --query Aspire.Cli ... --working-dir /home/codex/repos/ns-005
STAT Tl  aspire-managed nuget search --query Aspire.ProjectTemplates ... --working-dir /home/codex/repos/ns-005
```

They were started between 2026-08-04 19:15 and 19:17, have PPID 1349, and remain stopped many hours
later. This is the precise state and command family in upstream #18948, including its WSL
confirmation. The processes belong to another checkout/session and were deliberately not signalled
or killed.

Two local failing 13.4.6 logs show the same wait and termination sequence:

| Log | SHA-256 |
| --- | --- |
| `~/.aspire/logs/cli_20260804T092654_7dc37fe7.log` | `84f12b311074cd014392d884d770b887dd604904857c0690db1ab51c707af36b` |
| `~/.aspire/logs/cli_20260804T094300_8a06ef75.log` | `368651882884438e1bcb516b2025ebc5436afc023b98dae93cd91162f0c20341` |

The run-scoped read-only leak check found no resources owned by this run. Foreign Postgres
containers and the stopped helpers were left untouched.

## Why PR #1305 S2 is not the fix

PR #1305 correctly added failing-log capture in S1. Its S2 pre-populates and verifies the five exact
Aspire SDK packages, then retries only exit 6 with two prepare-failure strings. That mitigation is
falsified by the PR branch's own next control run:

- <https://github.com/rickylabs/netscript/actions/runs/30963671830> was green.
- <https://github.com/rickylabs/netscript/actions/runs/30964226683> was red at the same head.
- In the red run the package-cache prerequisite was a verified hit, Quickstart step 4 restore/start
  passed in 21.362 seconds, then step 5's nested `aspire start` hung for its full 300-second command
  deadline.
- Child log `cli_20260805T005338525_detach-child_19780408a8c749ff93cea7432377c3be.log`
  starts `aspire-managed nuget search`, begins `BundleNuGetService` restore of four already-cached
  packages at 00:53:38.983, makes no progress, and receives the parent termination signal at
  00:58:38.744.
- Child-log SHA-256:
  `cf5dc02d92223213ade7d63ebf5738459cb8ee46c43db7a2a4e3db92b4f1832c`.

Package availability therefore does not remove NuGet scratch/global lock starvation; it merely
moved the observed hang. An exit-6-only retry also misses the `aspire start` deadline form. PR #1305
S2 is mitigation-only and is superseded by the fixed-CLI pin. S1 log retention is reused unchanged;
the unrelated later response-probe correction is not part of this diagnosis.

## Fixed daily compatibility probe

The exact daily CLI restored a TypeScript AppHost configured for the unchanged 13.4.6 SDK and the
same PostgreSQL, Redis, Browsers, hosting, and TypeScript code-generation package train from empty,
isolated `TMPDIR` and `NUGET_PACKAGES` roots:

```text
Aspire CLI: 13.5.0-preview.1.26404.10+1f098dffe7e143c18f5a79c37218718f822415ed
Result:     SDK code restored successfully
Elapsed:    13.06 seconds
Exit:       0
Output:     .aspire/modules/aspire.mts rebuilt (3,833,237 bytes)
```

The six pre-existing stopped 13.4.6 helpers were still the only `aspire-managed nuget
search|restore` processes afterward: the daily probe left no new child behind.
