# Plan: emitted fail-fast for declared background references

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-aspire-declared-reference-fail-fast--1371` |
| Branch | `fix/aspire-declared-reference-fail-fast` |
| Phase | `plan` |
| Target | `packages/cli` Aspire background helper generator |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | `service` |

## Archetype

Archetype 6 applies because the changed package emits user-run Aspire AppHost tooling. The service overlay applies because the generated helper wires background/service resources. No runtime lease is granted, so its runtime gates are explicitly N/A for this correction.

## Current Doctrine Verdict

`packages/cli`: **Keep** — preserve the Archetype-6 kernel/surface split.

## Axioms in Play

| Axiom | Why it matters |
| --- | --- |
| A13 | Declared dependency failures must cross an explicit startup boundary instead of being swallowed. |
| A14 | RED-first emitted-module tests pin the configuration failure and consumer key contract. |

## Goal

Make every declared background service/plugin reference fail deterministically before processor registration when its resource or `http` endpoint is unresolvable, while preserving successful environment binding and the raw discovery key.

## Scope

- Change only `generate-register-background.ts`.
- Add one focused test file under the existing Aspire helper tests.
- Keep the slotted template unchanged unless the canonical asset-barrel check proves regeneration is required.

## Non-Scope

- Apps/plugins registration, #1365, browser key normalization, SDK discovery, generated asset hand-editing, runtime E2E, Aspire, Docker, and publishing.

## Hidden Scope

- Preflight must occur before `builder.addExecutable`, not merely before insertion into the returned map.
- Service and plugin references can share a name, so emitted endpoint identifiers must remain kind-distinct.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Emit reference endpoint preflight before `builder.addExecutable`. | A misconfigured processor must never be registered. |
| D2 | Throw `Background processor configuration error: '<processor>' could not resolve <kind> reference '<ref>' HTTP endpoint.` | Deterministic; names processor, kind, and reference; same message covers missing resource and endpoint. |
| D3 | Preserve `services__<ref>__http__0` with raw hyphens for both kinds. | Published verification proved emitter, Aspire, and SDK consumer agree. |
| D4 | Use one new emitted-module test file with local doubles. | Meets runtime-style coverage without extra product/test support files. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Error class | safe to defer | The admitted contract requires a deterministic configuration error message; emitted helpers have no shared configuration-error class. |
| Runtime lease | safe to defer | Explicitly unavailable; static emitted-module execution is the admitted proof. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Endpoint preflight accidentally occurs after resource creation. | Runtime double records `addExecutable` calls; negative tests assert zero calls, plus emitted ordering assertion. |
| Key normalization drifts. | Compare both emitted service/plugin keys with `createServerServiceEnvKey('workers-api')`. |
| Same service/plugin reference collides in generated identifiers. | Emit kind-qualified endpoint identifiers. |
| Generated asset barrel moves. | Run `check:assets-barrel`; regenerate canonically only if required, otherwise stop on unexpected movement. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| AP-10 | existing risk | Replace silent optional/guard behavior with an explicit throw at the startup boundary. |
| AP-18 | risk | Assert semantic runtime calls and exact contract fragments, not a whole generated-string snapshot. |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| F-6 | yes | CLI publish dry run and per-member JSR audit, existing WARN baseline disclosed |
| F-10 | yes | One focused test file under the existing test folder |
| F-19 | yes | Structured focused and root wrappers |
| Quality/doctrine | yes | `quality:scan` remains `allowCount: 7`; `arch:check` passes |

## Arch-Debt Implications

| Entry | Action | Notes |
| --- | --- | --- |
| None | none | No new or deepened doctrine debt. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | RED focused test | structured test wrapper over new test file | FAIL on missing deterministic throws/preflight |
| 2 | Focused test/check | structured test/check wrappers over changed files | PASS |
| 3 | Root static | `deno task check`, `test`, `lint`, `fmt:check` | PASS |
| 4 | Quality/doctrine/assets | `quality:scan`, `arch:check`, `check:assets-barrel` | PASS; allowCount 7; no generated movement |
| 5 | Publish/audit | CLI publish dry run and per-member CLI JSR audit | PASS with existing WARN baseline disclosed |

## Drift Watch

- A seventh product/test support file, asset-barrel movement, or an existing consumer expectation broken by fail-fast is a rescope stop.
- The requested `.llm/harness/gates/implementation-gate.md` is absent at the supplied base; use canonical `static-gates.md` and record the documentation mismatch in drift.
