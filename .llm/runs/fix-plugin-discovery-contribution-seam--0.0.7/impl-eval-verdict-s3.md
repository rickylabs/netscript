# IMPL-EVAL verdict — S3: move the official discovery axes out of plugin core (#1093 / PR #1850)

PASS_IMPL

## Metadata

| Field            | Value                                                                                                                                |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Head judged      | `2398b9fe5` (branch `fix/plugin-discovery-contribution-seam`, exact head; no `main` integration applied by the evaluator)             |
| Slice            | S3 only — plugin-owned declaration transport + `plugin-discovery-core-coupling` guard. The S2 `PASS_IMPL` covered the extension seam and is not re-judged or extended by this verdict. |
| Evaluator        | Separate-session IMPL-EVAL; this session generated no S3 code and edited no product file (transient scanner probes were planted and deleted inside the run; tree verified clean afterwards). |
| Identity         | requested: fresh exact-head separate-session IMPL-EVAL on the evaluator lane (S2 precedent route: GLM 5.3 Flash via OpenRouter); observed: `z-ai/glm-5.3-flash`; effort: not attested in-session — no effort metadata is exposed to this session, so no `max`-effort claim is made. |
| Verdict          | **PASS_IMPL** — all seven load-bearing questions CONFIRMED against reproduced evidence.                                              |

## Gate reproduction (evaluator-run, exact exit codes)

| Gate | Command | Exit | Observed |
| --- | --- | ---: | --- |
| quality:gate | `deno task quality:gate` | 0 | scan 0 findings / 7 pre-existing allowances / 0 allowance failures; doctrine + deps gates green |
| arch:check (standalone) | `deno task arch:check` | 0 | no architecture/dependency failure |
| package tests | `.llm/tools/run-deno-test.ts -- --allow-all packages/plugin` | 0 | **92 passed / 0 failed** |
| package check | `.llm/tools/run-deno-check.ts --root packages/plugin --ext ts` | 0 | 153 files, 2 batches, 0 diagnostics |
| corpus freshness | `deno task check:mcp-export-corpus` | 0 | canonical corpus current |
| scanner probes present | `scan-code-quality.ts --root packages --root plugins --root docs/site` | 1 | 5 findings, all `plugin-discovery-core-coupling`, all on planted probe files (see E2) |
| scanner probes removed | same command | 0 | 0 findings, 7 allowances, 0 allowance failures |
| S3.2 RED suite | `deno test` on `git archive 63c9dac34` tree | 1 | **28 passed / 1 failed** (see E5) |
| S3.1 RED suite | `deno test` on `git archive aea929b05` tree (4 test files) | 1 | **30 passed / 6 failed** (see E5) |
| full export doc-lint | `run-deno-doc-lint.ts --root packages/plugin` | 1 (contractual) | **15 private refs / 0 missing JSDoc / 0 other**; `./src/sdk/mod.ts` entrypoint = 0 findings |
| package JSR audit | `audit-jsr-package.ts --root packages/plugin` | 1 (contractual) | exactly **4 FAIL / 2 WARN / 1 INFO**; no finding on any S3-owned file |
| package publish dry-run | `deno publish --dry-run --allow-dirty` | 0 | exactly 2 `unanalyzable-dynamic-import` at `generated-project-registry.ts:69:23` and `manifest-resolver.ts:33:29` (baseline locations) |
| scoped doctrine | `check-doctrine.ts --root packages/plugin` | 0 | 0 FAIL / 2 WARN / 1 INFO (no increase) |

All non-increase contracts from `plan.md`'s Gate Table verified at exact non-increase, not green-washed.
`deno.lock` SHA-256 after all gates: `01ff3a232713a35e9bd5c9f34db7669568fadd16273cb9c82389832b10b55cbe`
(= planning-time hash; no gate moved it).

## Findings

| # | Question | Verdict | Deciding evidence (reproduced by this evaluator) |
| --- | --- | --- | --- |
| E1 | Coupling removed, not relocated | **CONFIRMED** | `DEFAULT_CONTRIBUTION_BUILDERS`: **0 occurrences** in the entire tree (`grep -rn … packages/ plugins/ .llm/tools/`). Factory literals `defineJob/defineSaga/defineWebhook` in product `packages/**` appear only inside `packages/plugin-*-core/*` (the named engine owners) and generated/e2e-fixture assets that this branch never touched (`git diff 82a2527e2..HEAD` contains **no `packages/cli/**`, `packages/config/**`, or non-corpus `packages/mcp/**` path**). Both no-arg CLI consumers are generic: `list-plugins-command.ts` (`new FilesystemWalker().walk(...)` + `new AstExtractor().extract(files)`) and `public-command-dependencies.ts` (`extractor: new AstExtractor()`). The `sagas/streams/triggers/workers` set in `packages/cli/src/maintainer/adapters/plugin-import-rewriter.ts` is pre-existing publish tooling (last touched PR #136) and untouched by this branch — not a relocation. Declarations are emitted by each plugin's own adapter: `plugins/{workers,sagas,triggers}/src/adapter/plugin.ts` each append `export const NETSCRIPT_CONTRIBUTION_BUILDERS = [{ callee: '…', axis: '…' }] as const;` to the `<plugin>/plugin.ts` artifact they already scaffold. No hidden fallback exists: `createContributionBuilders` is seeded only from `additionalBuilders` + walked declarations (`ast-extractor.ts:35-42`). |
| E2 | Guard non-vacuous and generic | **CONFIRMED** | Reproduced the supervisor's probe with six planted fixtures. With probes present the scanner CLI exited **1** with exactly 5 findings: branch `if (builder.callee === 'defineExample')` (`__eval_probe_branch.ts:2`), table `{ callee: 'defineExample', axis: 'examples' }` (`__eval_probe_table.ts:2`), `switch (callee) { case 'defineExample': }` (`__eval_probe_misc.ts:3`), reversed `'defineExample' === callee` (`:11`), and `callee.startsWith('defineExample')` (`:15`). The same fixtures under `plugins/sagas/src/adapter/` and `packages/plugin-workers-core/src/` produced **no** finding (plugin-owned/engine-owner exclusions work), and the real tree exits 0 with the three official declarations in place. Callee used is `defineExample` — not one of today's three — so the rule is structural, not a name snapshot. Structural notes: the rule is production-only (`isScannable` excludes `_test.ts`), findings bypass inline `quality-allow:` suppression, and `--max-allow` caps only allowance count — a planted violation cannot be absorbed by the allowance budget. |
| E3 | End-to-end discovery of official factories | **CONFIRMED** | Harness (scratch, `.llm/tmp/`, since deleted) imported `collectInstallArtifacts` from `@netscript/plugin/adapter` for all three real adapter plugins, wrote the **production-emitted** artifacts to a temp project, added user files importing `defineJob`/`defineSaga`/`defineWebhook` from the respective `@netscript/plugin-*-core` modules, then ran a **no-argument** `new AstExtractor().extract(files)`: exactly 3 contributions — `sendEmail→jobs`, `default→sagas`, `newUserWebhook→triggers`. `startWalker(project)` (no options) emitted `.netscript/generated/{jobs,sagas,triggers}.registry.ts`. The official path works with core defaults deleted. |
| E4 | Silent-failure guard real in both directions | **CONFIRMED** | (a) Project with factory imports + export call sites and **no** declaration threw `TypeError: Contribution factory "defineJob" has no declared axis; run plugin sync/update or pass it through additionalBuilders` — names the callee and both remedies. (b) Project with no factory call sites returned `[]` quietly. Edges: import-with-no-call-site → quiet; `defineJobHandler` (excluded grammar) → quiet; two plugins declaring one callee → `Duplicate contribution builder callee "defineJob"`; present-but-malformed declaration → `Malformed NETSCRIPT_CONTRIBUTION_BUILDERS declaration in "plugin.ts"` (no silent skip); `additionalBuilders` compat path recovers a declaration-less project. The suite distinguishes broken from empty exactly as D4 requires. |
| E5 | RED genuine | **CONFIRMED** | `git show --stat 63c9dac34`: **test file only (+28)**, and `git show 63c9dac34:.llm/tools/quality/scan-code-quality.ts` contains **0** occurrences of the rule (rule lands in `026032d5d`, scanner-only +96). Extracted the RED tree via `git archive` into `.llm/tmp/` and ran the suite: **28 passed / 1 failed, exit 1**; the failing assertion shows actual `[]` vs expected the two planted findings — the scanner missed the violation for the product reason. Also reproduced the S3.1 RED `aea929b05` (test-only, +105/−10) over its four test files: **30 passed / 6 failed, exit 1**, failures being the synthetic-declaration, fail-loud, duplicate-declaration tests and the three plugin install-emission tests — matching the worklog counts exactly. |
| E6 | Migration-boundary honesty + no hidden fallback | **CONFIRMED** | PR #1850 body carries a dedicated section titled **"Behavior change — existing generated projects must sync/update"** placed immediately after the Summary (above Design), stating the requirement, the `additionalBuilders` compatibility path, and the fail-loud `TypeError` behavior. The earlier "Correction — acceptance was overstated" section is preserved. Code contains no fallback (E1). The body also correctly does **not** claim #1873's CI-gating half. DoD boxes 1–6 are ticked with two (IMPL-EVAL, CI) left unticked — consistent with the supervisor mirroring acceptance after its own verification (sign-off commit `2398b9fe5` is the supervisor's); the fresh-IMPL-EVAL box is this verdict's subject. |
| E7 | Corpus canonical + lock byte-identity | **CONFIRMED** | `deno task check:mcp-export-corpus` → **exit 0**. Re-ran the canonical generator (`deno task gen:mcp-export-corpus`): output **byte-identical** (sha256 before = after = `e86fe2512cb3b783f3caf57910368c3d5a31a35d1476b10d9852c943421246bf`), proving no hand-edited carrier. Lock: `git rev-parse HEAD:deno.lock` == `origin/main:deno.lock` == `ac2ee042566bc6b03502c40961c10d624416b061`; verified the local `origin/main` ref against the actual remote tip via `git ls-remote` (`302409f0c…` both sides), so the comparison is against current `main`, not a stale ref. |

## What I tried that failed to break it

Negative results are evidence; none of these attacks succeeded:

1. **Relocation via the CLI consumers** — grepped every host/core package for the three factory names, the `NETSCRIPT_CONTRIBUTION_BUILDERS` constant, `@netscript/plugin-{workers,sagas,triggers}` specifiers, and repo-root `plugins/` imports. All hits were either the owning `plugin-*-core` packages, generated carriers, e2e fixtures, JSDoc examples, or pre-existing installer/publish tooling on files the branch never touches.
2. **Guard absorption by the allowance budget** — checked whether `--max-allow 7` could eat a planted finding; allowances are inline `quality-allow:` markers only, and structural-rule findings are pushed outside the per-line `ruleFor` loop, so they cannot be suppressed or budgeted away.
3. **Guard overfit to today's three names** — all probes used `defineExample`/`examples`; the rule has no name list anywhere in its implementation.
4. **False positives on legitimate core code** — the extractor's own generic grammar (`{ callee: builder.callee, axis: builder.axis }` at `ast-extractor.ts:71`) and the test fixtures with literal `{ callee: 'defineJob', axis: 'jobs' }` do not fire (value-not-string and test-file exclusion respectively); `quality:gate` is 0 on the real tree.
5. **Exclusion abuse** — identical coupling fixtures planted under `plugins/**` and `packages/plugin-*-core/**` produce no finding; the exclusion is by path shape, and the *real* declarations live only under `plugins/**`.
6. **Silent non-discovery reintroduced** — built a declaration-less project with real call sites three different ways (no declaration, import-only, handler-only); only genuine call sites throw, and empty projects stay quiet. The exact defect #1093 was filed about is structurally unreachable now.
7. **Reds faked by count** — both RED trees extracted independently; failure names match the claimed product reasons, not compile errors.

## Blocking findings

None.

## Non-blocking observations

1. **Guard grammar limits (disclosed, in-plan).** Indirection escapes the rule: `{ callee: INDIRECT_CALLEE, axis: 'examples' }` (identifier value) and tuple/Map-shaped tables (`[['defineExample','examples']]`) produce no finding, nor would dispatch through a renamed local. This matches D5's stated scope ("cannot prove coupling hidden behind encoded strings, cross-file aliases, computed property names, or arbitrary helper data flow") and the PR body's own limitation paragraph; `PLG-WALKER-AST` owns the compiler-backed scope. The guard is honest about what it is.
2. **Fail-loud net is convention-scoped.** The unmatched-factory throw triggers only for factories imported from modules matching the generic `plugin-[^/]+-core(/builders)?` specifier pattern (`ast-extractor.ts:16`). No specific plugin is named, but a third-party plugin whose engine package does not follow that naming convention gets neither discovery nor the throw unless it emits the declaration (README-directed) or passes `additionalBuilders`. Bounded-grammar consequence, not a regression of the official path.
3. **Corpus SHA moved since `67c718a4c`.** The S3.3 commit recorded corpus sha `fe7d2056…`; the #1862 merge regeneration superseded it (`e86fe251…` today). The current file is generator-canonical and fresh — this is the documented conflict resolution, not drift.
4. **DoD tick attribution.** Ticked boxes in the PR body are most consistent with supervisor mirroring (the "Supervisor verification at the integrated head" section is present and the sign-off commit is the supervisor's); the evaluator cannot attribute ticks from the body alone, and the two genuinely-pending boxes are correctly unticked.
5. **Test-fixture literal tables in `packages/plugin/tests`** (`walker-ports_test.ts`) would fire the new rule if test files were ever scanned; they are excluded by `isScannable` today. Worth remembering if the scanner's test-file policy ever changes.

## Verdict rationale

The load-bearing question — is the coupling removed or relocated — is answered by code, not prose:
the core table is gone with zero residue, the declarations are emitted by the plugins that own them,
both no-arg CLI consumers are untouched and generic, and end-to-end discovery of all three official
factories was reproduced through the production install-emission path with a no-argument extractor.
The box-5 guard was reproduced failing on planted violations (five structural forms, non-today
callee) and quiet on plugin-owned code, with both RED commits independently re-run at their own
trees. The clean break fails loudly with the callee and remedy, stays quiet on empty projects, the
PR body states the migration boundary as a behavior change at the top, the corpus is
generator-canonical, and the lock is byte-identical to current `origin/main`. No blocking finding
survived the attempt to break it.
