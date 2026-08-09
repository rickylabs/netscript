# Plan: Deno 2.9.5 toolchain standardization (#1413)

## Run Metadata

| Field | Value |
| --- | --- |
| Branch | `chore/deno-2-9-5-toolchain` |
| Phase | implement |
| Target | CI/release tooling plus `@netscript/cli` scaffold metadata |
| Archetype | 6 — CLI / Tooling |
| Scope overlays | docs/generated skill mirror |

## Archetype and doctrine

The CLI scaffold generator is Archetype 6 because it emits user-run workspace tooling. The current
doctrine verdict is `Restructure`, but this mechanical constant update neither deepens nor repairs
that existing structural debt. A1/A8/A14 apply: keep one canonical version constant, derive
downstream strings, and prove behavior/tests without adding abstractions.

## Goal

Standardize all owned Deno pins on 2.9.5 and prove that its dependency command accepts the explicit
fresh-canary policy bypass that 2.9.3 rejects.

## Scope

- Update all audited `.github` pins.
- Update the canonical scaffold constant and derive README/test expectations from it.
- Update the canonical toolchain skill and regenerate its Claude mirror.
- Produce raw, scratch-directory 2.9.3 RED and 2.9.5 GREEN command evidence.
- Run the owner-required static, test, quality, architecture, and Claude-surface gates.

## Non-Scope

- No broad `--minimum-dependency-age=0` additions and no `@canary` specifiers.
- No Aspire, containers, or CLI runtime E2E.
- No lockfile changes, dependency upgrades, release cut, publish, CI orchestration, or merge.
- No edits to OpenTelemetry 2.9.0 dependency versions or the strict-vocabulary negative fixture.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | `SCAFFOLD_DEFAULTS.DENO_VERSION` remains the single scaffold authority. | Avoid a second hardcoded pin. |
| D2 | README prose interpolates the constant and affected tests compare against it. | Generated documentation and tests cannot silently drift. |
| D3 | The age bypass is documented and demonstrated only for deliberately fresh explicit prereleases. | It is a policy bypass, not a default. |
| D4 | The skill explicitly states that `@canary` is unsupported by JSR. | Prevent invalid shorthand from entering commands/docs. |
| D5 | The Claude mirror is generated, never hand-edited. | Repository ownership contract. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Published proof version | resolved | Owner supplied `0.0.5-canary.17`. |
| Lockfile treatment | resolved | Preserve unchanged; no dependency graph mutation is required. |
| Runtime E2E | safe to defer | Explicitly prohibited; orchestrator/CI retains serialized authority. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Blind replacement corrupts unrelated 2.9.0 dependencies/fixtures. | Audit and patch each target file individually; final residue report names retained literals. |
| Proof accidentally mutates repo state. | Run both commands in a disposable directory outside the repository with isolated project files. |
| Local environment differs from brief. | Record the ownership/version drift; install only the missing 2.9.3 binary in scratch. |
| Validation churns `deno.lock`. | Compare lockfiles to baseline after proof and every gate; never stage churn. |

## Commit Slice

| # | Proves | Gate | Files |
| --- | --- | --- | --- |
| 1 | All pins, scaffold outputs/tests, and operator guidance agree on 2.9.5; the exact 2.9.3→2.9.5 behavioral claim and all required gates are evidenced. | focused tests + required owner gates + residue/lock audits | `.github/**`, CLI constant/generator/tests, canonical/generated skill, run artifacts |

## Deferred scope and debt

- Separate-session IMPL-EVAL, CI, merge, and canary remain with the milestone orchestrator.
- No new or deepened architecture debt is expected.
