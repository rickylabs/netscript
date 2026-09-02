# Plan: config-aware installed workers registry generation

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-workers-config-registry--1451-g` |
| Branch | `feat/workers-config-aware-registry` |
| Phase | `implement` (clustered PLAN-EVAL already passed) |
| Target | `plugins/workers` plus installed-generator CLI integration test |
| Archetype | 5 — Plugin Package, with Archetype-6 generator edge |
| Scope overlays | none |

## Archetype

Archetype 5 is authoritative because the owned product surface is the first-party workers plugin.
The `src/cli` generator is the Archetype-6 edge identified by the clustered plan; no generic CLI
production flow changes.

## Current Doctrine Verdict

`plugins/workers`: **Refactor** — complete connector thinness and the jobs/worker contribution
split. This slice does not restructure that existing debt; it keeps policy validation in
`@netscript/plugin-workers-core` and adds only adapter wiring.

## Axioms in Play

| Axiom | Why it matters |
| --- | --- |
| A1 | The typed normalized config option and generated definition shape precede implementation. |
| A7 | Path resolution uses `@std/path`; no hand-rolled path parser. |
| A9 | The plugin remains thin over core-owned config conventions. |
| A14 | Semantic generation tests, doc lint, publish dry-run, quality, and architecture gates prove the slice. |

## Goal

Generate installed workers `jobDefinitions` from real project workers policy while retaining
manifest-based discovery and consuming core-normalized config exactly once.

## Scope

- Load project config at the workers generator entry edge.
- Validate `config.workers` once with `WorkersConfigSchema` and pass normalized data inward.
- Bind normalized policy to discovered local/plugin files by canonical project-relative path.
- Enforce D6 conflicts and D7 grouped-over-flat precedence with actionable diagnostics.
- Preserve normalized job fields in generated runtime definitions and prove startup consumption.

## Non-Scope

- No root config-schema ownership change, generic CLI production change, manifest policy, or second
  policy manifest.
- No legacy `registry-compiler.ts` parity implementation.
- No runtime E2E, Aspire, Docker, browser, or local scaffold runtime execution.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D5 | Load with `loadConfig({ cwd: projectRoot })`, parse only `workers` with core `WorkersConfigSchema`, pass `WorkersConfigData \| undefined` inward. | One validation owner; generic host remains plugin-agnostic. |
| D6 | Canonical project-relative entrypoint is the binding key; discovery verifies source and plugin identity, config supplies local id and policy. | Prevents basename/id drift from binding policy to the wrong module. |
| D7 | Resolve grouped jobs first; same-identity flat policy is wholly shadowed, partial collisions fail. | Group topic is canonical and ordering cannot change policy. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Legacy compiler parity | safe to defer | Explicit clustered-plan follow-up; different backend. |
| Hosted runtime smoke | safe to defer | Owner bound it to hosted merge-readiness lane. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Generator duplicates Slice C defaults/validation | Generator accepts only normalized `WorkersConfigData`; tests use zero concurrency and full policy literals. |
| Windows/dot path drift | Normalize separators, resolve dot segments, compare canonical project-relative paths. |
| Silent wrong policy binding | Fail unmatched, source mismatch, duplicate identity, and partial id/path collisions with both identities in diagnostics. |
| Existing generation behavior regresses | Pin no-config, absent-workers, and unconfigured-job generic-default tests. |
| Installed integration accidentally fetches or adds a policy manifest | Use local workspace resolution, fetch-rejecting seam, real `netscript.config.ts`, and the existing manifest only for discovery. |
| Lock churn | Compare working/base hash after every dependency/gate step; stop on any change. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| AP-9 | risk | Do not invent a second config schema or policy abstraction. |
| AP-14 | risk | Import core-owned `WorkersConfigSchema`/types; do not redefine them. |
| AP-18 | risk | Import generated modules and assert semantic maps/fields, not whole-string snapshots. |
| AP-25 | risk | Keep config I/O at the CLI entry edge; the inward matcher consumes normalized data. |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| F-3/F-5 | yes | `arch:check`, doc-lint A/B, manual public-surface review |
| F-6/F-7 | yes | plugin publish dry-run and doc-lint zero-new comparison |
| F-10/F-19 | yes | focused structured check/test/lint/fmt wrappers |
| Code quality | yes | `deno task quality:gate` |

## Arch-Debt Implications

| Entry | Action | Notes |
| --- | --- | --- |
| `plugins/workers — doctrine verdict Refactor` | none | Existing structural debt is not deepened or closed. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | focused tests | structured test wrapper for new plugin test + installed integration | all pass |
| 2 | static | scoped structured check/lint/fmt wrappers | pass |
| 3 | docs | plugin + CLI `doc:lint` A/B | plugin 20 unchanged; CLI 0 |
| 4 | JSR | plugin audit + `publish:dry-run` | pass / zero new findings |
| 5 | quality | `deno task quality:gate` | pass |
| 6 | dependency/lock | `deps:why @netscript/config`, Git blob/hash comparison | declared usage; unchanged lock |

## Drift Watch

- Any need for an eighth product file, generic CLI production edit, policy in
  `scaffold.runtime.json`, duplicate constraint/default, or local runtime execution.
