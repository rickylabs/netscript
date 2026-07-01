# PLAN-EVAL — CLI JSR production hardening

> Evaluator session (separate from the generator). Follows
> `.llm/harness/evaluator/plan-protocol.md` + `gates/plan-gate.md` +
> `.agents/skills/{netscript-harness,netscript-doctrine,netscript-deno-toolchain,jsr-audit}`.
> Hard stop before any implementation. No edits to `packages/`, configs, or lockfiles.

- **Evaluator session:** OpenHands minimax-m3 (OpenRouter) · run-28178494214-1
- **Run:** `fix-cli-jsr-prod-hardening--prod-hardening`
- **Branch / PR:** `fix/cli-jsr-prod-hardening` (PR #127)
- **Phase:** plan
- **Surface / archetype:** `packages/cli` / **A6 (cli-tooling)**
- **Scope overlays:** A6-specific F-CLI-1..F-CLI-31 (per `.llm/harness/gates/archetype-gate-matrix.md`)
- **Base rebased onto:** `main` @ `c0020a1b`, includes #126 (verified via `git log -1`)

## Inputs reviewed

- [x] `research.md` (full read — 7,191 bytes)
- [x] `plan.md` (full read — 6,854 bytes)
- [x] `.llm/harness/gates/plan-gate.md` (8-item checklist)
- [x] `.llm/harness/gates/archetype-gate-matrix.md` (A6 row + F-CLI namespace)
- [x] `.llm/harness/archetypes/ARCHETYPE-6-cli-tooling.md` (R-A6-N1..N13 + F-CLI-1..F-CLI-31)
- [x] `.llm/harness/evaluator/plan-protocol.md`
- [x] `.agents/skills/netscript-doctrine/SKILL.md` (CLI archetype + public-surface rules)
- [x] `.agents/skills/netscript-deno-toolchain/SKILL.md` (JSR publish / `deno publish` / `deno doc` surface)
- [x] `.agents/skills/jsr-audit/SKILL.md` (publish-surface / readiness rubric)
- [x] `.agents/skills/netscript-tools/SKILL.md` (scoped check/lint/fmt gate wrappers)
- [x] `packages/cli/src/kernel/adapters/scaffold/editor-config.ts` (top-level `Deno.readTextFileSync` at line 16 — confirmed)
- [x] `packages/cli/src/kernel/application/registries/template-registry.ts` (`TemplateValue.content?` + `read()` exist; `load()` does NOT hydrate — confirmed)
- [x] `packages/cli/src/kernel/adapters/templates/template-asset.ts` (4 read fns; sync and async — confirmed)
- [x] `packages/cli/src/kernel/adapters/contracts/templates/generate-v1-mod.ts` (sync `Deno.readTextFileSync` at lines 34, 64 — confirmed)
- [x] `packages/cli/src/kernel/adapters/contracts/templates/contract-template-registry.ts` (URL constants; no read calls — confirmed)
- [x] `packages/cli/mod.ts` (already runnable via `if (import.meta.main)` — confirmed)
- [x] `packages/cli/bin/netscript.ts` (transitively imports `editor-config.ts` via `runPublicCli` — confirmed)
- [x] `packages/cli/deno.json` (exports: `.`, `./scaffolding`, `./testing`; no `bin` field — confirmed)
- [x] `packages/cli/e2e/src/create-default-runner.ts:57` (`packageSource: PACKAGE_SOURCE.LOCAL` default — confirmed)
- [x] `packages/cli/e2e/src/domain/run-context.ts:12` (field exists, never read in gates — confirmed)
- [x] `.github/workflows/publish.yml` + `.github/workflows/e2e-cli.yml` (PR validation unchanged; no prod e2e today — confirmed)
- [x] `packages/cli/src/kernel/adapters/abstracts/manifest.ts` (parent class — `Manifest<TKey,TValue>` does not carry `content`; `content?` lives on `TemplateValue` concrete — confirmed)

## Plan-Gate checklist

| Plan-Gate item                            | Result     | Evidence / location                                                                                                                                                                       |
| ----------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Research present and current              | **PASS**   | `research.md` is dated 2026-06-25 and re-baselined against `main` @ `c0020a1b` + #126. Evidence table covers the 5 read sites; `packageSource` field + importMode divergence confirmed.     |
| Decisions locked                          | **FAIL**   | D1 hydration **timing** is unresolved (who calls `load()`/`hydrate()` and when?). D2 conflates JSR's `deno.json` `bin` field with `exports.bin`. See Open-decision sweep.                   |
| Open-decision sweep                       | **FAIL**   | Plan defers "Enumerate callers" + "JSON-module vs fetch for JSON" to implementation. With 42 sync call sites across `template-asset.ts` consumers, the strategy is not safe to defer.      |
| Commit slices (<30, gate + files each)    | **PASS**   | 3 slices (S1/S2/S3) << 30 cap. S1 names files + what-it-proves. S2/S3 under-specified (no concrete command or files list); see Required fixes.                                              |
| Risk register                             | **PASS**   | 3 risks listed with mitigations: (a) `fetch` perms (document `--allow-net` / `--allow-read`); (b) sync→async migration (enumerate callers); (c) CI can't prove https path (prod-e2e Action). |
| Gate set selected                         | **PASS**   | A6 (CLI) gates F-CLI-1..F-CLI-31 + universal F-1..F-18 implied by `archetype-gate-matrix.md`; e2e `scaffold.runtime` + new prod-e2e Action. CLI F-CLI-6 (single `createXCli`/≤60 LOC) intact. |
| Deferred scope explicit                   | **PASS**   | "Out of scope: reads that take a runtime path into the user's generated project" — explicit list. Bundling `.template` as TS modules → explicit follow-up.                                |
| jsr-audit surface scan (pkg/plugin)       | **PASS**   | `@netscript/cli` is a JSR package. `publish.include` ships assets + `src/**/*.ts` + `src/**/*.template`. Plan adds `bin` field; re-running `deno publish --dry-run` is part of S1 validation. |

**Plan-Gate sub-total: 6/8 PASS, 2 FAIL → `FAIL_PLAN`.**

## A6-specific scrutiny

- [x] **F-CLI-4 — kernel never imports surfaces.** No new surface↔kernel crossing introduced by S1/S2/S3. The portable loader is a `kernel/adapters/**` change (correct location).
- [x] **F-CLI-8 — `deno doc --html packages/cli/mod.ts` reports 100% coverage.** No change to public surface area from S1; S2 adds `bin` field (JSR mechanism) — public-surface scan should re-run.
- [x] **F-CLI-9 / F-CLI-10 — `deno publish --dry-run` exit 0.** Currently true at alpha.2 (per release evidence). Adding a `bin` field is orthogonal; plan correctly calls for re-running dry-run in S1's validation step.
- [x] **F-CLI-15 / F-CLI-16 — `Deno.exit` and `Deno.readFile` etc.** De-top-leveling `editor-config.ts` *removes* a top-level `Deno.readFileSync` from `kernel/adapters/scaffold/` (improves F-CLI-16). Plan doesn't enumerate other top-level FS sites but research confirms only the 5 named sites are affected.

## Open-decision sweep (evaluator-run)

| Decision                                                                                                                  | Plan status                          | Evaluator finding                                                                                                                                                                                                                            |
| ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Q1 — WHO calls `TemplateRegistry.load()` / hydrates `content`, and WHEN?**                                              | not addressed                        | **MUST RESOLVE NOW → FAIL_PLAN.** `TemplateRegistry.load()` currently only enumerates entries (no hydration). The fix relies on `content` being cached, but no caller hydrates today. Either (a) `mod.ts` calls `await registry.load()` on import (top-level async, OK in Deno 2), or (b) `createPublicCli` hydrates lazily on first command. Pick one — affects S1 design. |
| **Q2 — Sync→async migration scope: hydrate-and-read-from-cache vs full async migration**                                  | "safe to defer" (hydrate-first)      | **MUST RESOLVE NOW → FAIL_PLAN.** Plan lists 42 sync callers in research but doesn't pick a strategy. With `generateV1Mod()` (sync signature) and `renderTemplateAssetSync()` (sync signature), the sync path is *load-bearing*. Decide: (a) keep sync path via hydration cache + convert `generateV1Mod`/`renderTemplateAssetSync` callers to async, or (b) make all 42 sync call sites async. Hydration-only works for the *registry path*; it does NOT work for `generateV1Mod` because that function reads non-registry URLs at call time. |
| **Q3 — JSR bin mechanism: `deno.json` `bin` field vs `exports["bin"]`**                                                  | example shown as `"./bin"` in exports| **MUST RESOLVE NOW → FAIL_PLAN.** JSR publishes a `deno.json` `"bin"` map (string → relative path) so `deno install -g jsr:@netscript/cli` works. The plan's example `"./bin": "./bin/netscript.ts"` is an `exports` entry (NOT a JSR bin field) and would not enable `deno install`. The correct mechanism is `"bin": { "netscript": "./bin/netscript.ts" }` in `packages/cli/deno.json`. `mod.ts` is already runnable, so the bin export isn't needed for `deno run -A jsr:@netscript/cli` — but `deno install -g` still requires the `bin` field. Ship both: `bin` field for `deno install`, leave exports unchanged (or add `./bin` if `deno run -A jsr:@netscript/cli/bin/netscript.ts` is desired as a parallel entry). |
| **Q4 — JSON module import vs fetch for JSON schema (D1 sub-decision)**                                                   | "JSON import preferred; fetch acceptable alternative" | **MUST RESOLVE NOW → FAIL_PLAN.** Pick one. JSON module import (`with { type: 'json' }`) joins the module graph and works file:+https:; `fetch()` requires `--allow-net`. Plan should commit to JSON module import for `editor-config.ts` schema + any other `.json` shipped with the package. |
| **Q5 — `packageSource` plumbing: which e2e gates need updating?**                                                        | "Wire the existing e2e `packageSource` axis" (vague)    | **MUST RESOLVE NOW → FAIL_PLAN.** Verified: `packageSource` field exists on `RunOptions` and `RunContext` but is **only ever defaulted to `PACKAGE_SOURCE.LOCAL`** in `create-default-runner.ts:57` and `suite-builder-options.ts:23`. To enable JSR mode, the runner must (a) read the `packageSource` flag, (b) call **public** init (`importMode:'jsr'`) instead of maintainer init, (c) thread `PACKAGE_SOURCE.JSR` into the scaffolded project's `deno.json`. Slice S3 must enumerate these gates + the runner change. |
| **Q6 — S1 in-CI verification: local file-server vs unit-test assertion**                                                  | "use a local file-server or the module-graph import approach" | **Borderline — should commit to one.** A unit test asserting (a) `editor-config.ts` has no top-level `Deno.read*` and (b) `template-asset.ts` calls `fetch()` instead of `Deno.readTextFile*` is cheap and runnable in CI. A local file-server proves file→https transformation but adds CI surface. Pick the unit-test approach; rely on the prod-e2e Action (D3) for the real https proof. |
| **Q7 — Out-of-band "4 website doc tutorials" verification (D4 #3)**                                                       | "Separate-agent run"                  | **OK as-is.** Not a CI gate; acknowledged as a post-merge separate-agent verification. Should be tagged in the supervisor's post-merge checklist. |

## Verdict

`FAIL_PLAN`

### If FAIL_PLAN — required fixes

1. **D1 — Resolve hydration timing.** Decide whether `TemplateRegistry.load()` is awaited at `mod.ts` top-level (Deno 2 supports top-level await) or whether `createPublicCli` hydrates on first command. Add a one-paragraph decision block to `plan.md` §Locked Decisions D1 naming the bootstrap site.

2. **D1 — Resolve sync→async strategy.** Either (a) convert the 42 sync callers (`renderTemplateAssetSync`, `generateV1Mod`, `generateAppViteConfig`, `generateNetscriptConfig`, `generateEngineMod`, `generateEditorConfig`, etc.) to async, OR (b) keep sync via hydration cache AND additionally migrate the call sites that are *not* on the registry path (e.g. `generateV1Mod` reads a URL not in `TemplateRegistry` — must become async or its URL must move into the registry). Document the chosen strategy and the migration list in `plan.md` §Slices S1.

3. **D2 — Use the correct JSR bin mechanism.** Replace the `"./bin": "./bin/netscript.ts"` example with `"bin": { "netscript": "./bin/netscript.ts" }` in `packages/cli/deno.json`. Note that `mod.ts` is already runnable (via `if (import.meta.main)`), so `deno run -A jsr:@netscript/cli` resolves today once D1 lands; the `bin` field is for `deno install -g`. If a `"./bin"` exports entry is also desired for `deno run -A jsr:@netscript/cli/bin/netscript.ts`, add it explicitly, but it is not the primary mechanism.

4. **D1 — Commit to JSON module import.** Pick `import schema from '...json' with { type: 'json' }` for `editor-config.ts` (and any other `.json` shipped with the package). Remove "fetch is acceptable alternative" — that's a strategy switch, not a fallback.

5. **D3 — Enumerate `packageSource` plumbing in slice S3.** Add to `plan.md` §Slices S3: (a) runner reads `packageSource` flag from `RunOptions` (currently ignored), (b) `create-default-runner.ts:57` and `suite-builder-options.ts:23` thread `PACKAGE_SOURCE.JSR`, (c) public init path (`importMode:'jsr'`) replaces maintainer init when `packageSource === 'jsr'`, (d) workflow file `.github/workflows/e2e-cli-prod.yml` installs the just-published version via `deno install -g jsr:@netscript/cli@<v>` then invokes the CLI from PATH. Name the files each sub-step touches.

6. **S1 — Commit to a verification command.** Replace "use a local file-server or the module-graph import approach" with a concrete unit test: a new test in `packages/cli/src/kernel/adapters/templates/template-asset.test.ts` (or equivalent) that (a) asserts `editor-config.ts` source contains no top-level `Deno.read*` call (regex/AST) and (b) calls `readTemplateAsset` against a URL with scheme `https:` pointing to a local file-server and asserts the body. The prod-e2e Action remains the final word on the real JSR path.

## Notes

- **Slice ordering is correct.** S1 unblocks; S2/S3 land after. Good.
- **Process split is correct.** Framework SOURCE (S1, S2, S3 e2e wiring) goes to WSL Codex daemon-attached; supervisor authors the workflow YAML glue + dispatches PLAN-EVAL (here) → IMPL-EVAL next. Acceptable per `.agents/skills/netscript-harness`.
- **Risk #2 (sync migration) is real and the plan acknowledges it.** The current plan's "Enumerate callers" deferral would force a partial rewrite when the enumeration surfaces call sites that the hydration-cache strategy can't cover (e.g. `generateV1Mod`). Resolve before slicing.
- **Risk #3 (verification of https path) is honestly bounded.** Dry-run can't prove the https path; the plan correctly identifies the prod-e2e Action as the real proof. The unit-test fallback (Required fix #6) covers the in-CI evidence gap.
- **Public surface change.** S2 adds a `bin` field (not in `exports`), so JSR publish surface scan (`deno publish --dry-run` + `deno doc --lint`) must re-run in S1 validation. Not a blocker; noted for completeness.
- **F-CLI-8 / F-CLI-9 / F-CLI-10 re-validation.** Once the `bin` field is added and `editor-config.ts` is de-top-leveled, the JSR publishability gates must re-validate. Add to S1 validation commands.
- **Cycle count: this is cycle 1.** Two `FAIL_PLAN` cycles before user escalation per `.llm/harness/gates/plan-gate.md` §Verdict.