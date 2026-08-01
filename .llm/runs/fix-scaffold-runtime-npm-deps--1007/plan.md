# Plan: install scaffold runtime npm dependencies

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-scaffold-runtime-npm-deps--1007` |
| Branch | `fix/scaffold-runtime-npm-deps` |
| Phase | `plan-eval` |
| Target | `packages/cli` scaffold output |
| Archetype | `6 - CLI kernel / scaffold generator` |
| Scope overlays | `frontend` |

## Archetype

Archetype 6 applies because the change modifies a CLI kernel constant that defines generated project configuration. The consumer is a Fresh/Vite frontend, so generated-output and runtime evidence are required.

## Current Doctrine Verdict

The CLI remains under the doctrine's bounded restructure verdict. This fix preserves the kernel boundary and changes only scaffold-output policy plus its contract test.

## Axioms in Play

| Axiom | Why it matters |
| --- | --- |
| A1 | A generated app must be independently runnable outside the monorepo. |
| A3 | One canonical version source prevents dependency drift. |
| A7 | Consumer behavior and published-artifact evidence outrank warm-workspace success. |

## Goal

Ensure generated Fresh apps directly install the runtime npm subset needed by `@netscript/fresh`/`@netscript/sdk`, preventing cold Vite SSR HTTP 500 failures.

## Scope

- Add the existing Fresh runtime dependency subset to `SCAFFOLD_APP_CATALOG` and `SCAFFOLD_APP_IMPORTS`.
- Add a regression test that checks root catalog, Fresh manifest, scaffold catalog/import-map consistency.
- Preserve the lockfile update caused by the already-landed Fresh/SDK manifest dependency declarations if validation confirms it.

## Non-Scope

- No package export or runtime implementation changes.
- No dependency upgrades; versions come from the current root catalog.
- No canary publication or merge.

## Hidden Scope

- Published CLI cold-install proof and Aspire HTTP behavior.
- Root CLI lint/fmt tasks exclude `packages/cli`; scoped wrappers are required.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Runtime subset is `@preact/signals`, `@tanstack/preact-query`, `@tanstack/query-core`, `@tanstack/react-db`, and `vite`. | Reuses the existing Fresh manifest contract rather than creating another list. |
| D2 | Scaffold values mirror root catalog values and emit `npm:` imports. | Deno catalogs are npm-only workspace indirection, not generated output syntax. |
| D3 | Test the three authorities together. | The defect survives when any pair drifts silently. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Include full Fresh imports | safe to defer | Only runtime npm subset is required. |
| Modify SDK manifest | safe to defer | #1006 already changed it; this task consumes the resulting runtime need. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| A warm cache hides the failure | Assert generated imports and use pristine external app/Aspire proof. |
| Version literals drift | Compare exact normalized npm ranges against root catalog. |
| Expensive runtime gate leaves resources | Use `--cleanup`; inspect Aspire/container state before and after. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| AP-8 duplicated dependency truth | risk | Root catalog remains canonical; regression test enforces mirrors. |
| AP-12 workspace-only success | existing | Add consumer-output contract and cold app proof. |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| F-CLI-OUTPUT | yes | Generated dashboard `deno.json` contains exact runtime imports. |
| F-CONSUMER | yes | Aspire app home returns 200 with real HTML. |
| F-E2E | yes | Full `scaffold.runtime` passes with cleanup. |

## Arch-Debt Implications

| Entry | Action | Notes |
| --- | --- | --- |
| none | none | Fix remains inside the intended CLI kernel scaffold boundary. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | focused tests | relevant CLI/Fresh Deno tests | pass |
| 2 | scoped static | run-deno-check/lint/fmt for `packages/cli` | pass |
| 3 | quality | `deno task quality:gate` | pass or recorded unrelated debt |
| 4 | JSR | CLI doc/publish audit gates | pass or recorded pre-existing debt |
| 5 | pristine consumer | generate externally, restore/start Aspire, probe HTML | HTTP 200, non-empty HTML |
| 6 | merge runtime | `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` | pass |

## Risks

- The production failure depends on cold installation state; structural import assertions are the deterministic regression signal.

## Dependencies

- Issue #1007; production run 30677734061; current root dependency catalog.

## Drift Watch

- Any runtime dependency beyond the existing Fresh list, changed generated config shape, or cold-app failure after imports are present.

