# Worklog: root-cause Aspire restore cancellation (#1227)

## Run Metadata

| Field          | Value                                              |
| -------------- | -------------------------------------------------- |
| Run ID         | `research-aspire-restore-root-cause--1227`         |
| Branch         | `research/aspire-restore-root-cause`               |
| Archetype      | `6 — CLI / Tooling` (workflow-only implementation) |
| Scope overlays | none                                               |

## Design

### Public Surface

None. The only implementation surface is the published E2E workflow and its semantic policy test.

### Domain Vocabulary

- **cancellation initiator** — NetScript's 180-second Quickstart `AbortController` deadline.
- **blocked component** — Aspire `BundleNuGetService.RestorePackagesAsync`, awaiting its bundled
  `aspire-managed nuget restore` child.
- **poisoning helper** — an earlier Aspire 13.4.6 `aspire-managed nuget search` prefetch child left
  stopped/orphaned while holding or starving NuGet scratch/global locks.
- **fix** — a CLI build containing upstream PR #18958's tracked/cancelled helper lifecycle.
- **mitigation** — package prewarm or signature retry that leaves the helper/lock defect intact.

### Constants

- Affected stable CLI: `13.4.6+87fe259e...`.
- Fixed daily CLI: `13.5.0-preview.1.26404.10+1f098dff...`.
- Unchanged AppHost SDK: `13.4.6`.
- Acceptance streak: five consecutive green published `0.0.5-canary.10` workflows.

## Progress Log

| Time       | Slice | Step                | Notes                                                                                                                                                                 |
| ---------- | ----- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-05 | S1    | bootstrap           | Activated requested skills; read harness/doctrine profiles; recorded D6 and xhigh owner overrides.                                                                    |
| 2026-08-05 | S1    | carried-in review   | Read #1227, prior runs, and PR #1305 commits/comments; reused its S1 capture baseline.                                                                                |
| 2026-08-05 | S1    | failing logs        | Read two local failing logs and cloud run 30962130571's named log in full; retained SHA-256 and decisive stack.                                                       |
| 2026-08-05 | S1    | cancellation trace  | Proved the 180-second NetScript `AbortController` sends termination; Aspire then cancels `Process.WaitForExitAsync` inside `BundleNuGetService.RestorePackagesAsync`. |
| 2026-08-05 | S1    | upstream            | Found microsoft/aspire#18948 and merged fix #18958 for exact 13.4.6/WSL stopped NuGet search helpers; no duplicate issue needed.                                      |
| 2026-08-05 | S1    | host evidence       | Found six foreign stopped (`Tl`) 13.4.6 NuGet search helpers matching upstream; left them untouched. Leak check found no run-owned resources.                         |
| 2026-08-05 | S1    | PR #1305 control    | Run 30964226683 verified a preseeded cache but later hung in bundled restore for 300 seconds; cache/retry S2 superseded.                                              |
| 2026-08-05 | S1    | retry falsification | PR #1305 run 30965320792 made two consecutive preseeded restore attempts; both hit the 180-second deadline and exited 6 in `BundleNuGetService`.                      |
| 2026-08-05 | S1    | version/doctor      | Stable predates fix; exact daily is 25 commits ahead/zero behind fix. Both doctor runs have zero failed checks.                                                       |
| 2026-08-05 | S1    | compatibility       | Exact daily restored unchanged 13.4.6 TS SDK graph from isolated empty caches in 13.06 seconds; no new helper leaked.                                                 |
| 2026-08-05 | S1    | implementation      | Pinned exact fixed daily in published workflow; added exact preflight/doctor, reused S1 log capture, extended semantic policy test.                                   |

## Decisions

| Decision                                    | Reason                                                                                                                                 | Source                                    |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| Version move, not retry/prewarm             | Only the fixed CLI removes the diagnosed orphan lifecycle; cached packages still hang on NuGet locks.                                  | #18948/#18958; run 30964226683            |
| Keep SDK/package train at 13.4.6            | Daily CLI is compatible with and successfully restored the existing generated graph; SDK packages are not the defective process owner. | Isolated restore evidence                 |
| Five-run streak                             | One green is the known failure mode; five greens reduce 50/50 lucky-streak probability to 3.125%.                                      | Owner acceptance + observed intermittence |
| Do not kill stopped host helpers            | They are foreign/unproven resources rooted in another checkout/session.                                                                | Repo resource hygiene                     |
| Preserve inherited `deno.lock` modification | It predates and is unrelated to this branch work.                                                                                      | Initial/current diff                      |

## Gate Results

| Gate                            | Result      | Evidence                                                                   | Notes                                                                                          |
| ------------------------------- | ----------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Failing CLI log read            | PASS        | `evidence/failing-cli-log.md`                                              | Named component and cancellation owner retained.                                               |
| Upstream state                  | PASS        | `evidence/upstream-and-version.md`                                         | Existing issue #18948 and merged fix #18958.                                                   |
| Daily/canary currency           | PASS        | `evidence/upstream-and-version.md`                                         | Exact daily contains fix; stable does not.                                                     |
| Doctor                          | PASS        | `evidence/upstream-and-version.md`                                         | Zero failed checks on stable/daily.                                                            |
| PR #1305 mitigation control     | FAIL_AS_FIX | `evidence/local-and-control-evidence.md`                                   | Verified preseed did not prevent three later hangs, including two consecutive bounded retries. |
| Fixed daily compatibility       | PASS        | `evidence/local-and-control-evidence.md`                                   | 13.06s, exit 0, clean child lifecycle.                                                         |
| Workflow policy test            | PASS        | `deno test --allow-read .github/scripts/aspire-nuget-cache-policy.test.ts` | 2 passed, 0 failed.                                                                            |
| Scoped TypeScript fmt           | PASS        | `run-deno-fmt.ts`                                                          | 1 file, 0 findings.                                                                            |
| Exact installer resolution      | PASS        | official installer `--dry-run --version 13.5.0-preview.1.26404.10`         | Versioned archive + SHA-512 verification path resolved.                                        |
| N=5 consecutive published walks | PENDING     | Run IDs to be appended                                                     | Must all target one branch head.                                                               |

## Published-canary proof

| Streak | Run     | Head    | Workflow | Full scaffold | Quickstart | Aspire CLI                  | Verdict |
| ------ | ------- | ------- | -------- | ------------- | ---------- | --------------------------- | ------- |
| —      | pending | pending | pending  | pending       | pending    | `13.5.0-preview.1.26404.10` | pending |

## Handoff Notes

- PR #1305's log-retention line is incorporated; its cache/retry S2 is superseded and should not be
  merged as the #1227 fix.
- Do not call the branch complete until five consecutive full workflows are green and their Aspire
  logs show no restore/start deadline cancellation.
- Replace the preview pin with the first stable 13.5 build that contains #18958 after separately
  confirming ancestry/behavior.
