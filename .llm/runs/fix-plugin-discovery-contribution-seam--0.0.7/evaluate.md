# Evaluation: third-party plugin discovery contribution seam (#1093)

## Metadata

| Field          | Value                                                       |
| -------------- | ----------------------------------------------------------- |
| Run ID         | `fix-plugin-discovery-contribution-seam--0.0.7`             |
| Target         | `packages/plugin` (SDK discovery seam)                      |
| Archetype      | `4 — Public DSL / Builder`                                  |
| Scope overlays | none                                                        |
| Evaluator      | separate-session IMPL-EVAL, GLM 5.3 Flash via OpenRouter, 2026-08-31 |
| Base…Head      | `bd9d463b4`…`015fa5686`, branch `fix/plugin-discovery-contribution-seam` |

## Process Verification

| Check                                  | Result | Evidence                                                                                                             |
| -------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------- |
| Plan-Gate passed before implementation | PASS   | `PLAN-EVAL: N/A` recorded by supervisor in `drift.md` (commit `b539eac9c`) **before** first RED commit `4659162df`.   |
| Design section exists in worklog       | PASS   | `worklog.md` "## Design" (public surface, ports, constants, validation rules).                                       |
| Commit slices match design plan        | PASS   | S1 = RED `4659162df` → GREEN `f57a28e41` (extractor-port, ast-extractor, test); S2 = RED `148a655c4` → GREEN `015fa5686` (start-walker, sdk/mod, README, test). File lists match plan § Commit Slices exactly. |
| Each slice has a passing gate          | PASS   | RED reproduced failing, GREEN reproduced passing (see Reproduction).                                                 |
| No speculative seams (unused files)    | PASS   | Both new exports consumed: `AstExtractorOptions` by `startWalker`/tests/README; `ContributionBuilderPattern` by the options contract. |
| Constants used for finite vocabularies | PASS   | `DEFAULT_CONTRIBUTION_BUILDERS` frozen const (`ast-extractor.ts:10-14`); no string-literal scattering.               |

## RED-before-Green Reproduction (independent, via `git archive` of each SHA into `.llm/tmp/`)

| SHA         | Tree touched        | Focused test result (reproduced by evaluator)                                                    |
| ----------- | ------------------- | ------------------------------------------------------------------------------------------------ |
| `4659162df` | test file only (+67/−1) | exit 1 — **5 passed / 2 failed / 7 total, 2 unique failures**: synthetic `defineChannelSync` silently absent (actual `[]`); malformed/duplicate config did **not** throw. Product reason confirmed. |
| `148a655c4` | test file only (+30) | exit 1 — **7 passed / 1 failed / 8 total, 1 unique failure**: `startWalker` did not forward options (emissions `[]`). Product reason confirmed. |

Both RED commits contain **zero product source** (`git show --stat`: only `walker-ports_test.ts`).

## Gate Reproduction (HEAD `015fa5686`)

| Gate                        | Command (abridged)                                    | Result | Evidence                                                                                     |
| --------------------------- | ----------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------- |
| Package tests               | `run-deno-test.ts -- --allow-all packages/plugin`     | PASS   | exit 0 — **87 passed / 0 failed / 87 total**.                                                                |
| Scoped check                | `run-deno-check.ts --root packages/plugin --ext ts,tsx` | PASS | 153 files, 2 batches, 0 failed batches, 0 findings.                                                          |
| Scoped lint                 | `run-deno-lint.ts --root packages/plugin --ext ts,tsx` | PASS  | 153 processed, 0 dropped / 0 refused / 0 findings.                                                           |
| Scoped format               | `run-deno-fmt.ts --root packages/plugin --ext ts,tsx` | PASS   | 153 processed, 0 findings.                                                                                   |
| Code-quality scan           | `scan-code-quality.ts --root packages/plugin --max-allow 0` | PASS | 0 findings, 0 allowances.                                                                               |
| Full export doc-lint        | `run-deno-doc-lint.ts --root packages/plugin`         | PASS (non-increase) | 15 private refs / 0 missing JSDoc / 0 other; `./src/sdk/mod.ts` entrypoint = 0 findings; no S2-owned file. |
| Package JSR audit           | `audit-jsr-package.ts --root packages/plugin`         | PASS (non-increase) | **4 FAIL / 2 WARN / 1 INFO** (exact base match); dry-run OK; no finding on an S2-owned file.     |
| Package publish dry-run     | `deno publish --dry-run --allow-dirty`                | PASS   | Success; exactly **2** `unanalyzable-dynamic-import` warnings at `generated-project-registry.ts:69` and `manifest-resolver.ts:33` — same locations/classes as baseline. |
| Scoped doctrine             | `check-doctrine.ts --root packages/plugin`            | PASS (improved) | HEAD **0 FAIL / 2 WARN / 1 INFO** vs base 0 FAIL / **3** WARN / 1 INFO (README A3 fence warning resolved by the new section). |
| Public surface inspection   | `deno doc --filter <symbol> packages/plugin/src/sdk/mod.ts` | PASS | `AstExtractorOptions` and `ContributionBuilderPattern` exported + documented; `constructor(options?: AstExtractorOptions)`; `startWalker(root, extractorOptions?)`; no-arg path preserved. |
| Lock hygiene                | `sha256sum deno.lock` before and after all gates      | PASS   | SHA-256 `edfa0c24b70e0d830acce68aad6f5da42b66a88527aef4b80f3f82d989d1820c`, empty `git diff bd9d463b4..HEAD -- deno.lock`. |
| MCP corpus freshness        | `deno task check:mcp-export-corpus`                   | reported, not absorbed | HEAD: **fails — "MCP export-surface corpus is stale"**; base tree (product at `bd9d463b4`): **passes** (sha256 `cd2824b5…`, packageCount 35) → staleness introduced by this run, exactly as `drift.md` attributes; `packages/mcp/**` untouched. |

## Ceiling (Claim A)

`git diff --stat bd9d463b4..HEAD` contains exactly the 6 ceiling paths plus 4 run-artifact files
(`plan.md`, `research.md`, `worklog.md`, `drift.md`). No `packages/mcp/**`, no manifest
schema/config/protocol path, no `packages/cli/**`, no generated asset, no lock change. Working tree
clean at evaluation time.

## Claim Table (leaf brief A–G)

| Claim | Verdict | Deciding evidence |
| ----- | ------- | ----------------- |
| A. Ceiling | **UPHELD** | Diffstat = 6 allowed paths + `.llm/runs/` artifacts only; `git status` clean. |
| B. RED-before/green | **UPHELD** | Both RED commits test-file-only; independently reproduced failures at each SHA for the product reason (table above); worklog's claimed counts match byte-for-byte (5/2 and 7/1). |
| C. Seam is real | **UPHELD** | Synthetic `defineChannelSync` + `defineLateBuilder` appear **nowhere** in product source (`grep packages/plugin/src/` = 0 hits outside test/README); default table stays exactly 3 (`ast-extractor.ts:10-14`). The suite structurally forbids the "fourth hardcoded row" cheat: adding `defineChannelSync` as a default row would make the constructor throw `Duplicate contribution builder callee "defineChannelSync"` in the snapshot test. Snapshot half (`defineLateBuilder` pushed post-construction, mutated axis) proves per-instance copy, not a shared list. Preset forwarding proven end-to-end against a real temp dir (`.netscript/generated/channel-syncs.registry.ts`). |
| D. Backward compatibility | **UPHELD** | Untouched base oracle `ExtractorPort contract returns contribution candidates from files` (`new AstExtractor()`, three official factories, named + default export) passes unchanged; new `startWalker preserves official defaults for a no-options consumer` runs a real no-arg walk and asserts `jobs.registry.ts`. Both inside the 87-pass run. |
| E. No global mutable registry | **UPHELD** | Per-instance `readonly #builders` built in constructor (`ast-extractor.ts:24-29`); defaults `Object.freeze`d; caller array snapshotted via `map` + frozen copies (`ast-extractor.ts:48-63`); no module-level mutable state, no registration export. Test mutates caller array + element after construction and asserts neither leaks in. |
| F. Malformed/duplicate fail loud | **UPHELD** | `TypeError` on invalid identifier / blank axis / duplicate-vs-official / duplicate-within-additional (`ast-extractor.ts:49-57`), thrown at construction, never a quiet drop; 4 `assertThrows` cases in `walker-ports_test.ts`. |
| G. Lock + corpus | **UPHELD** | Lock hash byte-identical pre/post gates; corpus staleness reproduced at HEAD and proven absent at base, reported in `drift.md` with owner handoff, `packages/mcp/**` not absorbed. |

## Fitness Gates (Archetype 4)

| Gate | Function                        | Result | Evidence                                                                     |
| ---- | ------------------------------- | ------ | ---------------------------------------------------------------------------- |
| F-1..F-7 | audit-jsr-package gates     | PASS (non-increase) | 4 FAIL / 2 WARN / 1 INFO, all pre-existing, none on S2-owned files.       |
| F-16 | Folder cardinality              | DEBT_ACCEPTED | 2 pre-existing WARNs (`src` 17, `src/config/domain` 15), unchanged at base. |
| F-19 | Scoped source gate runners      | PASS   | check/lint/fmt wrappers: 153 files, 0 findings each.                          |
| F-13 | Saga/runtime invariants         | N/A    | No saga/runtime code touched.                                                 |
| Others (F-8..F-12, F-14, F-15, F-17, F-18) | N/A / PASS via scoped runners | — | No new files, no console output, no re-export of upstream, no sub-barrels added. |

## Runtime and Consumer Gates

| Consumer / gate                       | Validation | Result | Evidence |
| ------------------------------------- | ---------- | ------ | -------- |
| `packages/cli` no-arg consumers (2)   | static source-compat check | PASS | `list-plugins-command.ts:73` and `public-command-dependencies.ts:351` call `new AstExtractor()` — optional ctor keeps them valid; `packages/cli` untouched. |
| scaffold / e2e / aspire / docker      | —          | N/A    | Forbidden by the leaf brief (bounded SDK configuration slice). |

## Anti-Pattern Check

| AP                | Status | Evidence                                                                              |
| ----------------- | ------ | ------------------------------------------------------------------------------------- |
| AP-9 premature abstraction | CLEAR | Exactly a two-field `{callee, axis}` descriptor; no extra machinery.       |
| AP-11 hidden globals       | CLEAR | Per-instance frozen config; no registration singleton.                     |
| AP-24 closed variant dispatch | CLEAR | Closed private table replaced by frozen defaults + injected patterns.  |
| AP-25 load-time side effect | CLEAR | No module-evaluation registration; validation happens at construction.   |
| All others                 | N/A   | Outside the touched surface.                                              |

## Arch-Debt Delta

| Metric                | Count | Evidence |
| --------------------- | ----- | -------- |
| New entries           | 0     | `.llm/harness/debt/arch-debt.md` untouched (`git diff` empty). |
| Resolved entries      | 0     | `PLG-WALKER-AST` remains open (line 701); no compiler-AST claim made. |
| Deepened violations   | 0     | Doctrine/JSR/doc-lint findings identical or improved vs base. |
| Unrecorded violations | 0     | All residual reds are pre-existing and contracted as non-increase. |

## Findings

| Severity  | Finding                                                                                                                                                                               | Evidence | Required action |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | --------------- |
| low       | Axis strings are only blank-checked; the emitter's `normalizeAxis` (`registry-emitter.ts:72-75`) collapses case/punctuation, so two distinct configured axes can silently merge into one registry file (e.g. `Jobs` and `jobs`). Path traversal is impossible (non-`[a-z0-9]` stripped), and emitter behavior is explicitly unchanged by the plan — informational only. | `ast-extractor.ts:52-54`, `registry-emitter.ts:72-75` | Optional future tightening if third-party axes multiply. |
| low       | The new README section is not executed by any snippet gate; it was verified manually this eval against `deno doc` output and is accurate.                                             | `.llm/tools/docs/check-snippets.ts` covers no `packages/plugin` README | None; note for a future docs run. |
| info      | Identifier validation rejects non-ASCII (Unicode) TypeScript identifiers for additional callees. Bounded strictness, plan-sanctioned as the regex-injection mitigation.               | `ast-extractor.ts:8,49-51` | None. |

## Lessons for Promotion

| Lesson | Pattern | Applies to | Confidence |
| ------ | ------- | ---------- | ---------- |
| Snapshot-by-construction tests double as anti-cheat for hardcoded-table fixes | Mutate the caller's config after construction and assert non-effect | Archetype 4 extension seams | high |
| RED via `Reflect.construct` keeps a no-arg constructor compiling while failing behaviorally | Test-first technique for optional-parameter seams | Archetype 4 | high |

## Verdict

| Field     | Value |
| --------- | ----- |
| Verdict   | **PASS_IMPL** |
| Rationale | Approved scope complete inside the 6-path ceiling; both RED→GREEN slices independently reproduced (test-only REDs failing for the product reason at their SHAs; greens passing); all static/fitness gates green or at contracted exact non-increase with no S2-owned finding; per-instance immutable seam with loud malformed/duplicate rejection; no-arg compatibility proven by an untouched oracle plus a new no-arg preset test; lock byte-identical; MCP corpus staleness introduced by this run and reported, not absorbed. |
