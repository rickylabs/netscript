# Plan: Aspire 13.5.3 runtime verification receipts (S2)

## Run Metadata

| Field          | Value                                                      |
| -------------- | ---------------------------------------------------------- |
| Run ID         | `test-aspire-13-5-s2-runtime-verification--impl`           |
| Branch         | `test/aspire-13-5-s2-runtime-verification`                 |
| Phase          | `implement`                                                |
| Target         | Runtime evidence and harness run artifacts for issue #1714 |
| Archetype      | N/A — no package/plugin/product implementation             |
| Scope overlays | Docs (run artifacts) plus runtime/Aspire validation        |

## Archetype

N/A. The committed changes are evidence records and an append-only debt outcome. No package, plugin,
CLI command, public API, or scaffold generator changes.

## Current Doctrine Verdict

N/A for product architecture. Existing package/plugin code is read-only in this slice.

## Goal

Execute V1–V12 against one generated PostgreSQL NetScript project using the exact S1 Aspire 13.5.3
train, preserve exact command/output/exit/timestamp receipts, clean only positively owned runtime
resources, and hand the draft PR to the independent Fable supervisor.

## Scope

- Generate one disposable project below `.llm/tmp/aspire-13-5-s2/` with the local maintainer CLI.
- Edit only that generated project's `aspire/aspire.config.json` to S1's exact train and restore it.
- Start one AppHost with `--isolated`; execute V1–V12 and the bounded regression list.
- Commit receipts, run artifacts, and the append-only V4 result in `arch-debt.md`.
- Open and maintain the draft PR and per-slice evidence trail.

## Non-Scope

- No edits under `packages/`, `plugins/`, scaffold templates, generated skill corpora, or version
  pins.
- No host Aspire CLI update, workload install, cache reload, lock-file change, release, merge,
  ready-for-review transition, or self-evaluation.
- No sqlite+garnet variant until the required PostgreSQL V1–V12 and cleanup are complete.

## Hidden Scope

- Redact dashboard bearer tokens from committed receipts while preserving unredacted values only in
  ignored `.llm/tmp/` runtime state.
- Attribute containers and AppHosts by exact AppHost path and DCP labels before cleanup.
- If the named V3 E2E gates cannot target an already-running AppHost, record that constraint and
  perform the required manual URL/PORT comparison.
- Record each V11 item as reproduced or as bounded `needs <X>` evidence; never write `not run`.

## Locked Decisions

| ID | Decision                                                                                                                       | Rationale                                                                                                             |
| -- | ------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| D1 | Use `Aspire.Hosting.*` 13.5.3, Browsers `13.5.3-preview.1.26425.3`, Toolkit Deno/SQLite 13.5.0 in the disposable project only. | Exact S1 train supplied by the coordinator; avoids unsupported 13.4/13.5 mixing without claiming generator ownership. |
| D2 | One PostgreSQL AppHost at a time, started `--isolated --non-interactive --nologo --format Json`.                               | Serialized lease and shared-host safety.                                                                              |
| D3 | Every runtime receipt records UTC timestamp, exact command, exit code, and raw output; JSON is used when offered.              | Issue #1714 acceptance contract.                                                                                      |
| D4 | Kill only the owned `cliPid`; stop only the exact owned `appHostPath`; inspect DCP labels before force cleanup.                | Prevents interference with foreign lanes.                                                                             |
| D5 | PLAN-EVAL is N/A; IMPL-EVAL is mandatory and external.                                                                         | The ratified issue/supervisor brief leaves no planning decision; evaluator separation remains non-negotiable.         |

## Open-Decision Sweep

| Decision                               | Status        | Notes                                                                                            |
| -------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------ |
| sqlite+garnet bonus variant            | safe to defer | Explicitly optional and attempted only after required acceptance is secured.                     |
| V3 named gates against running AppHost | safe to defer | Attempt target discovery first; manual `describe` URL/PORT comparison is the specified fallback. |
| Behavior changes vs 13.4.6             | safe to defer | Record for downstream S9/S10; product fixes are outside S2.                                      |

## Risk Register

| Risk                                           | Mitigation                                                                                                                 |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Foreign AppHost/container damage               | Exact AppHost-path targeting, DCP-label snapshots, leak-check ownership classification, no `--all`, no broad process kill. |
| Token leakage through dashboard URL            | Mask `?t=` values before any committed receipt or PR comment.                                                              |
| Orphan probe loses the running graph           | Capture V1–V5 and relevant V11 evidence before V6; use the required `ps`/`stop` orphan behavior as the lifecycle result.   |
| Cold restore/start exceeds normal timing       | `ASPIRE_CLI_START_TIMEOUT=300`, per-command timeouts, exact duration receipts; no cache deletion/reload.                   |
| Gate output is mistaken for evaluator approval | Mark receipts as implementation evidence and leave PR draft/status:impl for Fable review.                                  |

## Fitness Gates

| Gate                | Required | Expected evidence                                                           |
| ------------------- | -------- | --------------------------------------------------------------------------- |
| Source alignment    | yes      | Receipt claims trace to issue #1714, CLI output, or repository code.        |
| Scope separation    | yes      | Generated-project edits remain ignored; committed product diff stays empty. |
| Link/path integrity | yes      | All receipt and run-artifact paths exist.                                   |
| Runtime V1–V12      | yes      | `receipts/aspire-13.5-verification.md` plus raw receipts.                   |
| Cleanup ownership   | yes      | Exact stop outputs, DCP before/after, leak-check and teardown reports.      |
| Lock hygiene        | yes      | `deno.lock` unchanged from baseline.                                        |

## Arch-Debt Implications

| Entry                       | Action            | Notes                                                  |
| --------------------------- | ----------------- | ------------------------------------------------------ |
| `aspire-otel-cli-discovery` | append V4 outcome | Append-only observation; do not rewrite prior history. |

## Validation Plan

| Order | Gate                  | Command or check                                                                         | Expected result                                                                      |
| ----- | --------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| 1     | Scaffold/restore      | local `netscript-dev init` then `aspire restore`                                         | Generated PostgreSQL project and 13.5.3 module graph.                                |
| 2     | Runtime               | V1–V7 commands from issue #1714                                                          | Exact observed behavior with owned AppHost only.                                     |
| 3     | MCP/toolkit/contracts | V8–V12 commands from issue #1714                                                         | MCP transcript/diff, Deno projection, doctor JSON, deploy help, regression evidence. |
| 4     | Cleanup               | exact `aspire stop`, leak-check, dry-run teardown; apply only for proven owned survivors | No owned survivors; foreign/unknown resources untouched and escalated.               |
| 5     | Diff/lock             | raw Git status/diff checks                                                               | Only assigned run artifacts and append-only debt outcome committed; no lock churn.   |

## Dependencies

- Host Aspire CLI `13.5.3+b5f143315ffb6968ea939a9978797a5b20e4c688` (pre-upgraded by the
  coordinator).
- S1 PR #1727 train values, applied only to disposable generated output.
- Serialized runtime lease granted by the primary coordinator.

## Drift Watch

- Any 13.5 output or behavior that differs from the 13.4.6 skill/baseline.
- Any inability to target the named V3 gates at the already-running AppHost.
- Any foreign or unknown-owner AppHost/container reported by leak-check.
