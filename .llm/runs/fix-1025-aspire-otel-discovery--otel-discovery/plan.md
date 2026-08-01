# Plan: detached Aspire telemetry discovery

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1025-aspire-otel-discovery--otel-discovery` |
| Branch | `fix/1025-aspire-otel-discovery` |
| Phase | `plan` |
| Target | CLI E2E tooling, Aspire skill, observability docs |
| Archetype | `6 - CLI / Tooling` |
| Scope overlays | `docs` |

## Archetype

Archetype 6 applies narrowly because the product change is to user-run scaffold E2E automation. No
published CLI command or package implementation changes. `SCOPE-docs` governs the skill/docs slice.

## Current Doctrine Verdict

`@netscript/cli` is `Restructure`; this slice does not widen or reorganize that package. The edited
E2E harness remains outside the published package surface.

## Goal

Restore automatic detached-dashboard discovery by removing NetScript's anonymous dashboard mode,
then make scaffold E2E semantically prove automatic `otel` and `export` against the isolated AppHost.

## Scope

- Stop emitting `ASPIRE_DASHBOARD_UNSECURED_ALLOW_ANONYMOUS` in generated Aspire config and helper assets.
- Regenerate the embedded asset registry with the repository-native generator.
- Require automatic `--apphost` telemetry exit 0 and non-empty JSON for traces; add an export artifact assertion.
- Record the NetScript-side cause and the isolated-mode negative finding on #1025/PR.

## Non-Scope

- No NetScript wrapper verb for Aspire telemetry.
- Keep `ASPIRE_ALLOW_UNSECURED_TRANSPORT`; the HTTP OTLP endpoint requires it.
- No Aspire CLI patch or dependency upgrade.
- No workaround docs, skill change, Claude mirror, or upstream issue: automatic discovery is repairable in NetScript.
- No broad E2E refactor.

## Hidden Scope

- Anonymous mode is emitted by both `aspire.config.json` generation and the dashboard helper asset.
- Embedded generated assets must be refreshed from the source template.
- Command success alone is insufficient; JSON and export artifacts require semantic assertions.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| L1 | Classify root cause as NetScript's anonymous dashboard configuration. | A/B control: removing only anonymous mode restores tokenized dashboard info and automatic discovery. |
| L2 | Preserve automatic `--apphost` discovery in E2E; do not pass `--dashboard-url`. | This proves the actual template fix and disproves the presumed isolated-mode defect. |
| L3 | Extend command execution with an optional stdout assertion callback. | Keeps semantic output checks within the existing harness rather than adding a parallel test. |
| L4 | Make traces and export critical capability checks; retain logs as diagnostic coverage. | Acceptance explicitly requires traces and export, and silent warnings caused the false green. |
| L5 | Remove both anonymous-mode emission sites and regenerate embedded assets. | Leaving either site retains the defect in generated projects. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Minimal C# control | safe to defer | The NetScript configuration A/B control directly falsified the upstream-only hypothesis. |
| Export output path cleanup | resolved | Write under the generated project and remove during normal suite cleanup. |
| Empty logs behavior | safe to defer | Traces after exercised traffic is the acceptance regression; logs remain useful but are not the semantic gate. |
| Acceptance box 1 | resolved | Template fix makes automatic discovery work; no partial documented-remedy claim is needed. |
| Acceptance box 2 | resolved | Patched automatic export exited 0 and wrote a non-empty zip. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| JSON contains banners/noise | Use `--non-interactive --nologo --format Json`; parse trimmed stdout and report the raw tail on failure. |
| Export passes without a file | Assert the requested zip exists and has non-zero size. |
| Removing anonymous mode breaks HTTP OTLP | Preserve `ASPIRE_ALLOW_UNSECURED_TRANSPORT`; targeted startup control already proved this requirement. |
| Dashboard now requires its one-time login token | Correct the owned generated-config sample, keep the PR draft for human security review, and report the wider 53-file docs surface without expanding scope. |
| Expensive E2E repeated | Run the requested telemetry/full runtime path once after implementation. |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| Scoped check/lint/fmt | yes | Repository wrappers on `.llm/tools/e2e` TypeScript. |
| Focused Deno tests | yes | Matching E2E helper/unit tests if present. |
| Asset generation | yes | Repo-native embedded asset generator plus focused template tests. |
| Runtime telemetry | yes | One-pass scaffold runtime E2E with raw otel/export evidence. |
| Source alignment | yes | Live Aspire 13.4.6 before/control reproduction. |
| Package quality | yes | `deno task quality:gate` because generator/template assets ship in `@netscript/cli`. |
| Asset barrel | yes | `deno task check:assets-barrel` proves generated output is synchronized. |
| JSR surface | scoped | No exported signature change; publish-surface scan recorded in research. |

## Arch-Debt Implications

None. The defect is fixed at its two generator sources; no architecture violation is deferred.

## Validation Plan

1. Scoped check, lint, and fmt wrappers for `.llm/tools/e2e`.
2. Focused tests covering parser/assertion behavior.
3. Embedded asset generation/check and focused template tests.
4. `deno task quality:gate` for the published CLI generator slice.
5. Docs maintenance/build evidence for the corrected `aspire.md` sample.
6. One-pass `scaffold.runtime --cleanup --format pretty` telemetry evidence, with strict semantic checks.

## Drift Watch

- If removing anonymous mode does not restore automatic discovery in the full scaffold E2E, rescope
  before adding any explicit URL workaround.
