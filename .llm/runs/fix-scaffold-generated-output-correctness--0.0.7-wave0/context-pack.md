# Context pack — scaffold-generated-output-correctness

- Direct-to-`main` Wave 0 fixes leaf for #1262, #1263, and #1588.
- Immutable base: `01e0960494c95ce56eb35892c211a095eb13e6ed`.
- Topic orchestrator: `/home/codex/repos/netscript-007-fixes`, run
  `.llm/runs/release-0.0.7-fixes--orchestration/`.
- Approved coordinator artifacts:
  `/home/codex/repos/netscript-547-lffix/.llm/runs/release-0.0.7--orchestration/`.
- No upstream; explicit push refspec only; draft PR against `main`; no merge or publication.
- Draft PR: #1654, labeled with exactly one phase label, `status:plan-eval`, and milestone `0.0.7`.
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
- Current hard stop: cycle 2 requires an updated immutable source brief and a separate explicit
  coordinator grant. This plan-author thread does not launch or request it.
- Opposite-family IMPL-EVAL remains mandatory after implementation and Tier-A review.
- Same-thread steering must use the exact Deno-suite command in `codex-thread-ids.md`; direct
  `codex exec resume` is prohibited.
