# Context pack — scaffold-generated-output-correctness

- Direct-to-`main` Wave 0 fixes leaf for #1262, #1263, and #1588.
- Immutable base: `01e0960494c95ce56eb35892c211a095eb13e6ed`.
- Topic orchestrator: `/home/codex/repos/netscript-007-fixes`, run
  `.llm/runs/release-0.0.7-fixes--orchestration/`.
- Approved coordinator artifacts:
  `/home/codex/repos/netscript-547-lffix/.llm/runs/release-0.0.7--orchestration/`.
- No upstream; explicit push refspec only; draft PR against `main`; no merge or publication.
- Draft PR: #1654, labeled with exactly one phase label, `status:impl`, and milestone `0.0.7`.
- Housekeeping intake head: `42572af323e396d061d8b2e99e0f6a4c62076c31`; local and remote
  branch heads matched and the branch still had no upstream.
- One grouped `scaffold.runtime` execution/receipt; never split the three issues.
- Archetype 6 CLI/tooling. Required gates: structured check/test/lint/fmt, asset freshness,
  `quality:gate`, `arch:check`, applicable JSR audit/doc lint/publish dry run, and one leased shared
  runtime smoke.
- Red state at base: #1262 placebo seed; #1263 GET/PATCH/DELETE undefined 500s; #1588 unreachable
  provider parsers. The #1263 OpenAPI 404 projection is already present on current main and is a
  preservation assertion, not an implementation target.
- Coordinator comment `5286194892` resolves the earlier boundary gap by authorizing only
  `generate-prisma-config.ts`, `database-generators.ts`, new `generate-database-seed.ts` plus its
  focused test, `generators_test.ts`, `scaffolder.ts`, and `scaffolder_test.ts` at their existing
  CLI database generator/scaffolder paths.
- Contract-package work remains excluded. The already-green #1263 OpenAPI 404 projection receives
  regression coverage only.
- PLAN-EVAL cycle 1 recorded `FAIL_PLAN`. Its repair locks OD-1 to memory-router exclusion, defines
  OD-2 as the direct generator no-`modelName` contract, adds `generate-engine-mod.ts` and exact
  proves/gate/files accounting to slices 2–6, and records the existing tutorial baseline-row claim
  as verified-by-inspection in scope.
- PLAN-EVAL cycle 2 recorded `PASS` at evaluated head `5b3c6fcf21b0b4947a770d8e67ea5cc8082724d5`;
  evaluator commit `b8fc5eb53a530d337602f7dc377239651a57d428` closes the plan gate.
- Implementation slices 2–5 are active in the original same thread. Slice 6 remains the current
  hard stop because no singleton expensive-gate lease exists.
- Slice 2 emits only the selected provider's URL helpers in engine modules and Prisma config;
  SQLite retains direct env/fallback resolution, `PrismaLibSql`, and its generated typed client.
- Slice 2 landed as `32cd429c095d7bab35b62e7c74ca8d71bdc0f070` with decisive generator tests,
  `quality:scan`, and `arch:check` green.
- Slice 3 generates a typed idempotent representative row for the resolved model, preserves a
  truthful direct-call no-model branch, and makes normal scaffolding pass the resolved model and
  SQLite database filename into its generators.
- Slice 3 landed as `275ae091c3c73e7893672554276b013a20d01944` with its decisive seed/scaffolder
  tests, `quality:scan`, and `arch:check` green.
- Slice 4 gives persistent generated GET/update/delete by-id handlers the contract-defined
  `NOT_FOUND` path, narrows Prisma translation to `P2025`, and retains regression coverage for the
  already-green common 404 OpenAPI projection. Memory showcase routers remain excluded.
- Slice 4 landed as `589a01a550bbfd4c558d5cca2c6eee003123c255` with its decisive template tests,
  regenerated embedded asset, `quality:scan`, and `arch:check` green.
- Slice 5 prepares the existing live database verifier to require the generated `Seed User` row,
  defined `NOT_FOUND` wire responses for guaranteed-missing GET/PATCH/DELETE operations, and a 404
  OpenAPI response for each operation. Its focused deterministic test covers the full request
  sequence without starting the runtime.
- Implementation slices 2–5 are complete. Slice 6 remains unstarted and lease-blocked pending the
  topic orchestrator's substantive Tier-A review and explicit singleton expensive-gate grant.
- T-1 restores the one lost slice-2 behavior pin as an additive ninth source-level `it()` case:
  generated MSSQL output must retain `tcp:`/comma/`1433` endpoint parsing, normalize
  `127.0.0.1`/`::1`/`[::1]` to `localhost`, and fall back to `localhost` for an empty host. The
  four-engine required/forbidden matrix remains unchanged. A temporary source+embedded
  neutralization produced raw exit 1, both product files were restored to their original hashes,
  and the final structured test/lint/fmt plus `quality:scan`/`arch:check` evidence is green.
- Opposite-family IMPL-EVAL remains mandatory after implementation and Tier-A review.
- Same-thread steering must use the exact Deno-suite command in `codex-thread-ids.md`; direct
  `codex exec resume` is prohibited.
