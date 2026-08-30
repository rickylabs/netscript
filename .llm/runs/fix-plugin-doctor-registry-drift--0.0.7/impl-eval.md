# IMPL-EVAL — fix-plugin-doctor-registry-drift--0.0.7 (#1673 / PR #1739) — cycle 1

## Verdict

**`FAIL_FIX`** — one major finding (F1) blocks; the plan remains valid, the implementation needs
more work. Per-finding severity is in § Findings.

## Evaluator identity and separation

| Field | Value |
| --- | --- |
| Role | Formal IMPL-EVAL, fresh native opposite-family session (Anthropic Fable 5), separate from the Codex `gpt-5.6-sol` author and from the fixes topic supervisor that signed Tier-A |
| Worktree / branch | `/home/agent/projects/netscript/worktrees/007-eval-1673` · `eval/impl-eval-1673-cycle-1` |
| Evaluated head | `61b8bf52b50a3cc3e98b67b367d1a1e4a2022807` — re-verified: local `HEAD` == `git fetch origin` == PR #1739 `headRefOid` (`gh pr view 1739 --json headRefOid`) |
| Product head | `c1e21c1b0823d1bd057d252e59f7bee5fbbdfc89`; `git diff --stat c1e21c1b..61b8bf52` touches only `worklog.md` |
| Base | `origin/main` @ `13878a80a50c55b9662099fed64555f2310ae4a3` (re-verified after fetch) |
| Method | Read-only over source. Every gate below was re-run by me; nothing is copied from author receipts or the Tier-A table. Scratch inputs live under the job tmp dir and `.llm/tmp/eval-1673/` (gitignored). |

## Scope and process checks

| Check | Result | Derived from |
| --- | --- | --- |
| Six-path product ceiling | PASS — `git diff --stat 13878a80a..c1e21c1b -- packages` lists exactly the six authorized paths; no seventh path | raw git |
| S5 product delta is layout-only | PASS — `git diff e5123a0e c1e21c1b -- packages` is the ten-line `@std/path` import expansion only | raw git |
| PLAN-EVAL N/A recorded before implementation | PASS — `plan.md` D6 and `worklog.md` § PLAN-EVAL at `d37b278b` precede `c947b8fa` | commit order |
| Design checkpoint in `worklog.md` | PASS — § Design present with surface/vocabulary/ports/constants | worklog |
| `deno.lock` | PASS — `git diff --exit-code 13878a80a..61b8bf52 -- deno.lock` exit 0 | raw git |
| Run-artifact hygiene | PASS — no UUID/thread id/rollout path in `.llm/runs/fix-plugin-doctor-registry-drift--0.0.7/` (`codex-thread-ids.md` explicitly states no identifier is exposed) | grep |
| Arch-debt delta | none required; no new AP introduced in the six paths | review |
| Agent briefs carry `## SKILL` | PASS — `implement.md` and this brief | read |

## Gates re-run at the evaluated head

| Gate | Command (from worktree root) | Result |
| --- | --- | --- |
| Focused regression | `run-deno-test.ts --pretty -- --allow-all packages/cli/src/public/features/plugins/doctor/doctor-plugin-registry-drift_test.ts` | exit 0 · **5 passed / 0 failed** |
| Related suite (5 locked test paths) | same wrapper over regression + `doctor-plugin-command_test` + `doctor-plugin-invariants_test` + `installed-runtime-registry-generator_test` + `installed-runtime-registry-integration_test` | exit 0 · **47 passed / 0 failed** |
| Scoped type check (six ceiling files) | `run-deno-check.ts --pretty --file …×6` | exit 0 |
| Scoped lint, root config | `run-deno-lint.ts --pretty --file …×6` | exit 2 · refusal `all-excluded` — confirms root `deno.json` excludes `packages/cli/` from lint |
| Scoped lint, scratch config (root rules minus `packages/cli/` exclusion) | `--config .llm/tmp/eval-1673/deno.scratch.json` | exit 0 · 6/6 processed · 0 findings |
| Scoped fmt, scratch config | same `--config` | exit 1 · 4 file findings (see line-level attribution below) |
| `deno task quality:gate` | full repository mode | exit 0 · `ok: true`, `findings: []` (7 pre-existing allowances) |
| `deno task doc:lint --root packages/cli --pretty` | | exit 0 |
| Runtime gates (`e2e:cli`, Aspire, Docker, browser) | not run — boundary | n/a |

### Red-before, independently re-derived on a pristine `git archive` of base `13878a80a`

| Input dropped into the base archive | Result |
| --- | --- |
| The **S2 test file** (`git show c947b8fa:…drift_test.ts`) | exit 1 · **0 passed / 1 failed** · `AssertionError: Expected function to reject.` on `plugin doctor fails when a saga is authored after generate plugins` — the honest red-before |
| The **head test file**, default type-check | exit 1 · **0 tests run** · `TS2353 … 'inspectRuntimeRegistries' does not exist in type 'PluginDoctorDependencies'` |
| The head test file with `--no-check` | exit 1 · **0 passed / 5 failed** |

The green at head therefore comes from product code: the same five cases are red on base with the
product seam absent, and the S2 case name and its four assertions survive verbatim in the head file.

### Scoped fmt findings — line-level attribution, re-derived

Same scratch config run on the base archive for the three product files. First reported hunk:

| File | Head first hunk | Base first hunk | Ownership |
| --- | --- | --- | --- |
| `generate/plugins/installed-runtime-registry-generator.ts` | `-  type GenerateInstalledPluginRegistries,` | identical line | base-owned |
| `plugins/doctor/doctor-plugin-use-case.ts` | `-import {` (jsr-export-map-loader import) | identical line | base-owned |
| `root/public-command-dependencies.ts` | `-import {` (line 1) | identical line | base-owned |
| `plugins/doctor/doctor-plugin-registry-drift_test.ts` | `-import {` (jsr-specifiers import) | file absent at base | leaf-owned, scope-deferred |

Matches Tier-A. Note the root config never formats `packages/cli/`, so none of these can fail CI.

## Findings

### F1 — **major, blocking** — doctor reports a false failure with an unsatisfiable remediation on a correctly generated AI-plugin project (D1 assumption broken)

**Claim under test:** D1 "installed runtime manifests remain the only discovery authority" and AC1/AC4
("compares against the source tree"; "healthy/failure cannot be read as a stronger claim than the
evidence supports").

**What the code does:** the doctor's *expected* set is the CLI's manifest walk
(`discoverDirectoryFiles`: suffix + `exclude` only). The *actual* registry is written by each
plugin's own generator, and the AI generator applies a selection rule the manifest does not declare:
`plugins/ai/src/cli/ai-registry-compiler.ts:124-125` includes a file only if
`exportsReadyAiToolDefinition(source)` (defineAiTool / `{descriptor, schema, execute}` shape).
`plugins/ai/src/adapter/resources/mcp-tool/mcp-tool.ts:19` ships `ai/tools/skill-loader.ts` into the
project whenever the opt-in MCP tool is enabled (`plugins/ai/scaffold.ts:26`,
`context.options.mcp === true`); that file is a factory, not a tool, and the CLI's **own** integration
test `installed-runtime-registry-integration_test.ts:239-277` asserts
`tools.registry.has('skill-loader') === false` as correct behaviour.

**Reproduction (scratch script `.llm/tmp/eval-1673/ai-repro.ts`, `deno run --allow-all --no-check --no-lock`):**
workspace project with `plugins/ai` copied in, `appsettings.json` declaring `NetScript.Plugins.ai`,
files `ai/tools/e2e-tool.ts` (real tool), `ai/tools/skill-loader.ts` (= `mcpToolStub`, byte-identical
to what the plugin ships), `ai/agents/assistant.ts`. Then `generate({dryRun:false})` succeeds and
writes `tools.registry.ts` importing only `e2e-tool.ts`. Immediately afterwards, `plugin doctor`:

```
doctor exitCode = 1
workspace  error  Manifest-declared runtime registry matches source
  .netscript/generated/plugin-ai/tools.registry.ts: Missing generated entry for manifest source:
  ai/tools/skill-loader.ts. Run: netscript generate plugins
```

`netscript generate plugins` was just run and can never add that entry. This is the issue's defect
class inverted: the command asserts a state the evidence does not support (red on a healthy tree) and
prescribes a fix that cannot succeed. It affects every supported AI path with the MCP tool, and more
broadly any helper module a developer legitimately places under `ai/tools/` (the AI compiler contract
is "static selection by shape; non-conforming source is excluded"). The e2e plugin-suite builder
defaults `aiMcp = true` (`packages/cli/e2e/src/application/builders/scaffold/plugin-suite-builder.ts:16`)
and the behaviour gate `behavior.plugin-doctor-missing-module` requires doctor to be healthy first, so
CI's `scaffold.runtime` is expected to go red at this head (not run here, per boundary).

**Why the leaf did not see it:** the five semantic cases only exercise the sagas manifest, whose
generator selection (`-saga.ts` suffix + exclude) happens to coincide with the manifest walk.

**Fix direction (author's call, coordinator decides on ceiling):** the expected set must be the
generator's *selection*, not the manifest *walk*, for kinds whose generator owns selection — e.g.
(a) let the plugin generator report its selected sources (dry-run/selection output) and compare
against that; or (b) declare the selection contract in `scaffold.runtime.json` so the CLI can apply
it; or, at minimum and least honestly, (c) downgrade "missing" to a warning for such kinds. Adding
`skill-loader.ts` to the AI manifest `exclude` alone fixes only the shipped stub, not user helpers.
(a)/(b) likely need a path outside the six-path ceiling (`plugins/ai/scaffold.runtime.json` or the AI
compiler) — that is a ceiling decision for the coordinator, not a rescope of the plan's goal.

**Required regression:** a case that generates a registry whose generator legitimately excludes a
discoverable file, and asserts doctor stays healthy.

### F2 — minor — Tier-A "0/5 at base with the head test file dropped in" is reproducible only with `--no-check`

With default type-checking the head file does not compile at base (TS2353) and zero tests run. The
Tier-A record does not state the `--no-check` condition. The honest red-before is the S2 file at base
(0/1, `Expected function to reject`), which I reproduced. No product impact; evidence-precision only —
record the exact flag next time.

### F3 — info — `registrableItems` value semantics changed for multi-target plugins

Base assigned the plugin-wide sum to every target; head assigns the per-target count. The worklog's
"preserving the non-dry command result shape" is true for shape, not value. No production consumer
reads the field (`grep registrableItems packages/cli/src` → type + generator only), so harmless, and
arguably more correct. Note that for the AI case in F1 it reports `registrableItems: 2` for a registry
that contains 1 entry — the same walk-vs-selection gap, pre-existing at base.

### F4 — info — latent walk-vs-generator divergences not exercised by any manifest today

`plugins/workers/src/cli/runtime-registry-generator.ts:126-135` skips dotfiles and honours
`include`/`includeWhenPresent` profile overlays; the CLI walk does neither. No shipped manifest uses
`include`/`profiles`, so no current false positive — but the same class as F1 and worth covering by
whichever fix direction is chosen.

### F5 — info — durable receipts cited in `worklog.md` are not verifiable from the branch

`.llm/tmp/gate-receipts/...` is gitignored and absent in a fresh checkout. I did not rely on them;
`quality:gate` and `doc:lint` were re-run here and pass.

## Decision-by-decision assessment

| Decision | Assessment |
| --- | --- |
| D1 manifests as sole discovery authority | **Broken** for AI (F1); holds for sagas/triggers/workers today (F4 latent). |
| D2 `sourceFiles` internal extension | Holds: `GeneratedPluginRegistry` is not reachable from `packages/cli` exports (`./mod.ts`, `./scaffolding.ts`, `./testing.ts` — grep negative); field is optional and only populated on `dryRun`. |
| D3 relative import-binding comparison | Adequate for what generators emit: all four emitters use `import * as alias from "<relative>"` (namespace bindings handled); `import type` and in-clause `type` skipped; default/aliased-named handled; Windows separators normalized; pluginDirs relative math matches (`plugins/workers/jobs/x.ts` both sides). Not handled: `export … from` re-exports and dynamic `import()` — no generator emits them, so no current mode; a string literal containing an import statement inside the body would be misparsed — not a generated shape. Tests cover none of these edges, but none is reachable from shipped emitters. |
| D4 bounded healthy wording | Healthy path: accurate and bounded (`Verified <registry> against N manifest-declared source files: …; no non-registry runtime topology was verified`) — I could not read it as a stronger claim than the comparison performed. **Error path** overclaims in the F1 case (asserts drift and a remediation that cannot hold). |
| D5 optional discovery seam | Holds today: `doctorPlugin(` has exactly one production construction (`public-command-dependencies.ts:311`), which supplies the seam; `packages/mcp` `plugin-doctor-family.ts` is still an explicit injection stub, not a silent consumer. Risk remains that a future construction site omits the seam silently; acceptable for this leaf. |

## Issue #1673 acceptance criteria vs code

| AC | Met by code? | Evidence |
| --- | --- | --- |
| 1 compares registry against source tree | Partially — yes for sagas/triggers/workers; for AI the comparison is against the wrong expected set (F1) | repro + code |
| 2 source-without-registry is a failure naming file + command | Yes (late-saga case; my rerun) — but the message is also emitted when untrue (F1) | test + repro |
| 3 reverse orphan reported | Yes (removed-saga case; my rerun) | test |
| 4 states exactly what was verified | Healthy path yes; error path no in F1 | repro |
| 5 regression red-before | Yes — independently reproduced at base | § red-before |

Issue acceptance boxes remain unticked (coordinator-owned); close-gate cannot pass while F1 stands.

## Tier-A claims I could not reproduce as stated

- "0/5 at base" — only with `--no-check` (F2). Everything else in the Tier-A table reproduced.

## Next

- Author (WSL Codex lane): address F1 with a regression that generates a registry whose generator
  legitimately excludes a discoverable file; coordinator to rule on the ceiling if the fix needs
  `plugins/ai/scaffold.runtime.json` or the AI compiler.
- Re-run the focused + related suites and the scoped gates at the new head; then a fresh IMPL-EVAL
  cycle 2 (eval loop: 1 of 2 failures used).
