# Research — feat-canary-label-surface--1121

## Re-baseline

- Carried-in sources: user brief; issues #1121 and #1120; the observed 0.0.4 cut trace.
- Re-derived against `origin/main` @ `0b05217cc14213221b3263128b3838373b0484e8` on 2026-08-03.
- The requested trace path is absent from this checkout and `origin/main`; the same tracked run
  artifact was found at
  `/home/codex/repos/ns-004/.llm/runs/release-0.0.4--orchestration/cut-trace.md` and read in full.
- The current workflow resolves the cut version by rereading mutated `deno.json` after
  `release:canary`. The command itself emits only prose and has no machine-readable result.
- No `canary:` labels exist in GitHub. JSR already contains coordinated CLI canaries for 0.0.1,
  0.0.2, and 0.0.3, so a new global drift audit would fail on historical pre-surface data. The gate
  must be explicitly scoped to the active stable target (0.0.4 for the first exercise).

## Findings

| # | Finding | How to verify |
| - | --- | --- |
| 1 | The workspace version is `0.0.3`, while `release:canary` accepts stable target `0.0.4` and derives `0.0.4-canary.N`. | `deno.json`; `.llm/tools/release/canary.ts` `validateStableTarget` / `deriveCanaryVersion` |
| 2 | The canary command knows the resolved version before it bumps files, but exposes it only in prose. | `.llm/tools/release/canary.ts` `main()` |
| 3 | The workflow currently reparses `deno.json`; it can instead consume a JSON result written by `release:canary`. | `.github/workflows/release-canary.yml`, step `Cut ephemeral canary branch and tag` |
| 4 | A canary tag is an annotated tag over an ephemeral version-bump commit whose parent is the pre-cut content SHA. The workflow already captures that source SHA before cutting. | `.llm/tools/release/canary.ts` `createCanaryRefs`; workflow step `Record content SHA and pending pair` |
| 5 | For the first canary in a stable train, the nearest reachable stable tag is the prior content point; for later canaries, the prior lower same-train canary tag's parent is the prior content point. | `v0.0.3` tag; canary ref construction |
| 6 | Squash-merge subjects are not a reliable PR identity source: the 0.0.4 trace maps commit `0b05217cc` to PR #1092 while its subject contains issue numbers #1024/#1061. | `git log --first-parent origin/main`; observed cut trace |
| 7 | GitHub's commit-associated pull requests and `closingIssuesReferences` provide content-derived PR and closed-issue membership without parsing dispatch plans or commit subjects. | GitHub REST/GraphQL API contracts; issue #1121 acceptance |
| 8 | `@netscript/cli` is the coordinated publish completion marker: it is a dependent published by the existing workspace publisher only after its publish graph is available. | `.llm/tools/release/publish-workspace.ts`; existing canary versions from `readRegistryVersions('@netscript/cli')` |
| 9 | The workflow lacks `issues: write` / `pull-requests: write`, which are required to create and apply dynamic labels. | `.github/workflows/release-canary.yml` permissions |
| 10 | Every new pass/fail surface must print a named verdict; exceptions or empty stdout are not acceptable evidence. | Issues #1121/#1120; `cut-trace.md` proof-of-firing section |

## jsr-audit surface scan (package/plugin waves)

- N/A. This slice changes internal release tooling and one workflow; it does not change a
  publishable package/plugin export surface or dependency selection.

## Open questions

- Resolved now: drift comparison is scoped to one stable target so the new gate does not retroactively
  require labels for pre-surface 0.0.1–0.0.3 canaries.
- Resolved now: apply labels immediately after the coordinated CLI version is observed on JSR, before
  the pinned E2E wait. A published-but-red canary remains a real immutable canary and must stay
  observable.
- Safe to defer: live evidence for `0.0.4-canary.1` and `.2`. The user assigns those cuts to the
  milestone orchestrator after this surface lands; this PR must not manufacture or pre-tick them.
