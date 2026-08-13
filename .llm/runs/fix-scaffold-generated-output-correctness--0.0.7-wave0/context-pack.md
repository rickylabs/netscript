# Context pack — scaffold-generated-output-correctness

- Direct-to-`main` Wave 0 fixes leaf for #1262, #1263, and #1588.
- Immutable base: `01e0960494c95ce56eb35892c211a095eb13e6ed`.
- Topic orchestrator: `/home/codex/repos/netscript-007-fixes`, run
  `.llm/runs/release-0.0.7-fixes--orchestration/`.
- Approved coordinator artifacts:
  `/home/codex/repos/netscript-547-lffix/.llm/runs/release-0.0.7--orchestration/`.
- No upstream; explicit push refspec only; draft PR against `main`; no merge or publication.
- Draft PR: #1654 at initial artifact head `88b735a3641704810c86066310507c97db7f5a37`, labeled
  `status:plan` with milestone `0.0.7`.
- One grouped `scaffold.runtime` execution/receipt; never split the three issues.
- Archetype 6 CLI/tooling. Required gates: structured check/test/lint/fmt, asset freshness,
  `quality:gate`, `arch:check`, applicable JSR audit/doc lint/publish dry run, and one leased shared
  runtime smoke.
- Red state at base: #1262 placebo seed; #1263 GET/PATCH/DELETE undefined 500s; #1588 unreachable
  provider parsers. The #1263 OpenAPI 404 projection is already present on current main and is a
  preservation assertion, not an implementation target.
- Hard stop: the frozen contract omits the Prisma config renderer and a model-aware seed generator
  seam required by the locked design. See `drift.md` and `plan.md`.
- PLAN-EVAL is mandatory after boundary resolution; opposite-family IMPL-EVAL remains mandatory
  after implementation and Tier-A review.
