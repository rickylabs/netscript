# IMPL-EVAL cycle 2 — #1673 / PR #1739 — generic generator inspection protocol

## Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-plugin-doctor-registry-drift--0.0.7` |
| Target | `packages/cli` plugin doctor + `plugins/ai` runtime-registry generator |
| Archetype | 6 (CLI, Keep) host + 5 (plugin) generator |
| Scope overlays | none |
| Evaluator | fresh native Claude Fable 5 session, opposite-family to the Codex `gpt-5.6-sol` author; separate from the fixes supervisor and both prior evaluators; 2026-08-30 |
| Evaluator branch | `eval/impl-eval-1673-cycle-2` (explicit-refspec push only) |
| Prior verdicts | IMPL-EVAL c1 `FAIL_FIX` `120ab86d` (on `origin/eval/impl-eval-1673-cycle-1`, confirmed); PLAN-EVAL `PASS_PLAN` `7db40ca0` (on `origin/eval/plan-eval-1673-cycle-1`, confirmed) |

## Evaluated head

| Check | Result |
| --- | --- |
| Local `HEAD` | `5d1cc5a8fca8eb6145d79fa8dfb30de4f4b94e05` |
| `origin/fix/plugin-doctor-registry-drift` contains `5d1cc5a8` | yes (`git branch -r --contains`) |
| PR #1739 `headRefOid` | `5d1cc5a8fca8eb6145d79fa8dfb30de4f4b94e05` (`gh pr view --json headRefOid`) — equal |
| PR state | draft, `Closes #1673`, labels `type:fix area:cli status:impl priority:p1` |
| `a073e0b1` (author evidence) / `4e1fed64` (product head) | both ancestors of head (`git merge-base --is-ancestor`) |
| Merge base with `origin/main` | `13878a80a50c55b9662099fed64555f2310ae4a3` — matches the immutable base |
| `deno.lock` | byte-unchanged vs base (`git diff --quiet origin/main..HEAD -- deno.lock`) |
| `installed-runtime-registry-integration_test.ts` | byte-unchanged vs base (PE-5) |

## Ceiling

`git diff --stat origin/main..HEAD` touches 19 paths: 8 run artifacts under
`.llm/runs/fix-plugin-doctor-registry-drift--0.0.7/` and exactly the eleven coordinator-authorized
product/test paths listed in `plan.md` § "Eleven coordinator-authorized product/test paths". No
`plugins/workers|sagas|triggers` path, no `runtime-registry-source-report.ts`. **No twelfth path.**

## Reproduced supervisor / author claims

Independently re-run in this session (structured wrapper
`.llm/tools/run-deno-test.ts --pretty -- --allow-all <path>`; historical commits checked out into
detached temporary worktrees that were removed afterwards):

| Commit | Claim | Observed |
| --- | --- | --- |
| `e24e7ce1` (regression only) | exit 1, 5/1, skill-loader case red with `RemoteError: Plugin doctor failed: workspace` | **reproduced exactly** |
| `8dcb578f` (AI reporting, host unchanged) | still exit 1, 5/1, same case | **reproduced exactly** |
| `5d1cc5a8` (head) | path 6 exit 0, 6/0 | **reproduced**: `passed=6 failed=0`, exit 0 |
| head | path 3 + `ai-registry-compiler.test.ts` | exit 0, `passed=18 failed=0` |
| head | `deno task --cwd plugins/ai test` | exit 0, `32 passed / 0 failed` |
| head | `deno task quality:scan` | exit 0, `findings: []`, 7 pre-existing allowances, none in leaf paths |
| head | `deno task arch:check` | exit 0; `WARN A8/AP-1/F-1: file is 673 lines (cap 500)` on path 2, CLI `FAIL=0` — the PE-9 WARN as disclosed |
| head | `run-deno-check.ts --ext ts` over the three ceiling directories (20 files, incl. all 10 ceiling `.ts`) | exit 0, 0 diagnostics |
| head | `deno lint --config <scratch root-rules>` over the 10 ceiling `.ts` | `Checked 10 files`, 0 findings |
| head | `deno fmt --check --config <scratch root-rules>` over the 10 ceiling `.ts` | one finding, path 7 line 1 import — identical finding on `origin/main`'s copy of the file; **base-owned**, leaf adds one wiring line only |
| head | raw `deno task check:mcp-export-corpus` (PE-8) | exit 0, sha256 `88011e6e459097ba4c74111063dbef13a95823702bd37447f358bc19375cc262`, 35 pkgs / 270 subpaths / 7,614 symbols — matches the recorded value |

The green is therefore product-caused: the same test file is red at both pre-host commits and green
only once the host consumes the inspect report (`4e1fed64`).

Not reproducible in this session (and not required): `.llm/tools/run-deno-lint.ts` over the CLI
ceiling paths returns a `partial-exclusion` refusal under the root config (packages/cli is
lint-excluded at the root); the author's disclosed scratch-config route was used instead and agrees.
`quality:gate` via `run-gate.ts` was not re-run as a receipt; its two components (`quality:scan`,
`arch:check`) were run directly. `scaffold.runtime` was not run (supervisor-sequenced, out of
evaluator scope).

## Contract verification (read-only over source)

| Contract item | Result | Evidence |
| --- | --- | --- |
| Optional manifest-advertised `inspectionProtocol: 1` | PASS | `plugins/ai/scaffold.runtime.json` adds the key; `readRuntimeManifest` records `inspectionProtocolDeclared = Object.hasOwn(generator,'inspectionProtocol')` and the raw value |
| Same external generator via injected `ProcessPort`, read-only inspect mode | PASS | `inspectRuntimeRegistrySources` calls `dependencies.process.exec('deno', ['run','--config',…,'--allow-read', <same resolveGeneratorUrl>, '--project-root',…, ...args, '--official-samples','false','--inspect','--inspection-protocol','1','--manifest-json',…])`; no `--allow-write`, no `--manifest`, no sidecar file write (contrast `runGenerator`, which writes `.netscript/.runtime-manifests/*.json`) |
| Validation: schema/version, declared registry paths, duplicates, source files | PASS | `readStrictRecord` (exact key set on document and each entry), `inspectionProtocol !== 1` reject, `isCanonicalProjectPath` on registry and source paths, unknown/duplicate/omitted registry path rejects, duplicate source reject, `fs.exists && stat().isFile` per source with the catch also failing closed. Path 3 cases `fails closed when …` and `rejects invalid report targets, source paths, duplicates, and source files` exercise each branch |
| Declared protocol that fails is fail-closed, never a walk fallback | PASS | Every failure in `inspectRuntimeRegistrySources` is `fail()` → `throw`; the only walk call site is the `: await Promise.all(targets.map(discoverRegistrableSourceFiles…))` else-branch of a ternary keyed on `dryRun && inspectionProtocolDeclared`, which is decided before the child runs. Nothing catches inside the generator; the doctor catch (`diagnoseRuntimeRegistries`) turns the throw into a `runtime-registry:inspection` **error** report. I found no input that reaches the walk after an advertised protocol fails — a non-`1` value (`2`, `"1"`, `null`) is declared-and-invalid and throws before any exec (path 3 asserts `invalidProcess.calls` empty) |
| Absent protocol retains legacy behaviour | PASS | Absent key → `inspectionProtocolDeclared=false` → walk, `sourceAuthority:'manifest'`, no child process (path 3 `dry-run reports canonical paths without executing or writing`); real generation (`dryRun:false`) is unchanged for both cases — it still walks for the `EmptyPluginRegistryError` guard and still runs `runGenerator` with `--allow-write` |
| PE-2: inspect report `sourceFiles` deep-equals `compileAiRegistry(files,target).files` per target, membership **and** order, against the plain builder | PASS | `ai-registry-compiler.test.ts` `inspect report exactly matches compile selection for every target without writes`: calls `inspectAiRegistries(files, targets)` directly (no subprocess), then per target `assertEquals(report.registries[index].sourceFiles, compiled.files)` — `assertEquals` on arrays is order-sensitive |
| PE-5: doctor-health regression in path 6, integration test untouched | PASS | `plugin doctor stays healthy when AI generation excludes the skill-loader factory` is in `doctor-plugin-registry-drift_test.ts`; integration test byte-unchanged |
| No writes in inspect mode, demonstrated | PASS with one minor gap (F-1 below) | Three layers present as planned: in-memory `ProjectFiles` write map (AI test), `MemoryFileSystem` snapshot + argv assertions (path 3 line 99 case), and full project byte snapshot across a real doctor run (path 6). Independently re-verified: my own probe (dry-run inspect on a real temp AI project) reported `changed: []` for every pre-existing file |
| One pure selector shared by inspect and compile | PASS | `selectAiRegistrySources` is the only place the discover→`isRegistryInput`→sort→`selectToolDefinitionModules` chain exists; `compileAiRegistry` now calls it and returns its array as `files`; `inspectAiRegistries` returns it as `sourceFiles`; `generate-runtime-registries.ts --inspect` only `JSON.stringify`s the document. On the host, the CLI only **validates** (rejects) and re-sorts by `localeCompare`; it never filters, so no second predicate can drop or add a file. Downstream `checkRuntimeRegistryDrift` compares `Set`s, so the re-sort cannot change a verdict |
| Bounded healthy output | PASS | Healthy message: `Verified <registry> against N generator-selected source file(s): <list>. This verifies generator-selected runtime registry sources only; no non-registry runtime topology was verified.` Error message names the registry, the missing/orphaned files, the authority used, and the exact remediation |
| PE-10 neutral wrapper title | PASS | `workspaceErrorReport('runtime-registry:inspection', 'Runtime registry inspection', error)`; protocol errors keep the `Generator inspection protocol 1 failed for <plugin>:` prefix for disambiguation |
| PE-8 raw command, not a catalog receipt | PASS | worklog/PR record it as raw `deno task check:mcp-export-corpus`; reproduced above |
| PE-9 expected F-1 WARN stated | PASS | worklog "PE-9's WARN arrived exactly as predicted" (478→673 lines); reproduced by `arch:check` |
| Sweep-1 `EmptyPluginRegistryError` retained | PASS | `if (itemCount === 0) throw new EmptyPluginRegistryError(installed.name)` sums selected sources across all targets for both authorities; path 3 `preserves EmptyPluginRegistryError when an advertised report selects nothing` |

## #1673 acceptance criteria — met by code, not by assertion

| # | Criterion | Code path | Independent evidence |
| --- | --- | --- | --- |
| 1 | doctor compares registry against the source tree, not itself | `checkRuntimeRegistryDrift`: expected = generator-selected or manifest-walk `sourceFiles`; actual = registry imports whose binding is used in the body | path 6 cases 1–4 green at head |
| 2 | source present / registry absent → failure naming file + remediation | `Missing generated entry for <authority> source: <path>. … Run: netscript generate plugins` | path 6 `fails when a saga is authored after generate plugins` asserts `sagas/late-saga.ts` and `netscript generate plugins` |
| 3 | reverse orphan reported | `Registry entry has no <authority> source: <path>` | path 6 `reports registry entries whose source was removed` |
| 4 | healthy states exactly what was verified | evidence-boundary sentence on every healthy check, authority-specific wording | path 6 aligned + none + AI cases assert the boundary text and `generator-selected source file` |
| 5 | regression: saga authored after generate, no regenerate, doctor fails | path 6 case 1 (S2 red-before `c947b8fa`) | reproduced green at head, and the S7 AI case proves the inverse false-failure from cycle 1 is gone |

## Findings

### F-1 — minor — inspect-mode child can create `deno.lock` on a never-generated project

- **Derived from:** own probe (`createInstalledRuntimeRegistryGenerator(...)({ dryRun: true })` on a
  temp AI project built like `writeAiProject` but **without** a prior real generation):
  `added: ["deno.lock"], changed: []`.
- **Mechanism:** the child is `deno run --config <project>/deno.json …`; Deno creates/updates the
  lockfile beside the config as runtime behaviour, which `--allow-read` cannot prevent. The
  path-6 layer-3 snapshot is taken after real generation, by which point the lockfile already
  exists, so this state is outside its coverage.
- **Why minor, not blocking:** (a) legacy doctor already runs
  `deno run --no-check --allow-all --config <project>/deno.json` for every configured-module probe
  (`configured-plugin-manifest-probe.ts`), so lockfile creation under the project config is a
  pre-existing doctor side effect, not one introduced by this leaf; (b) scaffolded projects carry
  `deno.lock`, and on that state the byte snapshot proves no change; (c) it is not a false health
  claim — the #1673 defect class. Verdict is unaffected.
- **Follow-up (not for this leaf):** consider `--frozen` on the inspect child (fails closed instead
  of writing when the lock would change) and extend the no-write statement to say "no project file
  written or modified; Deno lockfile behaviour is the runtime's, shared with the configured-module
  probe".

### F-2 — informational — a single plugin's inspection failure masks other plugins' drift status

The plugin loop in `createInstalledRuntimeRegistryGenerator` is sequential and the first advertised
failure throws for the whole dry run; the doctor then emits one `runtime-registry:inspection`
error and no per-registry checks for any plugin. This is the correct fail-closed direction (doctor
is unhealthy) and is within the ruled design; noted only so nobody reads the single error as "the
other registries were verified".

### F-3 — informational — pre-merge obligations remain with the supervisor

Issue #1673's five acceptance boxes are unchecked and the PR Definition-of-Done has two open items
(`scaffold.runtime` runner report; Tier-A + IMPL-EVAL). Per protocol rule 12 the close-gate applies
before `status:ready-merge`; this evaluator ticks nothing. This verdict covers the implementation;
it does not substitute for the supervisor-sequenced `scaffold.runtime` report.

## Process verification

| Check | Result | Evidence |
| --- | --- | --- |
| Plan-Gate passed before implementation | PASS | PLAN-EVAL `PASS_PLAN` `7db40ca0` at plan `13402d3f`, before S7 `e24e7ce1` |
| Design section in worklog | PASS | `worklog.md` `## Design` (line 12) |
| Commit slices follow the plan | PASS | S7 `e24e7ce1` (red-before) → S8 `8dcb578f` → S9 `4e1fed64` → S10 `a073e0b1` (evidence) → Tier-A `5d1cc5a8`; each has a `[PHASE: IMPL] [SLICE: Sn]` PR comment |
| Slice gates green | PASS | re-run above |
| Tier-A slice review before sign-off | PASS | `5d1cc5a8` is the supervisor's, separate from the author's `a073e0b1` |
| Committed artifacts free of thread/session ids | PASS | `codex-thread-ids.md` records that no id was available; none present |
| F4 / workers adoption absent | N/A by ruling | not treated as a defect |

## Verdict

**`PASS_IMPL`**

| Finding | Severity | Blocking |
| --- | --- | --- |
| F-1 lockfile creation on never-generated project | minor | no |
| F-2 single failure masks other plugins' checks | informational | no |
| F-3 close-gate / `scaffold.runtime` still owed before ready-merge | informational (supervisor-owned) | no |

The implementation discharges cycle-1 F1: the doctor's expected set is the generator's own
selection when the manifest advertises the protocol, the false `skill-loader.ts` failure is gone
for product reasons (red at `e24e7ce1` and `8dcb578f`, green only at `4e1fed64`), failure is
fail-closed with no walk fallback, legacy behaviour is unchanged for non-advertising manifests, PE-2
and PE-5 are present as binding conditions, and every claim the healthy output makes is bounded to
what was verified.
