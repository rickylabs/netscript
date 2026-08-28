# Plan: honest executable MySQL Prisma adapter example (#1112)

## Run Metadata

| Field          | Value                                                 |
| -------------- | ----------------------------------------------------- |
| Run ID         | `fix-prisma-mysql-honest-example--0.0.7`              |
| Branch         | `fix/prisma-mysql-honest-example`                     |
| Immutable base | `cf648f1ff973d74c213bb125a6f5f5b9328e693b`            |
| Phase          | `plan` — implementation not granted                   |
| Target         | `@netscript/prisma-adapter-mysql` public docs/surface |
| Archetype      | `2 — Integration`                                     |
| Scope overlays | `docs`                                                |
| Issue          | `#1112`, milestone `0.0.7`                            |

> **HARD PATH CEILING:** implementation may modify only the following five product paths:
>
> 1. `docs/site/reference/prisma-adapter-mysql/index.md`
> 2. `packages/prisma-adapter-mysql/README.md`
> 3. `packages/prisma-adapter-mysql/src/adapter.ts`
> 4. `packages/prisma-adapter-mysql/src/mod.ts`
> 5. `packages/prisma-adapter-mysql/src/types.ts`
>
> A sixth product path is a rescope. Stop and return to the topic coordinator; do not add a test,
> fixture, changelog, generated asset, config, or tool path opportunistically.

## Archetype and doctrine verdict

This is Archetype 2 because the package adapts the external mysql2 system to Prisma's driver-adapter
port. The docs overlay applies because the central output is one source-aligned story across site,
README, and `deno doc` module documentation. The current doctrine verdict is **Keep**: preserve the
MySQL implementation behind the database-owned port. A1/A2 require a truthful public type/manual
surface; A10 requires the factory to make lifecycle ownership explicit; A14 requires compile,
semantic-test, doc-lint, and publish evidence.

In-scope anti-patterns are AP-11 (no hidden pool ownership), AP-14 (do not present upstream mysql2
as a NetScript-owned/native surface), AP-19 (runtime/npm/Node compatibility and `--allow-net` must
be declared), and AP-25 (driver/network effects stay at the adapter edge). F-5/F-6/F-7/F-9/F-14/F-15
and the scoped-source F-19 gate shape apply, along with the broader Archetype-2 matrix.

## Goal

Make the site, README, and published module surface tell the same executable truth: construct the
`PrismaMySql` factory from structured options, pass that factory to a generated Deno Prisma client,
run one query, and always `$disconnect()`; mysql2 is dynamically imported and owns the actual pool,
and the shipped connection-error hook has the exact classifier/containment behavior already
published by `types.ts`.

## Scope

- Correct every Deno-native / `deno_mysql` prose occurrence enumerated in `research.md`.
- Remove the unused legacy Deno driver types and their root re-exports/site table.
- Keep the observable legacy debug namespace unchanged.
- Correct the site, README, module JSDoc, and adapter JSDoc examples as one coordinated slice so
  factory/connection/lifecycle prose cannot diverge.
- Document structured options only, pool ownership, initial-connect timeout semantics, TLS behavior,
  dynamic npm import, Deno Node/npm compatibility, `--allow-net`, and deployment consequences.
- Replace the false unsupported-hook warning with the exact `onConnectionError` contract from
  `types.ts:39-42`.
- Correct `tls.mode: 'verify_identity'` to produce mysql2 identity-verification behavior if and only
  if the coordinator authorizes the product/test rescope described below.

## Non-Scope

- Any sixth product path, including existing docs/package test files, changelog, config, lockfile,
  generated client, examples directory, or validation tooling.
- Live MySQL, runtime, Aspire, Docker, browser, `e2e:cli`, release gates, or an expensive-gate
  lease.
- Connection-string support in this low-level factory; callers use structured fields. Higher-level
  `@netscript/database` normalization is not changed.
- Arbitrary Prisma adapters (#1101), #1664, or any mutation/rewording of #1293.
- Renaming `prisma:driver-adapter:deno-mysql`; it is observable compatibility behavior.
- PLAN-EVAL dispatch from this generator session. The topic orchestrator owns the fresh Tier-A
  evaluator.

## Locked Decisions

| ID  | Decision                                                                                                                                                                                                        | Rationale                                                                                                        |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| D1  | Describe the driver as dynamically imported npm `mysql2/promise`, never Deno-native.                                                                                                                            | `adapter.ts:23,634` is the implementation authority.                                                             |
| D2  | The complete example passes the `PrismaMySql` factory directly to Prisma; it does not call `connect()` first.                                                                                                   | Prisma 7's `adapter` option requires `SqlDriverAdapterFactory`.                                                  |
| D3  | Use an actual generated-Deno-client import shape ending in `schema/.generated/client.server.ts`; remove ambient/fake `PrismaClient` declarations.                                                               | The example must be import-correct and match NetScript generator output.                                         |
| D4  | Normal deterministic cleanup is `try/finally { await prisma.$disconnect(); }`. Direct `factory.connect()` callers are documented separately as owners of `connected.dispose()`.                                 | Prevents the current connected-adapter type error and double-disposal story.                                     |
| D5  | Direct constructor form is structured `MySqlConnectionConfig`; no connection string is accepted.                                                                                                                | The public type and translation function expose fields only.                                                     |
| D6  | `timeout` means mysql2 initial `connectTimeout` only; it is not a query/transaction/idle deadline.                                                                                                              | Exact mapping at `adapter.ts:735` and mysql2's installed declaration.                                            |
| D7  | Pool default remains adapter-owned `poolSize ?? 1`, mapped to `connectionLimit`; `$disconnect()` closes it through `dispose()`/`pool.end()`.                                                                    | Exact mappings at `:733`, `:451-458`, and `:700-702`.                                                            |
| D8  | Site hook wording is derived from `types.ts:39-42` without broadening it: fatal handshake/transport, 1040/1203, closed transport/pool codes; 1045/1044/1049 only when driver-fatal; callback failure contained. | #1662 shipped this contract; the site warning is stale.                                                          |
| D9  | Delete `DenoMySqlClient`, `DenoMySqlConnection`, `ExecuteResult`, `QueryResult`, and `FieldInfo`, plus the three root re-exports and site driver-interface table.                                               | They are unused legacy deno_mysql residue and make the published surface false.                                  |
| D10 | Correct the two internal `deno_mysql` comments.                                                                                                                                                                 | They are not published, but they are false maintenance guidance inside an explicitly allowed path.               |
| D11 | Leave `Debug('prisma:driver-adapter:deno-mysql')` unchanged and identify it as a legacy namespace in review notes.                                                                                              | Changing it alters users' `DEBUG=` filters and is not a prose cleanup.                                           |
| D12 | If authorized, map `tls.mode: 'verify_identity'` to mysql2 `ssl.verifyIdentity: true`, adding joined `ca` only when supplied.                                                                                   | Current mapping does not implement the accepted option's name; mysql2 disables identity verification by default. |

## Open-Decision Sweep

| Decision                                                               | Status                                            | Notes                                                                                                                                             |
| ---------------------------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sixth path for full-example doctest                                    | Must resolve now                                  | Existing `docs/.../examples_test.ts` checks only construction. Expanding it is a sixth path and a rescope.                                        |
| Sixth path for focused option translation / exactly-once cleanup tests | Must resolve now                                  | Cleanup injection exists; translation injection/export does not. Any package test path is outside the ceiling.                                    |
| TLS behavior correction versus remove/deprecate                        | Must resolve now                                  | Documentation cannot make current `verify_identity` semantics true. D12 is recommended, but requires coordinator authorization and focused tests. |
| Legacy public-type removal changelog                                   | Safe to defer only by explicit coordinator ruling | `CHANGELOG.md` is outside the ceiling. The pre-1.0 deletion must still be called out in PR scope/review.                                          |
| Debug namespace rename                                                 | Resolved: leave                                   | Observable compatibility takes precedence over cosmetic consistency.                                                                              |

Implementation is blocked until the “must resolve now” rows are decided. This plan does not smuggle
their paths into a slice.

## Planned coherent examples

All three published examples (site, README, module JSDoc) will share this semantic sequence, with
only the relative generated-client path adapted to context:

1. Import `PrismaMySql` from `@netscript/prisma-adapter-mysql` and `PrismaClient` from the generated
   Deno client entrypoint.
2. Construct one `PrismaMySql` factory with supported structured fields and optional
   `onConnectionError` in the second options object.
3. Construct `new PrismaClient({ adapter })` with the factory.
4. Run one schema-independent raw query such as typed `$queryRaw`/`$queryRawUnsafe("SELECT 1")` as
   allowed by the generated client surface.
5. Use `finally` to call `$disconnect()` exactly once.

The surrounding text will distinguish direct package structured options from higher-level
connection-string normalization, state pool/default/cleanup ownership, and make the Deno/npm/Node
compatibility requirement an explicit deployment prerequisite rather than a “fully compatible”
promise.

## Commit slices

| # | What the slice proves                                                                                                                        | Five-path files only                                          | Proving gates                                                                                                                                                               |
| - | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 | The published TypeScript surface no longer advertises deno_mysql, the TLS mode is honest if authorized, and public docs render/lint cleanly. | `src/types.ts`, `src/mod.ts`, `src/adapter.ts`; run artifacts | Structured package check/test/lint/fmt; full export-map doc lint; quality/architecture checks; publish dry-run; JSR audit; explicit legacy-debug assertion.                 |
| 2 | Site and README carry the same import-correct factory/query/cleanup contract and exact hook/runtime/options story.                           | site `index.md`, package `README.md`; run artifacts           | Full-example doctest **only after rescope**, docs source format, docs accuracy, package check/test, full doc lint, publish dry-run, JSR audit, cross-file falsehood census. |

No implementation slice may start from this planning turn. After the topic's independent Tier-A
PLAN-EVAL and the coordinator's rescope decision, an implementation grant must preserve this order:
contract/source first, then the synchronized site/README story.

## Gate Plan

| Order | Gate                    | Command/check                                                                                                                                             | Expected result                                                                                                                  | Base state / newness                                                                                           |
| ----- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 1     | Full example doctest    | Coordinator-authorized focused test that compiles the exact site/README/module sequence against the generated-client/Prisma adapter contract              | Import, factory type, query, and cleanup all type-check                                                                          | **New and currently blocked.** Existing one-file doctest is green but checks only config/factory construction. |
| 2     | Docs source format      | `deno task --cwd docs/site check:source-format`                                                                                                           | `Docs source format: OK`                                                                                                         | Already green at base.                                                                                         |
| 3     | Docs accuracy           | `deno task docs:accuracy`                                                                                                                                 | PASS                                                                                                                             | Already green at base; insufficient alone.                                                                     |
| 4     | Package check           | structured `.llm/tools/run-deno-check.ts --root packages/prisma-adapter-mysql --ext ts`                                                                   | Non-empty selection, zero diagnostics                                                                                            | Already green, 12 files.                                                                                       |
| 5     | Package focused tests   | structured `.llm/tools/run-deno-test.ts -- --allow-all packages/prisma-adapter-mysql/tests` plus coordinator-authorized focused translation/cleanup cases | Existing 46 plus new cases all pass without live MySQL                                                                           | Existing suite green; **new cases blocked by sixth-path ceiling**.                                             |
| 6     | Package lint            | structured `.llm/tools/run-deno-lint.ts --root packages/prisma-adapter-mysql --ext ts`                                                                    | Zero findings                                                                                                                    | To run on implementation head.                                                                                 |
| 7     | Package format          | structured `.llm/tools/run-deno-fmt.ts --root packages/prisma-adapter-mysql --ext ts`                                                                     | Zero findings                                                                                                                    | To run on implementation head; no mutating root fmt.                                                           |
| 8     | Full export-map docs    | `deno task doc:lint --root packages/prisma-adapter-mysql --pretty`                                                                                        | Root `./mod.ts`, zero diagnostics                                                                                                | Already green but semantically false; must remain green after cleanup.                                         |
| 9     | Code quality/doctrine   | `deno task quality:gate` (or its durable gate equivalent)                                                                                                 | No new quality/doctrine findings                                                                                                 | Required because allowed scope includes `packages/**`; no E2E implication.                                     |
| 10    | Publish dry-run         | `deno task --cwd packages/prisma-adapter-mysql publish:dry-run`                                                                                           | Success, intended eight-or-fewer file list, no real slow-type diagnostic                                                         | Raw authoritative gate already green.                                                                          |
| 11    | JSR audit               | `audit-jsr-package.ts --root packages/prisma-adapter-mysql --text`                                                                                        | Exit 0; interpret banner-count warning against raw dry-run                                                                       | Base exit 0 with one known banner false-positive.                                                              |
| 12    | Driver falsehood census | Focused `rg` across exactly five paths                                                                                                                    | No `Deno-native`/`deno_mysql` prose or exports remain; only the explicitly allowlisted legacy debug string contains `deno-mysql` | New leaf-specific manual/content gate.                                                                         |
| 13    | Git/lock/path truth     | Direct git status/diff plus exact five-path allowlist                                                                                                     | No lock churn, no sixth product path, run artifacts current                                                                      | New leaf-specific close check.                                                                                 |

No runtime/backend test is planned: the brief prohibits it and the required focused behavior should
be proven through seams. `e2e:cli` is explicitly excluded.

## Risk Register

| Risk                                               | Mitigation                                                                                                                  |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Example still looks plausible but does not compile | Require exact snippet/doctest evidence; do not accept the existing construction-only test.                                  |
| Prisma lifecycle is double-disposed                | Pass the factory, not connected adapter; only `$disconnect()` in normal flow; document direct-connect ownership separately. |
| Driver prose is fixed in one place only            | Treat the five-path census as one slice contract and rerun the focused search.                                              |
| TLS option remains a semantic lie                  | Block implementation until D12/remove/deprecate is authorized and focused tests can land.                                   |
| Public legacy-type deletion surprises consumers    | Call out pre-1.0 export removal explicitly; do not rename the debug namespace; coordinator rules on excluded changelog.     |
| “Full compatibility” hides deployment constraints  | Use requirements language: npm resolution, Node-compatible socket APIs, network permission, generated Prisma 7 client.      |
| Green generic gates mask stale docs                | Record base false-greens and require the new exact content/doctest gates.                                                   |

## Arch-debt implications

- Current doctrine verdict remains Keep; no new architecture debt is accepted by this plan.
- The testability gap is a rescope, not debt to hide in prose.
- The JSR audit's banner-count warning is not a package slow-type failure; raw publish output is the
  authority.

## Deferred scope / coordinator rescope

1. A full-example test modification under
   `docs/site/reference/prisma-adapter-mysql/examples_test.ts` (sixth path).
2. Focused adapter tests under `packages/prisma-adapter-mysql/tests/` (sixth path).
3. A connection-option translation seam/injected mysql2 pool factory if the evaluator decides a
   private/exported translation function is insufficient; this is a product-design rescope, not an
   assumption.
4. Any changelog path for legacy export deletion.

## PLAN-EVAL handoff

PLAN-EVAL is selected because the TLS behavior and frozen-path/test conflict are decision-heavy.
This generator does not launch it. The topic orchestrator must dispatch a fresh independent Tier-A
session. Until that verdict and the coordinator's rescope decision exist, implementation remains a
hard stop.
