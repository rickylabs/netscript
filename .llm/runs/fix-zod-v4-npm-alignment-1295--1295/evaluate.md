# IMPL-EVAL — fix-zod-v4-npm-alignment-1295--1295

Formal separate-session implementation evaluation, canonical `formal_impl_evaluation` route.
Evaluator read-only: no files, GitHub state, branches, issues, or PRs were modified. All validation
commands were run independently in this session.

## Metadata

| Field          | Value |
| -------------- | ----- |
| Run ID         | `fix-zod-v4-npm-alignment-1295--1295` |
| Target         | PR #1315 @ `9f5ef7dcb55668a6649c5451266908ad8e29b15c`, branch `fix/zod-v4-npm-alignment-1295`, base `canary/0.0.5-canary.14` (`2508eb8c9`) |
| Archetype      | cross-cutting manifests + Archetype 6 (CLI tooling) guard |
| Scope overlays | none |
| Evaluator      | `formal_impl_evaluation` — separate Claude session, OpenRouter `qwen/qwen3.8-max` (`claude-evaluator-qwen-3-8-max`), high effort, 2026-08-06 |

Preconditions (fail-closed): branch/head exactly as tasked; worktree clean before validation;
repair commit `ecd224243ea` and train merge `c1fb3bb6e` (integrating canary.14 tip `2508eb8c9`)
verified in history; PR #1315 draft, `status:impl-eval` (exactly one lifecycle label), milestone
`0.0.5`, taxonomy labels present. Generator route drift **C-D9** recorded as instructed: inherited
generator thread `019fcd0c-9cda-7641-9479-3d1c72358154` was Sol low, resumed as Sol medium via
`agentic:codex-resume`; not relabeled.

## Process Verification

| Check                                  | Result | Evidence |
| -------------------------------------- | ------ | -------- |
| Plan-Gate passed before implementation | PASS   | `plan-eval.md` verdict `PASS (COMPOSED D6)` |
| Design section exists in worklog       | PASS   | worklog `## Design`: public surface, vocabulary, ports, constants, commit slices, deferred scope, contributor path |
| Commit slices match design plan        | PASS   | slices 0–3 per design table; slice 4 (canary.14 integration + generic child-workspace repair) recorded in `drift.md` + progress log; Commit Slices table itself not updated (see finding 8) |
| Each slice has a passing gate          | FAIL   | slice-4 gate rows include a `deno doc --lint` PASS claim contradicted by measurement (finding 1) and no gate row covers the `check:streams-types` consumer surface (finding 2) |
| No speculative seams (unused files)    | PASS   | `SCAFFOLD_WORKSPACE_CATALOG` consumed by `generateDenoJson`, both child-project fixture seams, and the sync test; guard predicates exercised via `deps:check` |
| Constants used for finite vocabularies | PASS   | guard uses named constants (`WORKSPACE_ZOD_SPECIFIER`, `ORPC_ZOD_V4_SPECIFIER`, `DOCUMENTED_V3_NPM_PARENT`, `DOCUMENTED_V3_JSR_PARENT`, `AI_MCP_ZOD4_PACKAGES`); scaffold catalog constants |

## Static Gates

| Gate             | Command or check | Result | Evidence | Notes |
| ---------------- | ---------------- | ------ | -------- | ----- |
| Narrow typecheck | `.llm/tools/run-deno-check.ts --ext ts,tsx` over changed paths | PASS | 824 files, 7 batches, 0 diagnostics | wrapper per AGENTS.md, not raw root CLI |
| Slice typecheck  | same wrappers over `packages/cli`, `.llm/tools/validation`, `.llm/tools/deps` | PASS | included in 824-file sweep; negative case compiled out-of-repo (see Runtime Gates) | |
| Format           | `.llm/tools/run-deno-fmt.ts --ext ts,tsx` over changed paths | PASS | 0 findings on changed paths (32 files in `.llm/tools/deps`+`validation`; scoped packages/plugins sweep) | 5 pre-existing fmt-drift files in `.llm/tools` are untouched by this PR — not a package-quality verdict per AGENTS.md |
| Lint             | `.llm/tools/run-deno-lint.ts` + `deno task quality:scan` | PASS | 0 findings on changed paths; diff scan: no new `deno-lint-ignore`/`@ts-ignore`/`@ts-expect-error`/`as unknown as`/`as any`; `quality:scan` `ok:true` (7 pre-existing `quality-allow` entries in untouched files); run artifacts excluded from scan | |
| Doc lint         | `.llm/tools/run-deno-doc-lint.ts` full export map, all 19 affected roots + canary.14 baseline diff | **FAIL** | head: 14/19 roots carry errors; baseline diff: **+70 new private-type-ref per root-sum (55 distinct new sites, 14 files) across 8 roots** introduced by this PR (finding 1) | changed-publish-surface cloud command is green (below); the full-export-map PASS claimed in the record is not |
| Publish dry-run  | `deno task publish:dry-run` (serial) | PASS | exit 0, `Success Dry run complete`; manifests restored; `deno.lock` byte-identical before/after (sha256 `d32ef0c1f2…`); `git status` clean post-run | only baseline `unanalyzable-dynamic-import` warnings |
| Link/path check  | `deno task docs:links` + `deno task docs:accuracy` | PASS | links: docs=102, 0 broken links/anchors/orphans; accuracy: PASS (4 saga pages, storefront worker boundary, spawn contract, 8 preferred paths, 18 CLI mutation families, 6 `@netscript/fresh` root imports) | |

Doc-lint evidence detail (independent, same wrapper + deno 2.9 on both trees; baseline extracted
verbatim from `origin/canary/0.0.5-canary.14` via `git archive`):

| Root | baseline | head | Δ |
| --- | --- | --- | --- |
| packages/contracts | 9 | 21 | **+12** |
| packages/fresh | 44 | 51 | **+7** |
| packages/plugin-ai-core | 2 | 12 | **+10** |
| packages/plugin-auth-core | 4 | 22 | **+18** |
| packages/plugin-workers-core | 13 | 19 | **+6** |
| packages/plugin | 15 | 16 | **+1** |
| plugins/auth | 5 | 17 | **+12** (incl. re-attributed `auth.contract.ts`) |
| plugins/workers | 24 | 28 | **+4** (incl. re-attributed `streams/schema.ts`) |
| bench, plugin-sagas-core, plugin-triggers-core, plugins/sagas, plugins/streams, plugins/triggers | unchanged pre-existing debt | unchanged | 0 |
| aspire, cli, config, queue, service | 0 | 0 | 0 |

Mechanism (raw `deno doc --lint` messages): public `z.ZodType<T>` annotations on exported schema
constants (e.g. `packages/plugin-auth-core/src/contracts/v1/auth.contract.ts`:
`export const SigninInputSchema: z.ZodType<SigninInput>`) become private-type-refs once `zod`
resolves through the npm catalog instead of `jsr:@zod/zod@4.4.3`; all new sites are clean at
baseline. This is the identical failure class this run fixed once in
`packages/plugin/src/protocol/manifest.ts` (public structural validator contract). Cloud-gate
scope is green: hosted Code-quality run `31116407810` at head_sha `9f5ef7dc` ran all three steps
(changed-file scan, `arch:check`, `Lint changed publish surfaces`) successfully, and local repro
confirms `packages/cli` (0 errors) and `packages/plugin` `src/config/mod.ts` + `src/protocol/mod.ts`
(0 errors).

## Fitness Gates

Evidence basis: `deno task arch:check` FAIL=0 all roots (warnings only in PR-untouched sources),
`deno task quality:gate` PASS, hosted `surface-diff` and `quality` checks at head.

| Gate | Function                     | Result | Evidence | Violations |
| ---- | ---------------------------- | ------ | -------- | ---------- |
| F-1  | File-size lint               | PASS | arch:check FAIL=0; new files small (guard 230, tests 85, doc 32 lines) | none |
| F-2  | Helper-reinvention scan      | PASS | arch:check FAIL=0 | none |
| F-3  | Layering check               | PASS | arch:check FAIL=0 (per-root deps:check + doctrine) | none |
| F-4  | Inheritance audit            | PASS | no class-lattice changes in diff | none |
| F-5  | Public surface audit         | PASS | hosted `surface-diff` pass at head; new public types (`PluginInstallerManifestSchemaIssue`, `PluginInstallerManifestValidator`) documented, runtime Zod object preserved | none |
| F-6  | JSR publishability gate      | **FAIL** | full-export-map `deno doc --lint` (the publish bar per jsr-audit) regressed +70 private-type-ref across 8 publishable roots; `publish:dry-run` itself passes | finding 1 |
| F-7  | Doc-score gate               | PASS | 0 new missing-jsdoc vs baseline (all deltas are private-type-ref; bench/fresh jsdoc debt pre-existing and unchanged) | none |
| F-8  | Workspace `lib` override check | N/A | no `compilerOptions.lib` changes in diff | — |
| F-9  | Permission declaration check | N/A | no README/permission-surface changes in diff | — |
| F-10 | Test-shape audit             | PASS | new tests are semantic assertions; sync test reads the real repository root `deno.json` | none |
| F-11 | Forbidden-folder lint        | PASS | no new folders; arch:check FAIL=0 | none |
| F-12 | Naming-convention lint       | PASS | arch:check FAIL=0 | none |
| F-13 | Saga and runtime invariants  | N/A | saga runtime code untouched (manifest-only member changes) | — |
| F-14 | Console-log lint             | PASS | quality:scan ok:true | none |
| F-15 | Re-export-of-upstream lint   | PASS | `manifest.ts` introduces own structural interface rather than re-exporting zod types | none |
| F-16 | Folder-cardinality lint      | PASS | arch:check FAIL=0 | none |
| F-17 | Abstract-derived co-location lint | N/A | no abstract-derived additions | — |
| F-18 | Sub-barrel lint              | PASS | protocol `mod.ts` additions aggregate named exports | none |
| F-19 | Scoped source gate runners   | PASS | wrappers used throughout; caveat: `run-deno-doc-lint.ts` exit semantics (finding 5) | none |

## Runtime Gates

| Gate     | Validation     | Result | Evidence |
| -------- | -------------- | ------ | -------- |
| `check:emitted-samples` | `deno task check:emitted-samples` | PASS | exit 0: `Checked 40 emitted TypeScript samples from 30 artifact paths.` Negative case independently reproduced out-of-repo: temp standalone root without catalog → `error: Package 'zod' not found in catalog` (exit 1); with catalog → exit 0. Matches drift.md RED and the cloud check-test's nine child-process failures |
| Guard predicate tests | `deno test .llm/tools/deps/check-zod-alignment_test.ts` | PASS | 6 passed / 0 failed |
| Live graph guard | `deno task deps:check:zod` | PASS | `zod-alignment PASS instances=zod@3.25.76,zod@4.4.3 residual-v3=@ag-ui/core@0.0.52,@olli/kvdex@3.6.7`; corroborated by native `deno why zod` (v3 owned only by `jsr:@olli/kvdex@^3.6.7` and `@tanstack/ai@0.39 > @ag-ui/core@0.0.52`) and `deno info` peer binding: `@anthropic-ai/sdk@0.97.1_zod@4.4.3`, `@modelcontextprotocol/sdk@1.29.0_zod@4.4.3`, `openai@6.45.0_zod@4.4.3`, `zod-to-json-schema@3.25.2_zod@4.4.3` — no Zod-4 peer resolves to v3 |
| Focused child-workspace tests | four-file `deno test --allow-all` + streams resources test | PASS | 37 passed / 0 failed; streams temp-consumer-root suite 7 passed |
| packages/fresh member check chain | `deno task check:streams-types` (chained in member `check`) | **FAIL** | head: exit 1 `error: Package 'zod' not found in catalog`; canary.14 baseline: exit 0. Fixture untouched by the PR and maps `@netscript/fresh/streams` to local source whose bare `zod` imports now resolve via `catalog:` under a config root that owns no catalog. CI root `check` uses the scoped wrapper, so `check-test` stays green — coverage gap masks the regression (finding 2) |
| `scaffold.runtime` | `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` | NOT_RUN | required per `release-gates.md` §Required-when (run changes scaffold output — generated root `deno.json` gains `catalog` — and plugin scaffolding — zod specifier changes); absent from run record; hosted e2e-cli lane excludes canary bases by design; not exercised in this read-only evaluation (protocol rule 14 treats the release-gate class as n/a for non-release runs). Must be satisfied before `status:ready-merge` (finding 4) |

## Consumer Gates

| Consumer     | Validation     | Result | Evidence |
| ------------ | -------------- | ------ | -------- |
| Generated standalone workspace root | `generators_test.ts` + catalog sync test | PASS | emitted root `deno.json` `catalog === SCAFFOLD_WORKSPACE_CATALOG`; sync test binds it bidirectionally to the repository root catalog (`root.catalog?.zod === SCAFFOLD_APP_CATALOG.ZOD === SCAFFOLD_WORKSPACE_CATALOG.zod`) |
| Generated plugin member manifests | `workspace-mutator.ts`, `new-plugin-use-case.ts`, copy-mode adapters | PASS | explicit portable `npm:zod@^4.4.3`, no `catalog:` where no generated root owns it; copy mode materializes `catalog:` imports (`plugin-import-rewriter.ts`) or mirrors the source catalog into the destination root (`packages-copier.ts`) |
| External streams consumer fixture | `check:streams-types` | **FAIL** | see Runtime Gates — baseline-green gate is red at head |

## Anti-Pattern Check

Only patterns the run scope touched or could affect are marked; doctrine coverage otherwise via
`deno task arch:check` FAIL=0.

| AP    | Status | Evidence | Notes |
| ----- | ------ | -------- | ----- |
| AP-1  | CLEAR  | new files under thresholds (230/85/32 lines) | |
| AP-3  | CLEAR  | `PluginInstallerManifestValidator` is narrow structural parse/safeParse only | |
| AP-9  | CLEAR  | `SCAFFOLD_WORKSPACE_CATALOG` has real callers (generator, two fixture seams, sync test) — not premature | adversarial focus A1: honest seam, not a second ungoverned Zod authority — the sync test genuinely binds it to the repository root catalog |
| AP-14 | CLEAR  | validator contract is an own structural type, not a zod re-export; runtime Zod object preserved | |
| AP-15 | CLEAR  | naming conforms (`ZodAlignmentFinding`/`ZodAlignmentReport` domain vocabulary) | |
| AP-18 | CLEAR  | tests assert semantics; no giant generated-string snapshots | |
| AP-11 | CLEAR  | guard core `analyzeZodAlignment` is pure over injected filesystem input | |
| AP-25 | CLEAR  | no new side effects in non-edge product files | |
| AP-2, AP-4–AP-8, AP-10, AP-12, AP-13, AP-16, AP-17, AP-19–AP-24 | N/A | outside this run's touched scope; arch:check FAIL=0 aggregate | |

## Arch-Debt Delta

| Metric                | Count | Evidence |
| --------------------- | ----- | -------- |
| New entries           | 0 | run adds no `debt/arch-debt.md` entries |
| Resolved entries      | 0 | — |
| Deepened violations   | 0 | no existing debt entry worsened |
| Unrecorded violations | 2 | (a) 55 new distinct private-type-ref sites (70 per-root sum) across 8 publishable roots; (b) `check:streams-types` regression — both introduced by this run, neither recorded as debt |

## Findings

| Severity | Finding | Evidence | Required action |
| -------- | ------- | -------- | --------------- |
| high | **1. Full-export-map doc-lint regression.** The jsr→catalog/npm Zod identity switch turns every public `z.ZodType<T>` annotation into a private-type-ref: +70 new errors per-root sum (55 distinct sites, 14 files) across contracts, fresh, plugin-ai-core, plugin-auth-core, plugin-workers-core, plugin, plugins/auth, plugins/workers; all clean at canary.14 baseline. Violates issue #1295 acceptance box 6 ("publish:dry-run and `deno doc --lint` stay clean") — the publish dry-run half passes, the doc-lint half does not | baseline-diff table above; raw error text, e.g. `public type 'SigninInputSchema' references private type 'ZodType'` at `auth.contract.ts:228` | fix: apply this run's own `manifest.ts` pattern (public structural contract / drop public `z.ZodType` annotations) across the 14 files; re-run the full 19-root export-map sweep and record actual counts |
| high | **2. `check:streams-types` consumer gate red at head (green at baseline).** `deno check --config` over the external-consumer fixture compiling local `@netscript/fresh/streams` source fails `Package 'zod' not found in catalog` — the same missing-catalog class the run fixed for `check:emitted-samples` and the CLI fixtures, missed here; packages/fresh member-level `check` chain is red. CI root `check` (scoped wrapper) never exercises it, so `check-test` stayed green | head exit 1 vs baseline exit 0; fixture and member task chain inspected; only foreign-config check task in the repo | fix: give the fixture root the Zod catalog (as in the streams resources test) or re-point it at published packages; add the member task chain to validation coverage |
| high | **3. Record overstates the doc-lint gate.** Worklog gate row (`deno doc --lint | PASS | all exports across 19 affected roots`), handoff, PR checklist row, PR Validation bullet, and acceptance-evidence entry box-index 6 all assert a full-export doc-lint pass contradicted by measurement. Evidence Standard requires every PASS claim to be backed; acceptance-evidence entry 6 is currently false for close-gate purposes. Probable mechanism: `run-deno-doc-lint.ts` exits 0 regardless of error counts | measured 14/19 roots with errors at head; wrapper exit semantics inspected (exits 1 only when no entrypoints discovered) | fix: correct all record locations to measured reality in the fix round; acceptance-evidence entry 6 must be re-stated against re-measured evidence |
| medium | **4. `scaffold.runtime` required but unproven.** release-gates.md mandates it before merge-readiness when scaffold output / plugin scaffolding change (both true here). Not in run record; hosted lane excludes canary bases; this read-only evaluation did not execute the container/Aspire suite (protocol rule 14 n/a for non-release runs) | release-gates.md §Required-when; worklog Gate Results has no scaffold.runtime row; e2e-cli scaffold tiers `skipping` per canary-base policy | run the one-pass command in the fix round, or orchestrator-recorded waiver citing the gate law |
| low | **5. `run-deno-doc-lint.ts` exit-code trap.** Exits 0 with any number of lint errors; likely root cause of finding 3 | wrapper source: only `Deno.exit(1)` path is "no entrypoints discovered" | harness tooling fix (outside product scope): exit non-zero when `totalErrors > 0` |
| low | **6. `check-emitted-samples` fixture copies the full root catalog**, more permissive than a real generated standalone root (which owns only `zod` via `SCAFFOLD_WORKSPACE_CATALOG`). Not exploitable today — emitted member manifests use explicit `npm:` specifiers — but it cannot catch a future emitted `catalog:` reference to a non-owned entry | tool diff is a 3-line catalog copy; generated member manifests verified explicit | consider narrowing the fixture to `SCAFFOLD_WORKSPACE_CATALOG` |
| low | **7. streams plugin test uses inline `catalog: { zod: '^4.4.3' }`** with no sync binding to the repository authority (plugin layering forbids importing CLI constants); CLI-side fixtures correctly use the product constant | `plugins/streams/src/adapter/resources/resources.test.ts` | accepted with note; drift would surface only as that test failing |
| low | **8. Stale run metadata.** context-pack.md Next Steps predate the existing commits and claim "Drift: none" while drift.md holds 4 entries (one significant); supervisor.md retains stale D6 language; worklog Commit Slices table omits slice 4 | artifact reads | reconcile in the fix round |
| low | **9. Evaluator-process note: bare-specifier `deno info npm:<pkg>` queries mutate `deno.lock`** (observed: four `npm:X@*` wildcard entries + MCP-SDK hono subgraph 4.12.27→4.13.0 re-resolution). This session's lock churn was self-inflicted and fully restored (committed sha256 `d32ef0c1…` verified before and after) | lock diff analysis: `@modelcontextprotocol/sdk` depends on hono; churn matches exactly the evaluator's `deno info` evidence queries | future evidence collection should snapshot/restore the lock or use `--no-lock` |

## Lessons for Promotion

| Lesson | Pattern | Applies to | Confidence |
| ------ | ------- | ---------- | ---------- |
| Dependency-identity flips are not manifest-only | jsr→npm (or any registry-identity change) can silently break doc-lint bars and foreign-config consumers while in-workspace gates stay green — sweep `deno doc --lint` and every `--config` task after such a move | dependency-migration / cross-cutting manifest archetypes | high |
| Gate wrappers must fail loudly | a wrapper that exits 0 while reporting errors converts honest measurement into false PASS rows | harness tooling, all archetypes | high |
| Catalog ownership travels with local-source compilation | any config root that compiles local-source workspace files must own the workspace catalog entries those members reference; enumerate fixture/temp/foreign roots when a dep moves to `catalog:` | scaffold / CLI tooling | high |
| `deno info npm:<bare>` is mutating | evaluator evidence collection needs lock snapshot/restore discipline | evaluator protocol / tooling | high |

## Verdict

| Field     | Value |
| --------- | ----- |
| Verdict   | `FAIL_FIX` |
| Rationale | Scope and process are sound: plan-eval PASS (composed D6), honest rescoping (#1320 deferral), acceptance boxes 1–5 genuinely earned (independently re-verified: graph guard 6/6 + live guard, 19 `catalog:` members, oRPC `/zod4`, documented residual boundary, peer cluster on npm Zod 4), emitted-samples RED/GREEN real (40 samples / 30 paths, negative case reproduced), publish dry-run and lock hygiene real, no new suppressions/casts, AP check clear, honest seam confirmed for `SCAFFOLD_WORKSPACE_CATALOG`. But two in-scope gates fail at head: (1) the full-export-map `deno doc --lint` bar regressed +70 private-type-ref errors across 8 publishable roots versus the canary.14 baseline — directly violating issue #1295 acceptance box 6 and contradicting the PASS claims carried in the worklog, PR body, and acceptance-evidence block; and (2) the baseline-green `check:streams-types` consumer gate is red (`Package 'zod' not found in catalog`), masked from CI by the root check's wrapper path. Both are bounded fixes whose patterns already exist inside this very run (the `manifest.ts` public-contract repair; the emitted-samples catalog repair). `scaffold.runtime` remains required-but-unproven before merge-readiness per release-gates.md. Not FAIL_RESCOPE (the scope is right) and not FAIL_DEBT (box 6 is explicit DoD language, and certifying the current record would endorse a false evidence claim). |

