# Plan: make scaffolded Fresh production builds valid at init and after database codegen

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-scaffold-build-catalog-zod--0.0.7` |
| Branch | `fix/scaffold-build-catalog-zod` |
| Phase | `plan` |
| Target | `packages/cli` generated Fresh/database scaffold output |
| Archetype | `6 - CLI / Tooling` |
| Scope overlays | `frontend` |

## Archetype

Archetype 6 applies because `@netscript/cli` ships the `init` flow and scaffold writers. The
frontend overlay applies only to the generated Fresh/Vite consumer proof; no UI behavior or visual
surface changes. The current doctrine verdict is **Keep — preserve the Archetype-6 kernel/surface
split**.

## Axioms in Play

| Axiom | Why it matters |
| --- | --- |
| A2 | The generated app boundary must contain resolvable dependency targets, not workspace-only magic a production bundler cannot interpret. |
| A7 | Use Deno/npm specifier semantics and the existing catalog constant rather than inventing a resolver. |
| A8 | Keep the repair in the existing dependency constant and database scaffolder responsibilities. |
| A9 | Preserve the Archetype 6 kernel/surface structure. |
| A14 | Semantic generated-output tests and real consumer builds preserve the contract. |

## Goal

A fresh local-source SQLite + service scaffold completes `deno task build` immediately after init
and again after standalone `db:generate`, while the workspace root remains the single Zod version
authority.

## Scope

- Add a RED semantic app-manifest regression forbidding production-route import targets that remain
  literal `catalog:` values.
- Materialize the app `zod` import as `npm:zod@${SCAFFOLD_WORKSPACE_CATALOG.zod}`.
- Seed the database's declared `schema/.generated/zod/crud.ts` entrypoint with model-specific Zod
  schemas, following the existing seeded Prisma client pattern; real codegen overwrites it.
- Update focused scaffold writer tests and any generated-output golden/file-count assertions proven
  affected.
- Prove both builds using the exact issue shell block in `.llm/tmp/`.

## Non-Scope

- Root `deno.json`, root catalog values, `deno.lock`, `.github/**`, releases, and PR #1945.
- `packages/fresh/**`: the resolver is upstream `@fresh/plugin-vite`/`@deno/loader`, not NetScript's
  Vite integration. Any upstream resolver correction is follow-up work and unnecessary here.
- Hosted `scaffold.runtime` execution locally; the owner forbids a runtime lease. Hosted CI/evaluator
  must supply that evidence.

## Hidden Scope

- The first build in the canonical shell block currently fails earlier than `catalog:` because the
  root import map promises a generated Zod barrel that init does not seed.
- The seed must use the chosen model name and be overwritten, not coexist with real generated files.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Emit an explicit app `npm:zod@<range>` target derived from `SCAFFOLD_WORKSPACE_CATALOG.zod`. | Fresh production's upstream loader returns literal `catalog:` while native Deno materializes it. The explicit npm target is accepted by both and retains one version constant. |
| D2 | Keep `SCAFFOLD_WORKSPACE_CATALOG` at the generated root. | Other workspace members use native Deno resolution correctly; removing the catalog would discard centralized authority without fixing the bundler boundary. |
| D3 | Seed a minimal model-specific `crud.ts` Zod contract at init, overwritten by `db:generate`. | It makes the already-declared consumer entrypoint truthful and mirrors the existing seeded Prisma client lifecycle without running networked codegen during init. |
| D4 | PLAN-EVAL is N/A. | Issue #1971 plus exact reproduction and resolver differential fully determine contract, scope, alternatives, and gates; no material design choice remains open. |

### Rejected alternatives

- Teach `packages/fresh` to rewrite `catalog:`: rejected because NetScript's plugin does not own the
  failing resolution and the brief requires a stop rather than scope widening if it did.
- Preserve the app `catalog:` target and rely on dev/check: rejected by the production SSR error.
- Duplicate a hard-coded Zod range in another writer: rejected because it creates competing version
  authorities.
- Run Prisma/Zod codegen during init: rejected because init would become network/toolchain dependent
  and the established scaffold uses disposable placeholders.

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Exact placeholder schema fidelity before codegen | Safe to defer | It is explicitly a build/type bootstrap and is replaced before database use; it must expose the same three named Zod schemas. |
| Upstream `@deno/loader` catalog support | Safe to defer | Explicit app npm materialization is a stable consumer boundary and no `packages/fresh` change is required. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| App and root Zod versions drift. | Derive both from `SCAFFOLD_WORKSPACE_CATALOG.zod` and test equality against the repository root catalog. |
| Placeholder survives codegen. | Use the exact `crud.ts` path already overwritten by `runWriteCrudZodBarrel`; repeat the post-codegen build. |
| Scaffold file inventory changes break snapshots. | Run focused database/init scaffold tests and update semantic inventory assertions only where affected. |
| Fix only works in one import mode. | Writer test both JSR and local output; consumer proof uses required local-source mode. |
| Hosted runtime regression remains unknown. | Open non-draft after RED+GREEN push so hosted tiers run; leave hosted/evaluator DoD boxes unticked. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| AP-18 | Risk | Assert parsed manifest semantics and named scaffolded file content, not giant snapshots. |
| AP-2/AP-9 | Risk | Do not introduce a general catalog resolver for one known app boundary. |
| AP-11/AP-25 | Avoided | Keep file IO in the existing scaffolder adapter. |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| F-1..F-19 + F-CLI-1..31 | Yes | `deno task quality:gate`, scoped check/lint/fmt, and focused tests. |
| F-6/F-7 | Yes | No public-surface change; CLI publish/doc evidence or recorded baseline debt. |
| Generated consumer | Yes | Exact local scaffold, both app builds exit 0, codegen exits 0. |
| `scaffold.runtime` | Hosted | Required by scaffold-output policy, but prohibited locally by owner; hosted result/evaluator must complete it. |

## Arch-Debt Implications

| Entry | Action | Notes |
| --- | --- | --- |
| Existing CLI debts | None | No debt is created, deepened, or closed. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | RED | Structured test wrapper on changed manifest test | Exit 1 on literal `catalog:`. |
| 2 | Focused GREEN | Structured test wrapper on app catalog/config and database scaffolder tests | Exit 0. |
| 3 | Consumer | Exact #1971 shell block | Init/build/codegen/build: `0/0/0/0`. |
| 4 | Scoped static | Requested check/lint/fmt wrappers | Exit 0 each. |
| 5 | Doctrine | `deno task quality:gate` | Exit 0. |
| 6 | Assets | `deno task check:assets-barrel` only if a template/asset changes | Exit 0 or N/A. |
| 7 | Final static | `deno task check` | Exit 0. |
| 8 | Durable receipts | Exact-head allowlisted gate runner for required local gates | PASS receipts tied to final head. |
| 9 | Hosted/eval | CI tiers and separate-session IMPL-EVAL | Pending at generator stop. |

## Dependencies

- Existing `SCAFFOLD_WORKSPACE_CATALOG` and database scaffolder contracts.
- Fresh 2.3.3 / plugin-vite 1.1.2 / @deno/loader 0.4.0 consumer behavior.

## Drift Watch

- Any need to edit `packages/fresh`, root configuration, locks, or workflows is a blocking rescope.
- Any additional generated app `catalog:` target must be recorded and included in the semantic rule.

