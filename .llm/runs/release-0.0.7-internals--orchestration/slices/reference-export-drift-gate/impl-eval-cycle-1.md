# IMPL-EVAL — reference-export-drift-gate (PR #1666)

## Verdict

**FAIL_FIX**

One required fix, confined to the already-authorized test-only path
`.llm/tools/docs/check-exports-drift_test.ts`. No product, source, workflow, task, or receipt change
is required. Everything else in the leaf was re-derived and holds; the checker itself behaves
correctly — the defect is that three of the four committed refusal tests cannot fail when the
refusal they name is removed, so they are not the durable proof SA-1 and plan S1 require.

## Binding

| Field                         | Value                                                                                                                      |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Evaluator                     | Claude Fable 5, fresh separate session (opposite-family to Codex GPT-5.6 Sol author)                                       |
| Session                       | `claude.ai/code/session_013RnnFDtHQhEbFhJCLbkEsD` (bg job `3882ca70`)                                                      |
| Immutable implementation head | `47ca22abe94b9d2e54d3778edc8944094b227886` — the code judged                                                               |
| Evidence head                 | `d095c1260a2474f3ae16cd5b17f3bfcbbada9c94` — receipts/audits/artifacts                                                     |
| Base                          | `baf1cdf67a4e931af17b4772ddf6101f36152184` (= `merge-base HEAD origin/main`)                                               |
| Local / remote / PR head      | all `d095c1260` — no mismatch; PR draft, base `main`                                                                       |
| Receipt `gitHead`             | all seven = `47ca22abe` = `actualGitHead`; the evidence commit carries them — verified as intended binding, not a mismatch |
| Author thread                 | Codex `01a005d2-7c9d-7dd1-b6fc-531b72dc14e4`                                                                               |

Reproductions ran in place read-only, in `$CLAUDE_JOB_DIR/tmp` archive copies, or under
`.llm/tmp/impl-eval-1666/` (removed afterwards). Tree clean at the end (`git status --short` empty).
No Aspire/Docker/browser/`e2e:cli`/scaffold/runtime smokes were run; no lease requested.

## Findings

### F1 (required fix) — refusal tests for reason / mode / invented-symbol are non-discriminating

Artifact: `.llm/tools/docs/check-exports-drift_test.ts:98-113` (reason + mode) and `:157-161`
(invented symbol) at `47ca22abe`.

Executed evidence — each mutant built from `git archive 47ca22abe` of the checker, tests unchanged:

| Mutant on `check-exports-drift.ts`                                              | Named test                                               | Result                                                     |
| ------------------------------------------------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------- |
| `checkSymbolsDrift` INVENTS branch disabled (`if (false && …)`, line 435)       | `refuses an invented symbol through the injectable seam` | **still ok** (6 passed)                                    |
| unknown-mode error replaced by accepting `entrypoints-only` (line 566)          | `refuses an unknown coverage mode`                       | **still ok** (6 passed)                                    |
| `symbolCoverage.reason` nonempty check replaced by coercion to `'x'` (line 541) | `refuses an empty or malformed coverage reason`          | **still ok** (6 passed)                                    |
| `checkSymbolsDrift` OMITS branch disabled (line 421)                            | `refuses an omitted symbol through the injectable seam`  | FAILED (5 passed / 1 failed) — this test is discriminating |

Cause: `fixtureMapping()` uses `packagePath: 'unused'` / `docPath: 'unused'`, so when validation is
bypassed `checkDrift` still returns 1 from `Failed to read deno.json for fixture … NotFound`; and
the invented-symbol fixture documents only `inventedSymbol` while the real export `actualSymbol` is
undocumented, so the OMITS error alone yields 1 (the committed test output shows both
`OMITS 'actualSymbol'` and `INVENTS 'inventedSymbol'`). The tests assert exit code only, never the
refusal cause.

Why this blocks: SA-1 authorized the test path precisely because "proving that with one-off probes
leaves no artifact that can fail a future CI run"; plan S1 "Proves" and validation row 1 require
committed tests asserting nonzero for each of the four refusal cases. Three of the four cannot fail
on the regression they name — the proof for those cases today rests only on my ephemeral probes.

The checker itself is correct (independently probed on the real Contracts mapping: empty reason,
`42` reason, and mode `partial` each print `Coverage Policy Error …` and return 1; the valid mapping
returns 0). This is a test-quality defect, not a product defect.

Required fix (test file only, no other path): make each refusal test fail only for its own cause —
e.g. assert `validateAuthoritativeMapping(...).errors` contains the specific message (or capture
`console.error`), and/or point the malformed-policy fixtures at a real fixture dir (reuse
`withSymbolFixture`) so a file-read error cannot stand in for the refusal; and document
`actualSymbol` alongside `inventedSymbol` in the invented case
(`withSymbolFixture(['actualSymbol',
'inventedSymbol'], …)`) so OMITS cannot mask INVENTS. Re-run
`deno test --allow-all .llm/tools/docs/check-exports-drift_test.ts` and record it. Because the fix
touches an implementation path, the receipts bound to `47ca22abe` no longer attest the new head; the
`test` receipt (at minimum) must be re-cut at the new immutable head, or the coordinator must
explicitly rule the delta test-only and accept the focused run as the amendment evidence.

## Re-derived judgments (all hold)

1. **#1296 acceptance / `Closes #1296`.** Enumerated all nine shipped Contracts `@example` import
   lines (`grep` over `packages/contracts/**/*.ts` incl. the four entrypoint module docs) and ran
   `deno doc --filter` per symbol against the claimed entrypoint: `baseContract`,
   `BaseContractRoute`, `BaseContractOutputRoute` on root; `paginatedQuery`,
   `FilterConditionSchema`, `buildPrismaWhere`, `PaginationInputSchema`, `createPaginatedOutput`,
   `OffsetPaginationQuerySchema` on `/query`; `createTransformer` on `/transform`;
   `createCrudContract` on `/crud` — all resolve (`EXIT=0`); the six repaired symbols are absent
   from root (`Node … was not found!`, `EXIT=1`). **No fifth wrong-root example survives** in the
   publish set. Fresh UI row, omissions row, runbook row: see 3–5. `Closes #1296` is earned subject
   to F1 and the close-gate note below. Advisory only: `schemas/pagination.ts` example still uses
   free `baseContract`/`UserSchema` identifiers beyond the import line — outside SA-2 authorization,
   already recorded in `drift.md` (PLAN-EVAL O1) and deferred to #1533; the issue's first box says
   "code that compiles", so the coordinator should map that box's evidence to import correctness and
   name the #1533 remainder rather than imply standalone compilation.
2. **Fail-closed seam.** `checkDrift(mapping)` is exported; `if (import.meta.main)` binds
   `Deno.exit(await checkDrift(AUTHORITATIVE_MAPPING))` (`check-exports-drift.ts:799-801`). All four
   refusal cases are genuinely nonzero when driven directly. Committed-test durability: see F1.
3. **Per-package accounting is true.** `deno task docs:exports-drift` prints eight `Coverage [...]`
   lines then `PASS`, exit 0. Same eight packages as baseline (none dropped). `complete` packages
   (`fresh-ui`, `config`, `contracts`, `telemetry`) really are enforced: the checker runs
   `deno doc --json` per export-map entry and errors on any undocumented export not in a
   reason-bearing group; the `telemetry` omission group is printed (`omitted-symbol-groups=1`) and
   each omitted symbol is verified exported-and-undocumented. `entrypoints-only` packages print that
   mode with reason. Note (non-blocking, plan-locked N5): the aggregate `docs:accuracy` suppresses
   child stdout on success, so the coverage lines are visible through the direct task and on
   failure, not in a green aggregate log.
4. **Fresh UI reference truth.** Union of `deno doc --json` over all six export-map entries = 168
   unique symbols (28/11/35/82/16/7 per entrypoint). Parsed every `Symbol`-headed table on the page
   (175 cells = 168 exports + 7 Dropzone) and checked each symbol against the entrypoint its `##`
   section claims — zero mismatches, zero non-exports outside the Dropzone section. Dropzone is
   labelled "a copy-source registry component, not a package export" and its seven names are the
   `documentedNonExports` group. Live probes on a page copy: invented symbol → `INVENTS`, exit 1;
   removed `cn` → `OMITS 'cn'`, exit 1; unchanged → 0.
5. **S2 discoverability, single execution, permissions.** `deno.json:85` adds `docs:exports-drift`
   (`--no-lock --allow-read --allow-run=deno`, narrower than the previous `--allow-all` child argv);
   `check-accuracy-and-discoverability.ts:292-300` spawns `deno task docs:exports-drift` once and
   still prints child stdout/stderr then throws on nonzero; `pages.yml:143-145` adds one root-cwd
   step under `if: env.RUN == 'true'`, triggers unchanged (diff is +3 lines). `grep` over
   workflows/catalog: `ci.yml` reaches the checker only via `docs-accuracy`; Pages runs only the
   direct task — exactly once per path. PR body, worklog and drift state plainly that enforcement
   pre-existed (`ci.yml → catalog → docs:accuracy → child`) and credit this leaf with
   discoverability only. `pages-workflow_test.ts` passes; `docs:accuracy` exit 0 (3.6 s).
6. **JSR / pins / publish delta.** Contracts export map `.`/`/crud`/`/query`/`/transform`; zero
   `@netscript/*` imports. Fresh UI: exactly two pins, both `jsr:@netscript/sdk@0.0.6/...`.
   `deno publish --dry-run --allow-dirty` in `packages/contracts`: `Dry run complete`. The Contracts
   delta is four one-line JSDoc import edits (`git diff baf1cdf67 47ca22abe -- packages/contracts`),
   no export/API/runtime change — stated honestly.
7. **Baseline reds.** `audit/doc-lint-contracts.json`: 9 `private-type-ref` in
   `contract-primitives.ts` (8) and `create-crud-contract.ts` (1) — both untouched;
   `/query`,`/transform` exit 0. `audit/doc-lint-fresh-ui.json`: 123 on `/interactive` only; no
   Fresh UI package file touched. oRPC slow-type INFO and `F-DOCT-4 vocabulary` WARN
   (`registry/lib`) present in `audit/jsr-*.json`. `s3-evidence.md` and `worklog.md` carry them as
   **RED / raw exit 1** and WARN, attributed to baseline, not in the seven PASS receipts, not
   waived. None is a regression of this leaf.
8. **Scope and lock.** `git diff --name-only baf1cdf67 47ca22abe` minus `.llm/runs` = exactly 10
   paths, all inside the 13; `docs/exports` absent; `contract-primitives.ts`, `src/public/mod.ts`,
   both package `deno.json`, `prisma-adapter-mysql` byte-identical to base; `deno.lock` identical to
   base through `d095c1260`. Evidence commit touches run artifacts only.
9. **Receipts.** Seven receipts, `invocationId`s
   `reference-export-s3-{arch-check,check,
   docs-accuracy,docs-source-format,publish-dry-run,quality-job,test}`,
   each `outcome: PASS`, `exitCode: 0`, `gitHead == actualGitHead == 47ca22abe`;
   `audit/evidence-set.json` `SUFFICIENT`. The set is sufficient for a
   checker/docs/JSDoc/task/workflow surface (`test` covers the tool tests under root discovery;
   `publish-dry-run` covers the shipped JSDoc). Sufficiency of the set does not cure F1 — the `test`
   receipt proves the tests pass, and F1 shows three of them pass vacuously.
10. **`fresh-browser`.** Recorded as `NOT_RUN`, N/A / waived (SA-1) in plan, worklog, s3-evidence,
    drift; never restated as pass; no lease.

## Process notes (non-blocking)

- PLAN-EVAL cycle 2 `PASS` (`45c249b9c`) precedes S1; the S1/S2/S3 commit trail exists as PR
  comments. `worklog.md` has no literal "Design checkpoint" entry; design is carried by the locked
  D1–D11 table in `plan.md` and the recorded PLAN-EVAL PASS — noted per protocol rule 3, not
  blocking.
- Close-gate (pre-`ready-merge`, coordinator-owned): all five #1296 acceptance boxes are unchecked
  and no `acceptance-evidence` block exists yet; the PR DoD's last box is correctly unchecked. Map
  all five boxes (the issue has five, the plan's live table folds the first two together).

## Executed command log (abridged)

- head binding: `git rev-parse HEAD`, `git fetch origin fix/reference-export-drift-gate`,
  `gh pr view 1666 --json headRefOid,isDraft,baseRefName`, `git merge-base HEAD origin/main`
- `deno test --allow-all .llm/tools/docs/check-exports-drift_test.ts` → 6 passed
- `deno task docs:exports-drift` → 8 coverage lines, PASS, exit 0
- `deno task docs:accuracy` → PASS, exit 0
- `deno test --no-lock --allow-read --allow-write --allow-run .llm/tools/docs/pages-workflow_test.ts`
  → ok
- `deno check --unstable-kv` on the three tool files → ok
- `packages/contracts`: `deno doc --filter <sym> <entry>` ×11 OK, ×6 root MISS;
  `deno publish --dry-run --allow-dirty` → Dry run complete
- `packages/fresh-ui`: `deno doc --no-lock --json <entry>` ×6 → 168 unique symbols; page/section
  cross-check script → 0 mismatches
- four checker mutants under `$CLAUDE_JOB_DIR/tmp/mut` (table in F1)
- forbidden-surface `git diff --quiet` → clean; `deno.lock` diff → identical
