FAIL_PLAN

## Identity

| Field                     | Value                                                                                                                         |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Provider / model / effort | OpenAI · GPT-5.6 Sol · high                                                                                                   |
| Role                      | Formal PLAN-EVAL of a Claude-authored plan; no implementation performed                                                       |
| Worktree                  | `/home/codex/repos/ns006-raileval`                                                                                            |
| Evaluated checkout        | branch `eval/quality-rail-plan-eval`, `HEAD 83de0dc06ba9c2dbec864fa02a6dea432c99198e`                                         |
| Requested baseline        | `9c3cdfead`; this is the parent of the evaluator-brief-only commit `83de0dc06`                                                |
| Plan measurement baseline | `01aa12b67`; all substantive paths are identical between `01aa12b67`, `9c3cdfead`, and `83de0dc06`; only run artifacts differ |
| Date                      | 2026-08-12                                                                                                                    |

The prompt described the worktree as detached at `9c3cdfead`. Ground truth was a clean named branch
at `83de0dc06`; `git diff 9c3cdfead..83de0dc06` contains only `plan-eval-brief.md`. The verdict
evaluates the plan at the actual checkout and reports the mismatch.

## Re-measured baseline

| Claim                           | Plan                                                                                   | Independent result                                                                                                                                                             | Verdict / command                                                                                            |
| ------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| Default quality scan            | exit 0, `allowCount: 7`                                                                | exit 0, 0 findings, `allowCount: 7`                                                                                                                                            | **confirmed** — `deno task quality:scan`                                                                     |
| Repo quality scan               | exit 1, 5 findings, `allowCount: 10`                                                   | exit 1, 5 `ts-error-suppression` findings in `sdk-client-contributions-rfc_type.ts`, `allowCount: 10`                                                                          | **confirmed** — `deno task quality:scan:repo`                                                                |
| Curated doctrine gate           | exit 0                                                                                 | exit 0                                                                                                                                                                         | **confirmed** — `deno task arch:check`                                                                       |
| Repo doctrine gate              | exit 1, `FAIL=55` = 54 A14 + 1 A1                                                      | exit 1, `FAIL=55` = 54 A14 + 1 A1                                                                                                                                              | **confirmed as a count** — `deno task arch:check:repo`                                                       |
| Cause of all 54 A14 failures    | 54 sanctioned `@std/testing/bdd` imports (`plan-quality-rail.md:35,71`)                | 53 files import `@std/testing/.../bdd`; `packages/mcp/tests/service-endpoint-sources_test.ts:246-268` binds a local helper named `describe`, which the line scanner also flags | **diverges** — literal-safe import/path reconciliation over the gate output                                  |
| Live top-level units            | 30 `packages/*` + 6 `plugins/*` = 36                                                   | 30 + 6 = 36                                                                                                                                                                    | **confirmed** — `ls -d packages/*/ plugins/*/`                                                               |
| Verdict-table drift             | 6 non-live rows; 14 live units missing                                                 | 28 parsed rows; 6 non-live rows; 14 live units missing                                                                                                                         | **confirmed** — parsed `10-codebase-verdict-and-handoff.md:22-51` against live `deno.json` names/directories |
| Soundness tests                 | 6                                                                                      | 6                                                                                                                                                                              | **confirmed** — `find packages plugins -type f -name '*-soundness_test.ts'`                                  |
| Type fixtures                   | 12 `*_type.ts`, all below `tests/type-fixtures`, 3 with `@ts-expect-error`             | 12 / all / 3                                                                                                                                                                   | **confirmed** — three `find` commands plus literal grep                                                      |
| Stale-row history               | four package paths and `plugins/hello-world` never existed; only `packages/shared` did | the five paths have no add history; `packages/shared/deno.json` was added at `0ef13de35`; history records later shared-package consolidation/removal commits                   | **confirmed** — six `git log --all --diff-filter=A` probes plus removal-history probe                        |
| Numbered RFCs in `rfcs/`        | zero; accepted records live only under harness paths (`plan-quality-rail.md:75`)       | 5 accepted numbered RFCs, `0001` through `0005`, plus template and README                                                                                                      | **diverges** — `find rfcs -maxdepth 1 -type f`; `git ls-tree 01aa12b67:rfcs`                                 |
| Live acceptance-box denominator | 33 = 5 + 12 + 9 + 7 (evaluation brief)                                                 | 34 = 5 + **13** + 9 + 7                                                                                                                                                        | **diverges** — live issue-body extraction with `gh issue view`; #1380 has a thirteenth `gate:` box           |

### `deno doc --json` feasibility measurement

`packages/sdk` (12 export entrypoints) completed in 0.17 s and `packages/fresh` (15 entrypoints) in
0.74 s on individual timed runs. A loop over every export map of all 30 top-level package
directories completed in 3.733 s, with zero non-zero exits. Runtime is suitable for a PR gate.

The full loop nevertheless emitted 567 `Warning Failed resolving types` warnings while returning
exit 0 (156 for `packages/ai`; 81 each for database, kv, plugin-sagas-core, and queue; 87 for
fresh). Therefore R-3 needs a fail-closed warning/partial-AST contract; exit 0 alone is not proof
that every published declaration was resolved. `deno doc --json` does expose symbol declarations and
origin locations (sampled on `packages/sdk/mod.ts`), so an AST-driven implementation is feasible.

## Findings

1. **blocking — the plan's load-bearing A14 baseline is wrong.** Evidence: `plan-quality-rail.md:35`
   says the population grew to `54 × A14`, and R-5 at line 71 says all 54 are `@std/testing/bdd`
   imports. Reconciliation of all 54 A14 output paths finds 53 such imports and one different false
   positive: `packages/mcp/tests/service-endpoint-sources_test.ts:246-268` defines and calls a local
   function named `describe`. `check-doctrine.ts:403-413` scans the whole file with a bare
   identifier regex and therefore cannot distinguish either imported or locally declared bindings
   from globals. Required change: re-baseline the decomposition as 53 sanctioned BDD imports + 1
   local binding, and make PR-C tests cover both origins plus a true unresolved global.

2. **blocking — R-9 is based on repository state that was already false at the plan's baseline.**
   Evidence: `plan-quality-rail.md:75` claims `rfcs/` holds only a template and README and selects
   the harness path as canonical. At `01aa12b67`, `rfcs/` already contains accepted files
   `0001-sdk-client-contributions.md` through `0005-devtools-contribution.md`; commits `b3dc006e8`,
   `f3eb957ec`, `625be20a3`, `ef266832a`, and `03680f6e8` are all ancestors of `01aa12b67`. Each
   file declares `status: Accepted`; `rfcs/0005-devtools-contribution.md:10-18` expressly identifies
   `rfcs/README.md` as canonical and records correction away from an unmerged alternative
   convention. Required change: replace R-9 with the live rule: accepted RFCs are promoted to
   numbered `rfcs/NNNN-*.md`; harness design bundles are provenance/draft artifacts. Map the five
   `DECISION_PENDING` entries to that canonical process without filing them.

3. **blocking — PR-C's provenance deliverable cannot satisfy #1380 box 2 as currently worded.**
   Evidence: the live box requires every removed row to be recorded as "renamed (with its new name)
   or deleted," while `plan-quality-rail.md:54-57` locks a third state for five rows: authored
   against a layout that never landed. The history supports the plan's factual state, but the issue
   contract does not permit it; calling those units renamed or deleted would fabricate history.
   Required change: reconcile the live #1380 target/acceptance wording before PR-C (with owner
   authority) to admit "never existed under this name" and require per-row history evidence. Do not
   tick the current binary box against a third-state deliverable.

4. **blocking — six live acceptance boxes have no stated PR proof route.** Evidence: the per-PR
   contracts in `plan.md:86-107`, `plan.md:143-150`, and `plan-quality-rail.md:111-118` do not state
   deliverables/proofs for #1380 boxes 8-10 (which units `arch:check` gates and exclusions; dated
   engineering-reference plan; five pending decisions mapped in `rfcs/README.md`), #1378 box 7 (type
   both trigger reference sites), or #1530 box 7 (post-merge `code-quality-repo` green). #1378 box 6
   is assigned only a generic budget-overflow test; that does not prove the distinct requirement
   that a budget increase carry an issue link in the same PR. Required change: add explicit PR-C,
   PR-D, and PR-E slice rows with files and proving commands/checks for these six boxes. Route
   #1530's observational post-merge box to a follow-up verification issue per
   `milestone-run.md:104-108`, or keep #1530 open until it fires; a pre-merge PR cannot truthfully
   close it.

5. **blocking — the required Research and Design checkpoint inputs are absent.** Evidence:
   `.llm/harness/evaluator/plan-protocol.md:11-22` requires `research.md`, `plan.md`, and the
   `## Design` section of `worklog.md`; `plan-gate.md:16-34` makes current research and ordered
   file/gate slices mandatory. The run directory contains no `research.md`, and `worklog.md`
   contains no `## Design` section (no public surface/domain vocabulary/ports/constants/commit
   slices/deferred scope/contributor path). `plan-quality-rail.md` carries useful baseline material,
   but it does not supply the missing Design contract, and the four per-PR summary rows are not
   file-scoped commit slices. Required change: add the standard artifacts (or explicitly amend the
   harness protocol before evaluation), including ordered PR-E/B/C/D slices, exact files, and a gate
   per slice.

6. **blocking — the #1374 extractor collision is a rework-forcing open decision.** Evidence:
   `plan-quality-rail.md:81` marks ownership "must resolve before PR-D" but leaves it open;
   `plan-gate.md:20-22` says any open decision that would force rework is `FAIL_PLAN`. The live
   #1374 plan at
   `/home/codex/repos/ns006-1374-compilegate/.llm/runs/test-1374-docs-compile-gate--leaf/plan.md:49-65`
   already specifies a checked-in `.md`/`.vto` backtick/tilde extractor, exact `ts`/`tsx` grammar,
   line/ordinal provenance, and tests under `.llm/tools/docs`. The quality rail plans a second
   `docs/site/**` fenced-TS extractor without selecting reuse or ownership. Required change: resolve
   before any rail implementation begins: PR-D consumes the #1374 extractor if #1374 lands first, or
   the shared extractor is extracted into an agreed prerequisite PR/API with one owner and one
   parser test corpus. This can collide at `deno.json` already in PR-B; waiting until PR-D does not
   avoid rail rework.

7. **should-fix — R-3 needs a fail-closed diagnostic rule even though performance is acceptable.**
   Evidence: the 30-package timing loop was 3.733 s, but `deno doc --json` returned exit 0 while
   emitting 567 resolution warnings. Required change: state whether any resolution warning fails the
   export audit, or identify and test an allowlisted warning class; also add a fixture proving a
   re-exported `any` is attributed to the published entrypoint. Do not treat exit 0 as a complete
   AST.

8. **should-fix — R-4's phrase "live workspace members" is broader than #1380's 36-unit contract.**
   Evidence: root `deno.json:3-9` includes `packages/cli/e2e`, `examples/*`, and `apps/*` in
   addition to `packages/*` and `plugins/*`; `packages/cli/e2e` is an existing explicit nested
   workspace member and passes a standalone doctrine scan. The verdict table and #1380 acceptance
   are explicitly the 36 top-level package/plugin units. Required change: define the selector as
   expanded top-level `packages/*` and `plugins/*` package members (and explicitly decide
   `packages/cli/e2e`), rather than blindly iterating every workspace member.

9. **should-fix — R-6 creates an unnecessary temporary source of truth.** Evidence: `deno.json:156`
   is the 16-root shell list, R-6 moves it to checked-in data in PR-B, and R-4 changes its source to
   workspace discovery in the immediately following PR-C. S-4 requires the coverage assertion, not
   preservation of the transient list file. Required change: in PR-B add plugin-streams-core and a
   coverage test against a reusable `discoverDoctrineRoots()` function; PR-C expands that same
   function to the final top-level live-unit policy. If a checked-in curated list remains necessary,
   state its durable post-PR-C role; otherwise do not create it.

10. **advisory — the worktree identity in the evaluation brief is stale.** Evidence: raw git ground
    truth reports branch `eval/quality-rail-plan-eval` at `83de0dc06`, not a detached checkout at
    `9c3cdfead`. The only delta is the committed evaluator brief, so this did not alter substantive
    measurements. Required change: record actual evaluator checkout identity in the handoff
    automatically.

## Decision review

| Decision | Review                | Reason                                                                                                                                                                                                                                                                                                                     |
| -------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-1      | **sound with caveat** | PR-E is a narrow, independently closable scanner-scope defect and makes the pre-existing repo gate green before PR-D. PR-D could absorb the exemption, but that would mix restoration with new rule power and would not satisfy #1530's post-merge observation. Keep PR-E, and route/hold the observational box honestly.  |
| R-2      | **sound**             | Directory + suffix precisely matches all 12 live fixtures and avoids a global `_type.ts` or test-regex carve-out; ordinary source and out-of-directory negatives make the rule fireable.                                                                                                                                   |
| R-3      | **sound with caveat** | AST/export-map direction is feasible and fast (3.733 s for all 30 packages), and source origins are available. It must fail closed or explicitly classify the 567 resolution warnings observed on an exit-0 run.                                                                                                           |
| R-4      | **sound with caveat** | Data-derived roots are correct, but "workspace members" must be narrowed to the 36 top-level package/plugin units or explicitly decide the nested `packages/cli/e2e` member.                                                                                                                                               |
| R-5      | **sound with caveat** | Identifier origin is implementable without a type checker via lexical import/top-level binding collection; the newly found local `describe` proves imports alone are insufficient. The plan must acknowledge lexical binding/shadowing cost and test imports, local declarations, aliases, and genuine unresolved globals. |
| R-6      | **wrong**             | A temporary checked-in 16-root data list is replaced in the next PR. S-4 can be honored by preserving/evolving the coverage predicate around a shared discovery function; it does not require two sources of truth or touching task ownership twice.                                                                       |
| R-7      | **sound with caveat** | Ratcheting at the measured count is valid, but #1378 separately requires a budget increase to carry an issue link in the same PR; overflow alone does not prove that condition.                                                                                                                                            |
| R-8      | **sound**             | Scanner-scope correction is distinct from fixing surfaced product findings, and #1403 explicitly requires triage rather than absorption.                                                                                                                                                                                   |
| R-9      | **wrong**             | Five accepted numbered RFCs already existed in `rfcs/` at `01aa12b67`; current repository practice is promotion into `rfcs/`, not harness-only canonical storage.                                                                                                                                                          |

## Acceptance-box routing table

The live denominator is **34**, not the brief's 33. "Unrouted" means the plan does not state a
specific deliverable and proof, even if the box could plausibly belong to the named PR.

| Issue / box | Live acceptance criterion (abridged)                              | Route                        | Stated proof                                                                                                 |
| ----------- | ----------------------------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------ |
| #1403-1     | plugin-streams-core covered by `arch:check` or reasoned exclusion | PR-B                         | Add root; `quality:gate` / `arch:check`                                                                      |
| #1403-2     | scan plugin-core surfaces or document policy                      | PR-B                         | Settle root policy; coverage assertion                                                                       |
| #1403-3     | repaired gate reports plugin-streams-core real state              | PR-B                         | Run repaired gate; triage output                                                                             |
| #1403-4     | future plugin-core omission fails                                 | PR-B                         | root-coverage negative test                                                                                  |
| #1403-5     | surfaced findings triaged, not fixed                              | PR-B                         | triage list and no source fixes                                                                              |
| #1380-1     | verdict lists all 36 live units only                              | PR-C                         | existence + coverage tests                                                                                   |
| #1380-2     | every removed row recorded renamed/deleted                        | **PR-C, contract-blocked**   | planned third state is accurate but cannot satisfy the live binary box until the issue wording is reconciled |
| #1380-3     | `06-archetypes.md` matches verdict                                | PR-C                         | doctrine-document sync/existence tests                                                                       |
| #1380-4     | repo check iterates live members                                  | PR-C                         | workspace/top-level discovery implementation and gate                                                        |
| #1380-5     | A14 ignores sanctioned BDD imports                                | PR-C                         | BDD fixture negative control                                                                                 |
| #1380-6     | repo check excludes `.llm/tmp`, docs, tools                       | PR-C                         | per-member iteration; `arch:check:repo` output                                                               |
| #1380-7     | accepted-red debt closed or dated                                 | PR-C                         | update `arch-debt.md`; repo gate/residue                                                                     |
| #1380-8     | doctrine states which 36 units are gated and exclusions           | **UNROUTED**                 | no named file/content assertion in PR-C contract                                                             |
| #1380-9     | dated engineering-reference plan                                  | **UNROUTED**                 | no named artifact or date-content test                                                                       |
| #1380-10    | RFC divergence resolved and five pending entries mapped           | **UNROUTED**                 | R-9 names an obsolete canonical location and no mapping proof                                                |
| #1380-11    | stale verdict row fails test                                      | PR-C                         | existence negative test                                                                                      |
| #1380-12    | missing live row fails test                                       | PR-C                         | coverage negative test                                                                                       |
| #1380-13    | `arch:check` green; repo green or residue enumerated              | PR-C                         | named gate pair                                                                                              |
| #1378-1     | exported `any` fails red-first                                    | PR-D                         | export/local fixture and scan                                                                                |
| #1378-2     | unlinked `as unknown as` fails                                    | PR-D                         | unlinked allowance/cast fixture                                                                              |
| #1378-3     | docs fenced `as any` fails                                        | PR-D                         | docs fence fixture                                                                                           |
| #1378-4     | six soundness files stay unchanged/green                          | PR-D                         | named six-file regression check                                                                              |
| #1378-5     | wire `--max-allow` at measured count                              | PR-D                         | task changes + budget overflow                                                                               |
| #1378-6     | budget increase requires same-PR issue link                       | **UNROUTED**                 | overflow test does not prove PR-diff/link coupling                                                           |
| #1378-7     | trigger reference doc and executable twin become typed            | **UNROUTED**                 | neither file is named in PR-D deliverables/proof                                                             |
| #1378-8     | full rule test matrix                                             | PR-D                         | exported/local, linked/unlinked, fence, soundness, overflow tests                                            |
| #1378-9     | repo scan and arch check green                                    | PR-D (depends PR-E/C)        | named gate pair                                                                                              |
| #1530-1     | repo scan green with fixture unchanged                            | PR-E                         | scan gate + no fixture-line edit                                                                             |
| #1530-2     | directory + suffix explicit exemption                             | PR-E                         | narrow rule test                                                                                             |
| #1530-3     | proven RED before exemption                                       | PR-E                         | pre-change fixture failure                                                                                   |
| #1530-4     | ordinary/outside-directory directives remain red                  | PR-E                         | leakage negative controls                                                                                    |
| #1530-5     | remove two allowances; 10 to 8                                    | PR-E                         | scan JSON allowance count                                                                                    |
| #1530-6     | repo scan and quality gate green                                  | PR-E                         | named gate pair                                                                                              |
| #1530-7     | post-merge `code-quality-repo` green on main                      | **UNROUTED / observational** | cannot be proven by the closing PR before merge; route to verification issue or keep #1530 open              |

## Negative-case review

| PR   | Review                                                                                                                                                                                                                                                                             |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PR-E | Fireable: the under-directory fixture is red before and exempt after, while ordinary/outside-directory controls remain red.                                                                                                                                                        |
| PR-B | Fireable if it mutates the actual discovered/curated root source consumed by the task. Do not write a test against a duplicate fixture list.                                                                                                                                       |
| PR-C | Verdict existence and coverage mutations are fireable. The A14 case in `plan.md:149` is only a desired non-firing positive case; the rail supplement at `plan-quality-rail.md:117` adds the required true bare-global red. Add the newly discovered local-binding non-firing case. |
| PR-D | Exported-any, unlinked cast, docs fence, and overflow are fireable. "Six soundness tests stay green" is regression evidence, not a negative case. The plan still needs a fireable same-PR budget-link control for #1378-6.                                                         |

## Plan-Gate checklist

| Gate                         | Result                                                                                                |
| ---------------------------- | ----------------------------------------------------------------------------------------------------- |
| Research present and current | **unchecked** — no `research.md`; two baselines and R-9 diverge                                       |
| Decisions locked             | checked, but R-6 and R-9 are wrong                                                                    |
| Open-decision sweep          | **unchecked** — #1374 collision is explicitly rework-forcing and unresolved                           |
| Commit slices                | **unchecked** — four PR summary rows are not ordered, file-scoped commit slices                       |
| Risk register                | checked                                                                                               |
| Gate set selected            | checked at PR level, with missing acceptance-specific proofs noted above                              |
| Deferred scope explicit      | checked                                                                                               |
| jsr-audit                    | N/A is justified because the rail changes repo tooling/governance, not package/plugin public surfaces |

## What I executed

Exit codes below are shell-command exit codes. A few exploratory commands intentionally failed and
were corrected; they are retained so the record distinguishes evidence from a hidden retry.

| #  | Command (abridged only where repeated arguments are listed in prose)                                                                                             |                                                     Exit |
| -- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------: |
| 1  | read five complete skill files with `sed`/`wc` (initial combined read was output-truncated; repeated per file)                                                   |                                                        0 |
| 2  | raw `git rev-parse HEAD`; `git status --short`; `git branch --show-current` via `Deno.Command`                                                                   |                                                        0 |
| 3  | `rtk git log/show/diff` for `9c3cdfead..83de0dc06`                                                                                                               |                                                        0 |
| 4  | read activation, run-loop, lane-policy, plan protocol, plan gate, verdict definitions, milestone gate-integrity section, archetype matrix/selector, docs overlay |                                                        0 |
| 5  | read plan, wave plan, supervisor, drift, cut trace, context pack, worklog and required source/docs files with numbered `sed`/`nl`                                |                                                        0 |
| 6  | `gh issue view` for #1403, #1380, #1378, #1530 (live bodies)                                                                                                     |                                                   0 each |
| 7  | live checkbox-count loop over the four issues                                                                                                                    |                                                        0 |
| 8  | `deno task quality:scan`                                                                                                                                         |                                                        0 |
| 9  | `deno task quality:scan:repo`                                                                                                                                    |                                1 (expected baseline red) |
| 10 | `deno task arch:check`                                                                                                                                           |                                                        0 |
| 11 | `deno task arch:check:repo` with compact roll-up                                                                                                                 |                     1 (expected baseline red; `FAIL=55`) |
| 12 | `ls -d packages/*/ plugins/*/`; file inventories for soundness/type fixtures                                                                                     |                                                        0 |
| 13 | first verdict-table reconciliation invocation, `deno eval --allow-read ...`                                                                                      | 1 (`deno eval` rejects that permission flag in Deno 2.9) |
| 14 | corrected verdict-table reconciliation with plain `deno eval`                                                                                                    |                                                        0 |
| 15 | six stale-path add-history probes + shared removal/path history                                                                                                  |                                                        0 |
| 16 | export-map print for sdk/plugin-streams-core/fresh; `deno doc --help`                                                                                            |                                                        0 |
| 17 | timed `deno doc --json` over 12 SDK export entrypoints                                                                                                           |                                               0 (0.17 s) |
| 18 | timed `deno doc --json` over 15 Fresh export entrypoints                                                                                                         |                          0 (0.74 s; resolution warnings) |
| 19 | 30-package export-map timing loop                                                                                                                                |                                0 (3.733 s; 567 warnings) |
| 20 | first `deno doc` JSON-shape probe assuming an array                                                                                                              |                   1 (exploratory shape assumption wrong) |
| 21 | corrected `deno doc` JSON-shape probe (`{version,nodes}`)                                                                                                        |                                                        0 |
| 22 | read-only #1374 `git status/log/diff`; first combined regex command                                                                                              |     2 (unmatched backtick in shell pattern; no mutation) |
| 23 | corrected literal-safe #1374 plan/research/worklog search and plan read                                                                                          |                                                        0 |
| 24 | live issue acceptance text extraction                                                                                                                            |                                                        0 |
| 25 | RFC file listing, acceptance-commit log, ancestor checks, `git ls-tree 01aa12b67:rfcs`, five RFC header reads                                                    |                                                        0 |
| 26 | raw `git diff/status` checks proving only run artifacts differ and tree is clean                                                                                 |                                                        0 |
| 27 | search for required `## Design`/research artifacts                                                                                                               |                  0 (no matches; directory list returned) |
| 28 | first A14 import-origin reconciliation with a non-portable grep regex                                                                                            |             0 (emitted regex warnings; result rechecked) |
| 29 | literal-safe A14 import-origin reconciliation                                                                                                                    |                          0 (`53` BDD imports, `1` other) |
| 30 | inspect `packages/mcp/tests/service-endpoint-sources_test.ts` local `describe` definition/calls                                                                  |                                                        0 |
| 31 | inspect root workspace patterns and standalone `packages/cli/e2e` doctrine behavior                                                                              |                                                        0 |
| 32 | final plan-eval path existence check and actual checkout comparison                                                                                              |                                                        0 |
| 33 | first artifact integrity bundle: structure/count probe; `deno fmt --check`; raw status                                                                           |                                  0; 1 (not formatted); 0 |
| 34 | `deno fmt plan-eval.md`                                                                                                                                          |                                                        0 |
| 35 | final `deno fmt plan-eval.md` after command-ledger update                                                                                                        |                                                        0 |
| 36 | final integrity bundle: structure/count probe; `deno fmt --check`; raw status/diff                                                                               |                                                        0 |
