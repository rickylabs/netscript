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

Make the upstream Aspire detached-dashboard discovery failure discoverable by its literal error,
and make scaffold E2E prove `otel` and `export` through a URL resolved from the exact isolated AppHost.

## Scope

- Document the literal error and `aspire ps` → `--dashboard-url` remedy in the authoritative Aspire skill.
- Regenerate the byte-identical Claude skill mirror with the repository sync task.
- Add the same remedy to the observability hub.
- Resolve the exact isolated AppHost dashboard URL in scaffold E2E.
- Require exit 0 and non-empty JSON for telemetry traces; add an export artifact assertion.
- Open and link an upstream Aspire issue; record cause and evidence on #1025/PR.

## Non-Scope

- No NetScript wrapper verb for Aspire telemetry.
- No generated `apphost.mts` change: evidence shows the URL is already published and served.
- No Aspire CLI patch or dependency upgrade.
- No broad E2E refactor.

## Hidden Scope

- `--apphost` and `--dashboard-url` are mutually exclusive; E2E commands must use only the URL.
- Multiple isolated AppHosts require canonical-path matching, not `.[0]`.
- Command success alone is insufficient; JSON and export artifacts require semantic assertions.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| L1 | Classify root cause as upstream Aspire CLI detached discovery. | Run-state and dashboard HTTP are healthy; only the CLI's AppHost lookup fails. |
| L2 | Parse `aspire ps --format Json` inside the E2E runner and match `appHostPath`. | Works for isolated parallel runs and avoids shell/jq dependencies. |
| L3 | Extend command execution with an optional stdout assertion callback. | Keeps semantic output checks within the existing harness rather than adding a parallel test. |
| L4 | Make traces and export critical capability checks; retain logs as diagnostic coverage. | Acceptance explicitly requires traces and export, and silent warnings caused the false green. |
| L5 | Use the literal error string as the troubleshooting heading/key. | Agents grep the error they saw. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Minimal C# control | safe to defer | Template creation could not complete cheaply; it does not alter the in-scope workaround. |
| Export output path cleanup | resolved | Write under the generated project and remove during normal suite cleanup. |
| Empty logs behavior | safe to defer | Traces after exercised traffic is the acceptance regression; logs remain useful but are not the semantic gate. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Wrong AppHost selected | Compare resolved canonical paths. |
| JSON contains banners/noise | Use `--non-interactive --nologo --format Json`; parse trimmed stdout and report the raw tail on failure. |
| Export passes without a file | Assert the requested zip exists and has non-zero size. |
| Docs promise automatic discovery | State explicitly that this is an Aspire 13.4.6 detached discovery defect and show the manual path. |
| Expensive E2E repeated | Run the requested telemetry/full runtime path once after implementation. |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| Scoped check/lint/fmt | yes | Repository wrappers on `.llm/tools/e2e` TypeScript. |
| Focused Deno tests | yes | Matching E2E helper/unit tests if present. |
| Skill sync | yes | `deno task agentic:sync-claude:check`. |
| Docs lint/build | yes | Repository docs tasks discovered from `deno.json`. |
| Runtime telemetry | yes | One-pass scaffold runtime E2E with raw otel/export evidence. |
| Source alignment | yes | Live Aspire 13.4.6 help and reproduction. |
| JSR/package gates | no | No published package source change. |

## Arch-Debt Implications

None. The upstream issue tracks the external defect; no NetScript architecture violation is deferred.

## Validation Plan

1. Scoped check, lint, and fmt wrappers for `.llm/tools/e2e`.
2. Focused tests covering parser/assertion behavior.
3. Claude skill sync check.
4. Docs lint/build tasks.
5. One-pass `scaffold.runtime --cleanup --format pretty` telemetry evidence, with strict semantic checks.

## Drift Watch

- If automatic discovery succeeds after a CLI update, record version drift and simplify the workaround.
- If `aspire ps` omits the isolated AppHost URL, rescope before implementing a second discovery source.
