# Context Pack: root-cause Aspire restore cancellation (#1227)

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `research-aspire-restore-root-cause--1227` |
| Branch | `research/aspire-restore-root-cause` |
| Current phase | `impl` |
| Archetype | `6 — CLI / Tooling` (workflow-only implementation) |
| Scope overlays | none |

## Current State

Root cause is established. Aspire CLI 13.4.6 can abandon stopped NuGet metadata-search helpers;
those helpers poison NuGet locks used by later bundled restore. NetScript's 180-second deadline is
the actor that finally terminates the waiting Aspire process and produces the secondary
`TaskCanceledException`/exit 6. Existing upstream issue microsoft/aspire#18948 and merged PR #18958
match the exact version, WSL state, component, and outcome.

The branch pins the published-canary workflow to exact fixed daily CLI
`13.5.0-preview.1.26404.10`, keeps the AppHost SDK at 13.4.6, adds exact-version/doctor preflight,
reuses PR #1305 S1 log capture, and rejects its S2 cache/retry as insufficient. Local/static gates
are green. Five consecutive published-canary workflows remain.

## Evidence index

- `evidence/failing-cli-log.md` — exact failing cloud log, stack, cancellation ownership.
- `evidence/upstream-and-version.md` — #18948/#18958, daily ancestry, doctor results.
- `evidence/local-and-control-evidence.md` — six stopped local helpers, PR #1305 falsification,
  daily compatibility restore.

## Next Steps

1. Commit owned files without `deno.lock`; explicit-refspec push the research branch.
2. Open/update the harness draft PR as partial work referencing #1227 and superseding PR #1305 S2.
3. Dispatch five `e2e-cli-prod` runs for published `0.0.5-canary.10` at one head.
4. Inspect exact version, both runtime suites, retained Aspire logs, and leak/termination behavior.
5. Record run IDs/verdicts; only then mark implementation complete and hand to external IMPL-EVAL.

## Drift and Debt

- Owner override: OpenAI GPT-5.6 Sol xhigh; D6 waives local PLAN-EVAL.
- Plan narrowing: `/dev/null` hypothesis was superseded by the retained log/source/upstream process
  trace; it is not used as acceptance evidence.
- Operational debt: exact daily preview pin until fixed 13.5 stable ships.
- Lock hygiene: inherited `deno.lock` modification is user-owned and excluded.

## Commits

- Pending first diagnosis/fix commit and explicit-refspec push.
