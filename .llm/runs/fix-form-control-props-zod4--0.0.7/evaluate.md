# IMPL-EVAL — PR #1960 (fix/form-control-props-zod4)

| Field | Value |
| --- | --- |
| Run ID | `fix-form-control-props-zod4--0.0.7` |
| Evaluated head | `1edd0062a5986551031db2405383fe60ecd3a9c6` |
| Trusted base | `f589d251a` (base-relative comparison anchor) |
| True merge-base | `8c549c061` (main-side `ba6f1f49a`; main-side commits between them are unrelated drift) |
| Evaluator | OpenHands (open model `openrouter/z-ai/glm-5.3-flash`), separate session from generator (Codex Sol); no reasoning-effort attestation available on this transport — not claimed |
| Archetype / overlay | `4 — Public DSL / Builder` + frontend contract overlay (per `plan.md`) |

## Plan / Process Verification

| Item | Result | Evidence |
| --- | --- | --- |
| Approved plan present | PASS | `.llm/runs/fix-form-control-props-zod4--0.0.7/plan.md` (locked decisions D1–D5, validation plan) |
| PLAN-EVAL or justified N/A | PASS | `PLAN-EVAL: N/A` recorded in `worklog.md` line 59 before implementation (justified; brief fully specified the contract) |
| Design checkpoint | PASS | `worklog.md` `## Design` (public surface, vocabulary, slices 0–3) |
| Commit slices follow design | PASS | 7 commits `93c5fa5a5…1edd0062a` match slices 0–3 incl. RED/GREEN pairs |
| Per-slice gate evidence | PASS | `worklog.md` Progress Log + raw RED probes (S1: 3×TS2322; S2: exact missing-map diff) |
| SKILL chapter in brief | PASS | `implement-brief.md` line 3 `## SKILL` |

## Gate Verification (evaluator-run at head `1edd0062a`)

| Gate | Result | Evidence |
| --- | --- | --- |
| S1 consumer probe | PASS | `deno check --unstable-kv --config packages/fresh/deno.json packages/fresh/src/application/form/control-props-element-assignability_test.tsx` exit 0 (role now in Preact 10.29.2 literal union) |
| S2 adapter test | PASS | `deno test --allow-all packages/fresh/src/application/form/schema-adapter/schema-adapter.test.ts` → 18 passed / 0 failed (five-field full map + exclusive-bound omission asserted) |
| Full form suite | PASS | `deno test --allow-all packages/fresh/src/application/form/` → 62 passed / 0 failed |
| Form doc lint | PASS | `deno doc --lint packages/fresh/src/application/form/mod.ts` exit 0 |
| Lock hygiene | PASS | `deno.lock` SHA-256 `6c8f90a2…b94d6` byte-identical to base `8c549c061` (`git diff 8c549c061 -- deno.lock` = 0 lines) |
| Arch-debt delta | PASS | No diff on `.llm/harness/debt/arch-debt.md` (plan expected none) |
| MCP export corpus freshness | **FAIL** | CI run 33695600600 (quality + check-test) and local reproduction below |

## Corpus Staleness — Attribution (decisive matrix, evaluator-run)

`check:mcp-export-corpus` regenerates the corpus from `deno doc` over `GENERATOR_READ_SET = ['packages','plugins']` and compares; it is **read-only in `--check` mode** (the `--allow-dirty` guard exists only for mutation).

| Ref | Result |
| --- | --- |
| Merge-base `8c549c061` (worktree `/tmp/base-wt`, clean) | PASS, exit 0 (sha256 `284917fc…75fa0`, 35 pkgs / 273 subpaths / 7841 symbols) |
| Main-side `ba6f1f49a` (CI merge target, worktree `/tmp/main-wt`) | PASS, exit 0 |
| PR tip `1edd0062a` (this worktree) | **FAIL** — stale |

In-memory diff probe (`.llm/tmp/eval-corpus-diff.ts`, no file written): regenerated source ≠ committed
(`packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts`, payload 426332
vs 426336 bytes). Root cause: the PR widens the `packages/fresh` public surface — `ControlProps.role`
(`readonly role?: string` → 138-literal ARIA union) and `getConstraints()` regex/numeric behavior —
changing the embedded `deno doc` signatures. Last corpus commit: `5ce87fb8b` (pre-PR, from main).
The PR must regenerate the corpus; plan's Non-Scope (`deno.json`, deps, fresh-ui) is **not** violated
by this mechanical generated-asset commit.

## Findings (severity-ranked)

1. **[Blocking] MCP export corpus stale** — CI `quality` ("MCP export corpus freshness", step at
   `.github/workflows/ci.yml:397–402`, gate `.llm/tools/gates/catalog.ts:41`) and `check-test`
   (2 assertions) fail at tip; `close-gate` fails on the DoD line-58 box that this evaluation
   satisfies. Required action: run `deno task gen:mcp-export-corpus` (commit the regenerated
   `export-surface-corpus.generated.ts`), push; then tick PR body line 58 DoD box with this
   evaluation as evidence and re-run CI.
2. **[Process note] Close-gate ordering** — the IMPL-EVAL DoD box is closed by this session's
   verdict; CI needs the refreshed head before it can go green.
3. **[Non-blocking] Plan did not list the corpus gate** — the generator's validation plan covers
   `quality:gate` (`quality:scan && arch:check`) but the separate CI corpus-freshness step was
   outside its gate set; it is mechanically satisfied by the same regeneration commit.

## Verification of Locked Decisions

| ID | Verified |
| --- | --- |
| D1 inline Preact 10.29.2 role literals | PASS — prop-types.ts lines 166–302; consumer probe exit 0; doc lint exit 0 |
| D2 inclusive-only `greater_than`/`less_than` | PASS — `zod-constraints.ts` maps only `inclusive === true`; dedicated exclusion regression passes |
| D3 `multiple_of` → `step` | PASS — both `multipleOf` and `multiple_of` kinds mapped to `step: 5` in test |
| D4 nested `_zod.def.pattern` for `format: 'regex'` | PASS — `readCheckRegExp` with `RegExp.source`; `slug.pattern` asserted |
| D5 legacy kinds preserved | PASS — `min`/`max`/`multipleOf`/`string_format:'url'` branches intact; 18/18 tests incl. legacy |

## Verdict

Approved scope is complete and all slice-level gates pass, but a required CI gate
(`mcp-export-corpus`) fails at the evaluated head and the fix is one mechanical generated-asset
regeneration commit inside the plan's own read-set. Per `verdict-definitions.md` this is
**FAIL_FIX** (plan valid; a required gate fails).
