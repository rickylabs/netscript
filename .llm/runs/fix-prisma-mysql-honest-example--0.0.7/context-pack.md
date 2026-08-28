# Context Pack: prisma-mysql-honest-example (#1112)

## Run Metadata

| Field          | Value                                                                  |
| -------------- | ---------------------------------------------------------------------- |
| Run ID         | `fix-prisma-mysql-honest-example--0.0.7`                               |
| Branch         | `fix/prisma-mysql-honest-example`                                      |
| Base           | `cf648f1ff973d74c213bb125a6f5f5b9328e693b`                             |
| Current phase  | `plan` / awaiting independent Tier-A PLAN-EVAL and coordinator rescope |
| Archetype      | `2 — Integration` (doctrine verdict Keep)                              |
| Scope overlays | `docs`                                                                 |

## Current State

Research and planning only are complete. No product file changed. The five-path census shows stale
Deno-native claims in site, README, module JSDoc, adapter comments/JSDoc, and exported legacy types.
The correct Prisma 7 flow passes `PrismaMySql` (the factory) directly to a generated Deno client and
uses `$disconnect()` in `finally`; the site currently passes the connected adapter and then
double-disposes it.

## Key Decisions

| Decision                                           | Source                                                            | Notes                                                                                                   |
| -------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Dynamic driver is npm `mysql2/promise`             | `adapter.ts:23,634`                                               | Requires Deno npm resolution + Node-compatible socket APIs and `--allow-net`.                           |
| Factory, not connected adapter, goes to Prisma     | Prisma 7 installed declarations; `PrismaMySql.connect()` contract | Corrects site lifecycle/type error.                                                                     |
| Structured fields only                             | `MySqlConnectionConfig`; `toMysql2PoolOptions`                    | No direct connection string in this package.                                                            |
| Hook contract comes verbatim from `types.ts:39-42` | #1662 shipped source                                              | Site “unsupported” warning must be removed.                                                             |
| Legacy Deno driver types are deleted               | symbol-use census                                                 | `DenoMySqlClient`, `DenoMySqlConnection`, `ExecuteResult`, `QueryResult`, `FieldInfo` are unused/stale. |
| Legacy debug namespace remains                     | `adapter.ts:30`                                                   | Observable `DEBUG=` compatibility behavior.                                                             |

## Option findings

All config fields are read. Host/port/user/password/database/poolSize/timeout map into mysql2;
`database` is Prisma metadata; `onConnectionError` is an adapter callback. The material defect is
`tls.mode: 'verify_identity'`: current code sets `ssl.ca` only when CAs exist but never forwards
mysql2 `ssl.verifyIdentity: true`, whose upstream default is false.

## Test seam and rescope

- Cleanup seam exists at the injectable `PrismaMySqlAdapter` constructor; current tests do not
  assert exactly-once close.
- Option translation has no seam: private `toMysql2PoolOptions` plus hard-wired dynamic mysql2
  import/createPool.
- The existing docs `examples_test.ts` checks only factory construction, not the published example.
- Any focused docs/package test path is a sixth product path. The plan stops and requests
  coordinator rescope rather than adding it. Implementation cannot satisfy acceptance row 5 under
  the current envelope.

## Completed

- Read live #1112 first, then re-baselined every relied-on claim at the immutable base.
- Applied harness, Archetype-2 doctrine, docs overlay, Deno/JSR, PR, tools, and RTK guidance.
- Produced exhaustive falsehood and public-option tables in `research.md`.
- Measured allowed non-runtime base gates.
- Recorded the hard five-path ceiling, two ordered slices, risks, gates, and hard-stop decisions.

## Base Gates

| Gate family          | Status            | Evidence                                                                          |
| -------------------- | ----------------- | --------------------------------------------------------------------------------- |
| Docs source/accuracy | PASS at base      | source format OK; docs accuracy scanned 199 pages but misses these contradictions |
| Existing doctest     | PASS false-green  | structured check selected 1 file; it checks only construction                     |
| Package check/test   | PASS              | structured check 12 files; structured tests 46/46                                 |
| Full export doc lint | PASS              | `./mod.ts`, zero diagnostics despite false prose                                  |
| Publish              | PASS              | raw dry-run, 8 files, no real slow-type diagnostic                                |
| JSR                  | Exit 0 + one WARN | helper counts the normal slow-type-check banner; raw dry-run is authoritative     |

## Files Changed

Only these run artifacts were created:

- `.llm/runs/fix-prisma-mysql-honest-example--0.0.7/research.md`
- `.llm/runs/fix-prisma-mysql-honest-example--0.0.7/plan.md`
- `.llm/runs/fix-prisma-mysql-honest-example--0.0.7/context-pack.md`
- `.llm/runs/fix-prisma-mysql-honest-example--0.0.7/worklog.md`
- `.llm/runs/fix-prisma-mysql-honest-example--0.0.7/drift.md`

## Next Steps

1. Topic orchestrator dispatches fresh independent Tier-A PLAN-EVAL; this generator does not.
2. Coordinator rules on a sixth test path and the `verify_identity` product correction/removal.
3. Only after a separate implementation grant, implement the two planned slices within the revised
   authorized envelope.

## Drift and Debt

- Significant rescope: focused tests/full-example doctest cannot land within five paths.
- Significant product finding: advertised TLS identity verification is not implemented.
- Process variance: explicit user artifact allowlist omits mandatory `supervisor.md`; recorded in
  `drift.md` and not overridden.
- No new architecture debt accepted.

## Commits

- See the draft PR's live commit list. No implementation commit exists.
