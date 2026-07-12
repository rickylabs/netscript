# Plan: durable OpenRouter agentic lanes

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-agentic-openrouter-lanes--codex` |
| Branch | `fix/agentic-openrouter-lanes` |
| Phase | `plan` |
| Target | `.llm/tools/agentic` internal CLI/runtime tooling |
| Archetype | `6 - CLI / Tooling` |
| Scope overlays | none |

## Archetype

Archetype 6 is the smallest fit because the changed surface composes external CLIs, materializes runtime configuration, and exposes user-run provider canary commands. This is not a published package wave.

## Current Doctrine Verdict

N/A for internal harness tooling; preserve existing adapter/port boundaries and volatile-config rules.

## Goal

Make at least one OpenRouter GLM 5.2 agentic lane complete a real bounded turn, fix Codex profile/thread exit behavior, and make every OpenRouter preset machine-checked without secrets in CI.

## Scope

- Codex launcher profile materialization, supported Responses-only configuration, v0.144 thread parsing, and truthful exit codes.
- Claude/OpenRouter launch viability or structured incompatibility, with at least one real GLM lane proven.
- Explicit preset capabilities and exhaustive cheap canary coverage, with opt-in live turns.
- Tests, run evidence, documentation, and PR lifecycle artifacts.

## Non-Scope

- Provider promotion or production rollout owned by #582.
- Native Claude remote control over OpenRouter.
- Changes to design umbrella PR #685.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Materialize isolated Codex profile files from the existing adapter; never emit legacy `[profiles.*]` or `wire_api = "chat"`. | Codex 0.144 accepts named config files and Responses only. |
| D2 | Successful process completion exits 0 even if identity metadata is unavailable; identity absence remains structured evidence, not a fabricated failure. | Exit status must represent the completed turn. |
| D3 | Provider/preset support is finite typed data, including explicitly unsupported capabilities and reasons. | Prevent silent stubs and repeated live failures. |
| D4 | Static preset canaries are exhaustive and credential-free; live turns require an explicit flag and bounded prompt. | CI catches configuration drift without spend. |
| D5 | Accept only a live GLM turn with non-empty structured completion as lane viability evidence. | Empty exit-0 output is not success. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Codex vs Claude as viable GLM lane | must resolve now | Decide by bounded live probes; encode the losing lane as unsupported if proven. |
| OpenRouter Anthropic base path/model mapping | must resolve now | Probe without printing credentials. |
| Remote control for custom Claude route | safe to defer | Remains explicitly unavailable. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Secret leakage | Source env file in a private child shell; record only redacted structured evidence. |
| Accidental provider spend | One-shot bounded prompts; live mode opt-in. |
| CLI-version drift | Parser fixtures for v0.144 output and capability diagnostics. |
| False-green static canary | Validate every preset, adapter launch plan, supported wire API, and live-mode opt-in. |
| Lock churn | Use `--no-lock`; inspect diff before every commit. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| AP-11 / AP-25 | risk | Keep filesystem/process/network effects in adapters/CLI edges. |
| AP-18 | risk | Assert semantic argv/config/events rather than giant snapshots. |
| AP-24 | risk | Use typed preset capability records, not scattered model switches. |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| Static | yes | scoped check/lint/fmt wrappers over `.llm/tools/agentic`. |
| F-1/F-3/F-5/F-10/F-11/F-12/F-15..F-19 | yes | focused tests plus `arch:check` where applicable; internal-tooling N/A recorded where package-only. |
| F-CLI-1..31 | reviewed | focused structural/manual evidence; no new CLI architecture layer. |
| Runtime | yes | provider canary smoke and one redacted live GLM turn. |
| Consumer | yes | launcher/client/profile and preset-runner tests. |

## Arch-Debt Implications

None expected. Any provider incompatibility is a present capability fact, not deferred implementation debt, when encoded and tested.

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | Focused tests | `deno test --no-lock --allow-all <affected *_test.ts>` | pass |
| 2 | Static | scoped check/lint/fmt wrappers, root `.llm/tools/agentic`, `--ext ts` | pass |
| 3 | Canary | `deno task agentic:provider-canary` static preset mode | all presets checked |
| 4 | Live | explicit live GLM one-shot using private env | non-empty successful completion |
| 5 | Volatile guard | relevant config/no-hardcoded test | pass |

## Dependencies

- Installed Codex 0.144.1 and Claude CLI.
- `~/.config/netscript-agentic/openrouter.env`, read without outputting its value.

## Drift Watch

- CLI output/config behavior differing from the reported 0.144.1 failures.
- OpenRouter endpoint/model compatibility changing during the run.
