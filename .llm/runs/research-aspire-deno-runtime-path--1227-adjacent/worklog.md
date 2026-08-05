# Worklog: Aspire Deno runtime / NuGet dependency research

## Run Metadata

| Field          | Value                                              |
| -------------- | -------------------------------------------------- |
| Run ID         | `research-aspire-deno-runtime-path--1227-adjacent` |
| Branch         | `research/aspire-deno-runtime-path`                |
| Archetype      | `6 — CLI / Tooling` subject; docs-only changeset   |
| Scope overlays | `docs`                                             |

## Design

This run introduces no product implementation surface. The design contract is the evidence shape.

### Public Surface

- `research.md` — sole substantive deliverable and review surface.

### Domain Vocabulary

- `AspireExportResult` — whether an external package export appears in generated TypeScript.
- `DenoIntegrationViability` — version/support, generated API, and runnable behavior.
- `NuGetSurface` — unique direct/transitive package identities restored for a configuration.
- `ZeroNuGetPath` — configuration plus the Aspire features it retains or loses.
- `UpstreamSignal` — exact issue/PR/release/capability event that changes the verdict.

### Ports

- Aspire CLI 13.4.6 — creates/restores/generates the controlled AppHost fixtures.
- NuGet/MSBuild artifacts and isolated caches — expose the package surface.
- Official GitHub/NuGet/Aspire sources — establish shipped status and timeline.

### Constants

- `ASPIRE_CLI_VERSION = 13.4.6` — owner-established and experiment-pinned baseline.
- Verdict vocabulary: `adopt now`, `adopt when X`, `do not adopt`.

### Commit Slices

| #  | Slice                                           | Gate                                                                           | Files                                                                |
| -- | ----------------------------------------------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| S0 | Activate the run and open the draft research PR | raw git status; PR metadata review                                             | mandatory run metadata plus initial `research.md`                    |
| S1 | Land the completed evidence-backed verdict      | fixture exit/package/module checks; source/link alignment; scoped format check | `research.md`, `worklog.md`, `context-pack.md`, `drift.md` if needed |

### Deferred Scope

- Product/scaffold migration — owner explicitly requested research only.
- #1227 mitigation implementation — remains with the issue owner.
- Filing a 0.0.6 epic — requires the recommendation and owner choice first.

### Contributor Path

Review `research.md` from verdict to the five numbered questions, then reproduce any local claim
using its recorded command/configuration and follow the exact upstream watch signal.

## Progress Log

| Time                  | Slice | Step      | Notes                                                                                                        |
| --------------------- | ----- | --------- | ------------------------------------------------------------------------------------------------------------ |
| 2026-08-05 03:02 CEST | S0    | bootstrap | Branch equals `origin/main`; remote branch absent; inherited `deno.lock` modification recorded and excluded. |

## Decisions

| Decision                | Reason                                                    | Source                         |
| ----------------------- | --------------------------------------------------------- | ------------------------------ |
| Evidence-only changeset | A negative verdict is a complete result.                  | owner brief / plan D1          |
| D6 composed PLAN-EVAL   | Avoid duplicate local evaluation without self-certifying. | owner brief / milestone-run.md |

## Drift

| Drift                                                      | Severity      | Logged in drift.md |
| ---------------------------------------------------------- | ------------- | ------------------ |
| Owner-specified route, D6 waiver, and branch-name override | minor/process | yes                |

## Gate Results

Pending S1.

## Handoff Notes

- Inspect the experiments for questions 1, 3, and 4 before accepting the verdict; those are the
  load-bearing claims.
