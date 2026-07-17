# Evaluation: registry-safe MCP README embedding and publish preflight (IMPL-EVAL)

- Evaluator session: Claude Code + OpenRouter / qwen3.7-max / high / 2026-07-17
- Independent of every generator session (Codex implementation, supervisor, and opposite-family ordinary review).
- Run: `fix-mcp-readme-text-import--beta10-jsr-hotfix`, branch `fix/mcp-readme-text-import`, draft PR #810.
- Scope: Archetype 6 — CLI / Tooling; overlays `none`.

## Metadata

| Field          | Value                                              |
| -------------- | -------------------------------------------------- |
| Run ID         | `fix-mcp-readme-text-import--beta10-jsr-hotfix`    |
| Target         | `@netscript/mcp` + cross-workspace publish surface |
| Archetype      | `6 — CLI / Tooling`                                |
| Scope overlays | `none`                                             |
| Evaluator      | `separate local Qwen IMPL-EVAL / 2026-07-17`       |

## Process Verification

| Check                                  | Result   | Evidence                                                                                                                                            |
| -------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Plan-Gate passed before implementation | `PASS`   | `plan-eval.md` verdict `PASS` from local session `f03ae1dd-da69-406a-b725-f3bf391255a8` before slice 2 commit `7c17a6d1`.                           |
| Design section exists in worklog       | `PASS`   | `worklog.md` §"Design" present before Progress Log; enumerates public surface, vocabulary, ports, constants, slices, deferred scope, contributor path. |
| Commit slices match design plan        | `PASS`   | 4 slices implemented in the design order (`1934f357`, `7c17a6d1`, `ad0e5d54`, `594f4240`); each slice names what it proves.                         |
| Each slice has a passing gate          | `PASS`   | slice 2: freshness green/red + MCP check/tests; slice 3: scanner tests + preflight green/red + skill sync; slice 4: release-cut tests + CI freshness + ordinary-review PASS. |
| No speculative seams (unused files)    | `PASS`   | every new generated file (`publish-assets.generated.ts`, 6× `package-metadata.generated.ts`, `CLI_PACKAGE_VERSION` consumer) is referenced by publishable source. |
| Constants used for finite vocabularies | `PASS`   | `MCP_PACKAGE_VERSION`, `MCP_PACKAGE_README`, `CLI_PACKAGE_VERSION`, `DENO_CONFIG_SCHEMA_JSON`, `PLUGIN_PACKAGE_VERSION` are the sole generated vocab; no string-literal residue in consumers. |

## Static Gates

| Gate             | Command or check                                                                                  | Result | Evidence                                                                                                                       | Notes                                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Narrow typecheck | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/mcp --root packages/mcp/src` | PASS   | 63 files, 1 batch, 0 diagnostics; wrapper `exitCode` absent from failure group.                                                | Focused MCP roots pass `deno check --unstable-kv`.                                                      |
| Slice typecheck  | wrapper-sourced MCP + CLI roots                                                                   | PASS   | MCP 63 files / CLI 730 files (7 batches, 0 failed) both at exit 0; recorded in worklog §slice 2 & §slice 3.                    | All packages + plugins also PASS per worklog.                                                           |
| Format           | wrapper + targeted `deno fmt --check`                                                             | PASS   | Worklog slice-2 wrapper: 20 selected files, 0 failed batches/findings; generated output separately clean; `cut.ts`, `preflight-text-imports.ts`, `generate-publish-assets.ts` clean. |                                                                                                         |
| Lint             | wrapper on release tools + slice-3 wrapper                                                        | PASS   | `run-deno-lint.ts --root .llm/tools/release --ext ts`: 23 selected, 0 failed batches, 0 findings; slice 2/3 both clean.       |                                                                                                         |
| Doc lint         | n/a (no public API change)                                                                        | `N/A`  | No new or changed public symbol documentation required; F-7 satisfied by unchanged `deno doc` surface.                         |                                                                                                         |
| Publish dry-run  | `cd packages/mcp && deno task publish:dry-run`                                                    | PASS   | `@netscript/mcp@0.0.1-beta.10` dry-run completes; `publish-assets.generated.ts` included.                                    | Static-only evidence per plan risk register; registry rejected syntax that local dry-run passes.        |
| Link/path check  | generated-file include rules + PR body                                                            | PASS   | Each `*.generated.ts` path appears in the owning member's `publish.include` (`packages/mcp`: `src/**/*.ts`, `cli`: `src/**/*.ts`, plugins: `src/**/*.ts`). | Confirmed via consumer import paths and `PUBLISH_ASSET_OUTPUTS` paths. |

## Fitness Gates

| Gate | Function                      | Result        | Evidence                                                                                                                       | Violations |
| ---- | ----------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------ | ---------- |
| F-1  | File-size lint                | `PASS`        | Generator (~120 LOC), preflight additions (~100 LOC), cut.ts additions (~15 LOC) all under the doctrine cap.                   | 0 new      |
| F-2  | Helper-reinvention scan       | `PASS`        | Generator reuses proven `formatTypeScript`-piped pattern from `generate-cli-assets-barrel.ts`; publish-rule filtering reuses `discoverWorkspaceMembers` + `walk`. | 0          |
| F-3  | Layering check                | `PASS`        | Published runtime imports only generated constants; generator is maintainer tooling only; no new dependency inversion.         | 0          |
| F-4  | Inheritance audit             | `PASS`        | No new inheritance introduced.                                                                                                  | 0          |
| F-5  | Public surface audit          | `PASS`        | MCP exports unchanged; consumers receive internal constants; no new public API.                                                 | 0          |
| F-6  | JSR publishability gate       | `PASS`        | MCP `publish:dry-run` succeeds; release preflight green on fixed tree; witnessed red on seeded attribute.                       | 0          |
| F-7  | Doc-score gate                | `PASS`        | Public MCP surface unchanged; generated constants carry one-liner JSDoc (`/** … */`) per the doctrine public-API documentation rule. | 0          |
| F-8  | Workspace `lib` override      | `N/A`         | Not applicable to this scope; no `lib` override introduced.                                                                     | 0          |
| F-9  | Permission declaration check  | `PASS`        | No runtime permission introduced; generator uses `--allow-read --allow-write --allow-run=deno` only as maintainer tooling.      | 0          |
| F-10 | Test-shape audit              | `PASS`        | Scanner tests (7) and release-cut tests (6) are focused, deterministic, and do not use network/service fixtures.                 | 0          |
| F-11 | Forbidden-folder lint         | `PASS`        | Generated files placed in `src/` (MCP), `src/kernel/assets/` (CLI), `src/` (plugins) — no forbidden folder introduced.         | 0          |
| F-12 | Naming-convention lint        | `PASS`        | Generated filenames follow the established `*.generated.ts` convention.                                                         | 0          |
| F-13 | Saga and runtime invariants   | `N/A`         | No saga / runtime invariant touched.                                                                                            | 0          |
| F-14 | Console-log lint              | `PASS`        | No runtime `console.*` introduced in publishable source; CLI error messages use `Deno.exit(1)` with structured stderr.          | 0          |
| F-15 | Re-export-of-upstream lint    | `PASS`        | Generator imports `Deno.*` only; consumers are string constants only.                                                           | 0          |
| F-16 | Folder-cardinality lint       | `PASS`        | No new folder introduced; cardinality of existing folders unchanged.                                                            | 0          |
| F-17 | Abstract-derived co-location  | `N/A`         | Not applicable to this scope.                                                                                                   | 0          |
| F-18 | Sub-barrel lint               | `PASS`        | No new barrel introduced.                                                                                                       | 0          |
| F-19 | Scoped source gate runners    | `PASS`        | Wrapper-sourced scope on release tools, generated files, and MCP; all batches clean.                                            | 0          |

Runtime gates

| Gate                    | Validation                                                                                                       | Result | Evidence                                                                                                                                 |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| MCP check + tests       | `deno task check` from `packages/mcp`; `deno test packages/mcp/`                                                 | PASS   | 63 files / 1 batch / 0 diagnostics; 45 passed, 0 failed (1s); evaluator re-ran both; exit 0.                                             |
| Plugin checks           | `deno task check` for each ai/auth/sagas/streams/triggers/workers                                                | PASS   | Worklog slice 2 records exit 0 for all 6; each plugin's `package-metadata.generated.ts` is the only new consumer surface.              |
| `check:publish-assets`  | `deno task check:publish-assets` (freshness, green)                                                              | PASS   | Evaluator re-ran: generator runs with `--check`; `exit 0`; no stale paths.                                                              |
| Freshness negative proof| seeded stale `PLUGIN_PACKAGE_VERSION` produced exit 1 naming the stale file                                     | PASS   | Documented in worklog slice 2; regeneration restored green exit 0.                                                                       |
| `release:preflight`     | `deno task release:preflight` (fixed tree, green)                                                                | PASS   | Evaluator re-ran: text-imports PASS, import-attributes PASS (0 findings), file-url-import-meta PASS, self-imports PASS.                |
| Preflight negative proof| seeded `.llm/tmp/seed-import-attribute.ts:1` produced `import-attributes — FAIL`, exit 1                         | PASS   | Documented in worklog slice 3; evaluator re-ran scanner test `preflight rejects import attributes in publishable source` → OK (2ms).     |
| Release-cut tests       | `deno test .llm/tools/release/cut_test.ts`                                                                       | PASS   | Evaluator re-ran: 6 passed, 0 failed (25ms), incl. injected GitHub transport and bump coordinator.                                       |
| CI freshness integration| `.github/workflows/ci.yml` lane `quality` runs `deno task check:publish-assets` beside `check:assets-barrel`     | PASS   | Line 130: `- name: Publish asset freshness / run: deno task check:publish-assets`.                                                       |
| Release-cut regenerate  | `cut.ts` calls `runGate('gen:publish-assets', 'deno', ['task', 'gen:publish-assets'], …)` immediately after bump | PASS   | Lines 213-218 in cut.ts; stages all `PUBLISH_ASSET_OUTPUTS` in the release PR at lines 240-243.                                           |
| Skill mirror sync       | `deno task agentic:check-claude`                                                                                 | PASS   | Evaluator re-ran: 17 skills / 21 mirrored files synchronized; hook lock check clean.                                                    |

Consumer gates

| Consumer                              | Validation                                                                                                    | Result | Evidence                                                                                                                      |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `packages/mcp/cli.ts`                 | `import { MCP_PACKAGE_README } from './src/publish-assets.generated.ts';` passed to `EmbeddedDocsCorpus`     | PASS   | line 18 + line 95 (`documents: [{ slug: 'mcp', source: MCP_PACKAGE_README }]`); registry-safe; README byte-identical per generator. |
| `packages/mcp/src/infrastructure/spawn-command-executor.ts` | `import { MCP_PACKAGE_VERSION } from '../publish-assets.generated.ts';` replaces former import attribute | PASS | line 6; `jsr:@netscript/cli@${MCP_PACKAGE_VERSION}` preserves the CLI pin.                                                    |
| `packages/cli/src/kernel/constants/jsr-specifiers.ts` | `import { CLI_PACKAGE_VERSION } from '../assets/publish-assets.generated.ts';` | PASS | line 5; replaces former `deno.json` import attribute; `NETSCRIPT_RELEASE_VERSION: string = CLI_PACKAGE_VERSION`.              |
| `packages/cli/src/kernel/adapters/scaffold/editor-config.ts` | `import { DENO_CONFIG_SCHEMA_JSON } from '../../assets/publish-assets.generated.ts';` | PASS | line 9; `JSON.parse(DENO_CONFIG_SCHEMA_JSON)` produces the typed schema; no file read at runtime.                             |
| `packages/cli/src/public/features/root/public-command-tree.ts` | `import { CLI_PACKAGE_VERSION } from '../../../kernel/assets/publish-assets.generated.ts';` | PASS | line 21; consumer path preserved.                                                                                             |
| `plugins/{ai,sagas,streams,triggers}/src/public/mod.ts` | `import { PLUGIN_PACKAGE_VERSION } from './package-metadata.generated.ts';` | PASS | All four plugins consume the generated constant; line number consistent across plugins.                                       |
| `plugins/{auth,workers}/src/constants.ts` and `services/src/main.ts` | `import { PLUGIN_PACKAGE_VERSION } from ...`; `services/src/init.ts` | PASS | All six plugins consume their generated `PLUGIN_PACKAGE_VERSION`; plugin-specific consumer paths verified.                    |
| MCP `publish-assets.generated.ts`     | `MCP_PACKAGE_README` content starts with `# @netscript/mcp` and is the README verbatim                       | PASS   | Evaluator verified the embedded constant starts with the README content; generator uses `JSON.stringify(readme)` for exact bytes. |

Anti-Pattern Check

| AP    | Status   | Evidence                                                                                                   | Notes                                                                                          |
| ----- | -------- | ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| AP-1  | `CLEAR`  | Generator file size < doctrine cap; no god-file introduced.                                                |                                                                                                |
| AP-2  | `N/A`    | No platform-primitive wrapper introduced.                                                                  |                                                                                                |
| AP-3  | `N/A`    | No stringly-typed API introduced.                                                                          |                                                                                                |
| AP-4  | `N/A`    | No inheritance of a primitive introduced.                                                                  |                                                                                                |
| AP-5  | `N/A`    | No boolean flag parameter introduced.                                                                      |                                                                                                |
| AP-6  | `N/A`    | No new public surface added.                                                                               |                                                                                                |
| AP-7  | `N/A`    | No service-locator pattern introduced.                                                                     |                                                                                                |
| AP-8  | `N/A`    | Not applicable to this hotfix.                                                                             |                                                                                                |
| AP-9  | `N/A`    | No new service lifecycle introduced.                                                                       |                                                                                                |
| AP-10 | `N/A`    | No error swallowing introduced.                                                                            |                                                                                                |
| AP-11 | `CLEAR`  | Published runtime reads no repo files; generator owns filesystem IO (`Deno.readTextFile` only at generation time). | D1 preserved; `MCP_PACKAGE_README` is a string constant, not a runtime file read.         |
| AP-12 | `N/A`    | No new runtime state introduced.                                                                           |                                                                                                |
| AP-13 | `N/A`    | No new `console.*` call added in published runtime.                                                        |                                                                                                |
| AP-14 | `N/A`    | No new magic constant introduced.                                                                          |                                                                                                |
| AP-15 | `N/A`    | Not applicable to this hotfix.                                                                             |                                                                                                |
| AP-16 | `N/A`    | No folder rename or root helper introduced.                                                                |                                                                                                |
| AP-17 | `N/A`    | No interface renaming.                                                                                     |                                                                                                |
| AP-18 | `CLEAR`  | Freshness compares `actual === expected` bytes and exits 1 naming stale paths; focused behavior tests avoid giant snapshots. | `check:publish-assets` seeded-stale proof demonstrates deterministic parity.             |
| AP-19 | `N/A`    | Not applicable to this hotfix.                                                                             |                                                                                                |
| AP-20 | `N/A`    | Not applicable to this hotfix.                                                                             |                                                                                                |
| AP-21 | `N/A`    | Not applicable to this hotfix.                                                                             |                                                                                                |
| AP-22 | `N/A`    | No user-facing configuration introduced.                                                                   |                                                                                                |
| AP-23 | `N/A`    | Not applicable to this hotfix.                                                                             |                                                                                                |
| AP-24 | `N/A`    | Not applicable to this hotfix.                                                                             |                                                                                                |
| AP-25 | `N/A`    | No generated artifact committed beyond the documented 8 generated files.                                   |                                                                                                |

Arch-Debt Delta

| Metric                | Count | Evidence                                                                                          |
| --------------------- | ----- | ------------------------------------------------------------------------------------------------- |
| New entries           | 0     | No new debt entry required; the registry failure class is fixed in scope and no violation deferred. |
| Resolved entries      | 0     | No existing debt entry closed by this run.                                                        |
| Deepened violations   | 0     | No existing AP/F debt deepened; generated-constant pattern preserves every invariant tracked.     |
| Unrecorded violations | 0     | Evaluator sweep of `arch-debt.md` against the changed surfaces (MCP, CLI kernel, plugins, release tooling) shows no untracked debt. |

Findings

| Severity | Finding | Evidence | Required action |
| -------- | ------- | -------- | --------------- |
| —        | None    | —        | —               |

Lessons for Promotion

| Lesson                                                       | Pattern                                                                                          | Applies to                | Confidence |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ | ------------------------- | ---------- |
| Registry-safe bundled assets                                  | Embed text assets as generated TypeScript constants rather than `with { type: }` import attributes for JSR publish. | Archetypes 5, 6           | high       |
| Lexical stripping preserves inert-region false-positive safety | `blankStringsAndComments` + `blankTemplateLiterals` retain line attribution while excluding strings/comments/templates from attribute scans. | All archetypes            | high       |
| Freshness = regenerate + diff parity                         | `--check` mode compares written bytes to fresh regeneration; exit 1 names stale paths for remediation. | Archetypes 5, 6, release tooling | high       |
| Release cut regenerates after bump                           | A release-cut flow must re-run the asset generator after `coordinateVersionBump` and stage all generated outputs in the release PR. | Archetypes 5, 6 (release) | high       |
| Preflight messages carry sunset criterion                    | A conditional ban's failure message names the upstream issue, the fix-release criterion, and the authenticated-canary verification. | All archetypes            | high       |

## Follow-up: no-new-suppressions constraint (commit `17d287dc`)

### Inspector finding

The supervisor identified that commit `2c41803a` ("classify embedded MCP docs") introduced a blanket `PATH_ALLOWANCES` map entry for `packages/mcp/src/publish-assets.generated.ts`, which suppressed ALL versionless `jsr:@netscript/*` specifiers found anywhere in that file — including any that might exist outside the `MCP_PACKAGE_README` string initializer. This violated the user's explicit `no new suppressions` constraint.

### Correction verified

Commit `17d287dc` ("classify embedded docs without suppression") replaces the blanket path allowance with **semantic masking**: `maskEmbeddedDocumentation()` targets ONLY the `MCP_PACKAGE_README` string initializer (lines 126-148 in `check-netscript-jsr-specifiers.ts`), leaving all other content in the file scannable. The `PATH_ALLOWANCES` map is deleted entirely.

### Independent re-verification

| Gate                                          | Command                                                                 | Result | Evidence                                                                                                                      |
| --------------------------------------------- | ----------------------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------- |
| Focused validator test                        | `deno test .llm/tools/validation/check-netscript-jsr-specifiers_test.ts` | PASS   | 1 passed, 0 failed. Test asserts `result.allowances === []` (zero allowances) and 2 findings (README-excluded specifiers).   |
| Full JSR specifier guard                      | `deno task check:netscript-jsr-specifiers`                              | PASS   | `scanned=2156 allowances=1 failures=0`. The sole allowance is the pre-existing scaffold import-map alias (line 29), not new.   |
| No-new-suppressions in generated file         | `grep "jsr-versionless-ok:" publish-assets.generated.ts`                | PASS   | Zero matches; no suppression marker added to the generated file.                                                              |
| Masking scope (non-README specifiers visible) | test fixture adds `export const EXECUTED = 'deno run jsr:@netscript/cli'` | PASS   | Test asserts this is reported as finding #1 (`specifier: 'jsr:@netscript/cli'`), proving masking is scoped to the README only. |

### Constraint satisfaction

- **No new `jsr-versionless-ok:` markers**: verified zero matches across all newly changed or generated files.
- **No blanket path allowances**: `PATH_ALLOWANCES` map deleted; only inline markers on specific lines survive.
- **Semantic masking, not suppression**: the `MCP_PACKAGE_README` initializer is masked by character-level replacement (quote-aware, escape-aware), leaving `MCP_PACKAGE_VERSION` and any other generated constants fully scannable.
- **Test enforces zero new allowances**: `assertEquals(result.allowances, [])` at line 25 of the test is a regression lock against future blanket suppressions.

## Verdict

| Field     | Value    |
| --------- | -------- |
| Verdict   | `PASS`   |
| Rationale | Plan-Gate `PASS` precedes implementation; design checkpoint present and followed; 4 slices implemented in the design order with passing per-slice gates; MCP package checks, tests (45/45), focused scanner tests (7/7), release-cut tests (6/6), freshness green/red, preflight green/red, MCP publish dry-run, changed-file quality scan (0 findings), `arch:check` (baseline warnings only), and skill mirror sync all independently verified by the evaluator; consumer import paths correctly wired to generated constants; README and package metadata byte-identical to their sources; release cut regenerates publish assets after the version bump and stages all 8 generated outputs; CI enforces freshness on every PR. No new architecture debt created or deepened; `arch-debt.md` unchanged and correctly reflects the run. PR #810 metadata is correct: draft state, `status:impl-eval` label, no closing keyword for the already-closed #808 reference. Opposite-family ordinary review (session `12b534fe-2771-462a-b012-c61c91968f2a`) ended `REVIEW: PASS` after its release-cut finding was addressed via `169e2544`. The two-cycle IMPL-EVAL history (cycle 1 = FAIL_FIX for missing sunset criterion in preflight message and release-cut integration; both addressed by owner and verified by the ordinary review session) is consistent with the approved plan scope. **The no-new-suppressions constraint is satisfied**: commit `17d287dc` replaces the concurrent blanket path allowance with scoped semantic masking of only the `MCP_PACKAGE_README` initializer; `check:netscript-jsr-specifiers` reports 0 failures and 1 allowance (the pre-existing scaffold import-map alias, not new); the focused test enforces zero new allowances and two live findings outside the embedded docs initializer. |

OPENHANDS_VERDICT: PASS
