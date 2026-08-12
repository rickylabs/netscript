# Quality Rail Plan — #1530 → #1403 → #1380 → #1378

**Revision 3 — consolidated.** Replaces revisions 1 and 2 in full. Cycle 2 failed partly *because*
revision 2 was appended rather than reconciled, leaving the authoritative sections contradicting the
revision below them (`plan-eval-cycle2.md` finding 6). Superseded text stays in git history
(`112c1676b` and parents) and in the two verdict files; it is preserved but no longer operative. There
is exactly one order, one selector, and one decision table here.

Sequencing locks S-1…S-6 live in `plan.md`; ordered file-scoped commit slices live in `worklog.md`
§ Design. Neither is restated.

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `release-0.0.6-internals--orchestration` |
| Phase | `plan` (rail) revision 3, awaiting PLAN-EVAL cycle 3 (owner-authorized past the two-cycle limit) |
| Target | `.llm/tools/quality/scan-code-quality.ts`, `.llm/tools/fitness/check-doctrine.ts`, `deno.json` tasks, `.github/workflows/code-quality.yml` (one added step), `docs/architecture/doctrine/`, `.llm/harness/debt/arch-debt.md`, `rfcs/README.md`, `.agents/skills/netscript-pr` |
| Archetype | N/A — repo tooling and governance documents; no `packages/**`/`plugins/**` source authored |
| Scope overlays | `SCOPE-docs.md` for PR-C's doctrine-document half |

## The one PR order

**PR-E (#1530) → PR-B (#1403) → PR-C (#1380) → PR-D (#1549).** Strictly sequential, one active
implementation thread. PR-D is additionally gated on PR **#1537** (docs lane) landing.

**Revision 4 — rescope, not another rewrite.** After a third `FAIL_PLAN` the owner authorized rescoping
the *issues* rather than the plan. **#1378 and #1545 moved to 0.0.7** because export-reachability severity
and allowance issue-state verification were measured unimplementable at this baseline; **#1549** carries
the provable half and stays in 0.0.6. Written reasons are on all three issues. `drift.md` D-16, D-17.

| PR | Closes | Lane | Why here |
| --- | --- | --- | --- |
| PR-E | #1530 | Sol · low | Clears a gate red on `main` for 7 pushes; nothing downstream can report an honest `quality:scan:repo` until it lands |
| PR-B | #1403 | Sol · low | p0, and owns the **single** transition to discovery-based doctrine roots |
| PR-C | #1380 | Sol · medium | Consumes PR-B's selector unchanged; adds origin-awareness and the doctrine documents |
| PR-D | **#1549** | Sol · **medium** (was high; export-reachability was the complex half and it moved) | Depends on PR-E (green repo scan), PR-B/C (settled roots), and #1537 (extractor) |

## Executed baseline

Measured at `01aa12b67`, re-confirmed at `84dd44ae7` (contains PR #1527).

| Measurement | Value |
| --- | --- |
| `quality:scan` | exit **0**, 0 findings, `allowCount: 7` |
| `quality:scan:repo` | exit **1**, **5** findings, `allowCount: 10` |
| `arch:check` | exit **0**, 16 hand-listed roots; `packages/plugin-streams-core` absent |
| `arch:check:repo` | exit **1**, **FAIL=55** = 54 A14 + 1 A1 |
| Live units | 30 `packages/*` + 6 `plugins/*` = **36** |
| Verdict table | 28 rows; **6** name non-live units; **14** live units have no row |
| `*-soundness_test.ts` / `*_type.ts` | **6** / **12** (all under `tests/type-fixtures/`, **3** with `@ts-expect-error`) |
| `deno doc --json` over all 30 export maps | **3.733 s**, exit 0, **567** `Failed resolving types` warnings |
| Repository history | root `317e4b509` (2026-07-06, "cut 0.0.1-beta.5"); **374** commits **measured at `84dd44ae7`** — the count moves with `main`, so it is only meaningful pinned to a sha (cycle 3 finding 7) |

### A14 has three identifier origins, not two

`check-doctrine.ts:403-413` matches a bare identifier anywhere in a `*_test.ts` file, so it cannot tell
where the binding came from.

| Origin | Count | Sanctioned | Evidence |
| --- | --- | --- | --- |
| imported from `@std/testing/bdd` | **53** | yes | `packages/database/tests/migrate-retry_test.ts:10` |
| locally bound | **1** | yes | `packages/mcp/tests/service-endpoint-sources_test.ts:248` — `const describe = (workDir: string) => …`; imports at `:1-6` are `@std/assert` + four local modules |
| genuinely unresolved global | **0** live | **no — the real signal** | needs a synthetic fixture that must stay red |

### The 6 stale verdict rows — both records are true

The reconciliation cycle 2 demanded (finding 7). `arch-debt.md:385`/`:561` record that
`packages/triggers` and `packages/workers` existed and were **superseded** by their `plugin-*-core`
successors (created 2026-04-29, resolved 2026-07-03/07-06). Yet
`git log --all --oneline -- 'packages/<p>/**'` returns **0 commits** for all four packages and for
`plugins/hello-world`.

Both hold because **this repository's history is truncated**: it begins at `317e4b509` (2026-07-06, a
beta.5 release cut) with 374 commits, and `git ls-tree 317e4b509:packages/` already contains the full
`plugin-*-core` tier. The supersession predates the earliest commit here. So the deliverable is a
**reconciliation of two sources**, not a git verdict:

| Row | Record PR-C must write |
| --- | --- |
| `@netscript/triggers` | not present anywhere in this repository's history (begins `317e4b509`); superseded by `packages/plugin-triggers-core` per `arch-debt.md:385`, predating this history |
| `@netscript/workers` | same, per `arch-debt.md:561` → `packages/plugin-workers-core` |
| `@netscript/sagas` | not present in this history; **a checked-in supersession record exists** — `arch-debt.md:583-584` reads "the top-level `packages/sagas` directory named in this heading no longer exists — the code and this resolved debt live entirely in `packages/plugin-sagas-core`". Cycle 3 finding 3: revision 3 asserted no record existed, which was **false**. Verified by the orchestrator. |
| `@netscript/streams` | not present in this history; successor `packages/plugin-streams-core` exists; no supersession record found — PR-C states that absence **after** running the same `arch-debt.md` probe that found the sagas one |
| `@netscript/shared` | not present in HEAD's history; **added at `0ef13de35`, deleted at `fd8259b76`** (`feat(contracts): consolidate shared foundation package`, 2026-06-05, which deletes `packages/shared/deno.json` and 25 further `packages/shared/**` paths) — both on **non-ancestor** history. Cycle 3 finding 3: revision 3 said only "no removal commit on `main`", true but omitting the load-bearing commit. PR-C cites the commit **and** the ancestry qualifier. |
| `plugins/hello-world` | not present in this history; no successor and no supersession record |

#1380 box 2 was **amended with owner authorization** to require per-row evidence and admit "never present
under that name" (issue comments `5264580324`, corrected by `5264832009`). The amendment is **stricter on
evidence and broader on admissible states** — not "strictly harder", which was an overstatement now
corrected on the issue.

### The RFC divergence has already closed

`rfcs/` contains `0001-*.md`–`0005-*.md`, all `status: Accepted`, at `01aa12b67`;
`rfcs/0005-devtools-contribution.md:10-18` names `rfcs/README.md` canonical. #1380 D9/D10 is stale.
Revision 1 inherited that claim without re-measuring and was failed on it (`drift.md` D-11).

## Locked decisions

| ID | Decision |
| --- | --- |
| `R-1` | **PR-E lands first.** #1378's `gate:` box needs `quality:scan:repo` green; it is red for a reason that is not a defect. PR-E fixes scanner **scope**, not the findings. |
| `R-2` | Type-fixture exemption keyed on **directory AND suffix** (`tests/type-fixtures/` + `_type.ts`), asserted by test, with leakage controls **both** ways — dir-only and suffix-only must still be reported. |
| ~~`R-3`~~ | **WITHDRAWN by rescope (revision 4).** Export-awareness moved to 0.0.7 with #1378. Cycle 3 measured the premise: 567 warnings on an exit-0 run and **1,714 published symbol records with unresolved type references** (3,945 occurrences), with warning text naming the dependency module rather than the dependent declaration — so there is no deterministic attribution to build the rule on. PR-D does **not** attempt it. Superseded rationale: Export-awareness uses `deno doc --json` over each package's `exports` map. **Fail-closed is scoped to the intersecting set:** PR-D first measures how many of the 567 warnings touch a declaration the any-rule actually inspects, fails closed on **that** set, and enumerates the non-intersecting residue in `arch-debt.md` with a date. Blanket fail-closed on all 567 makes #1378's own green gate unreachable — cycle 2 finding 1, and why revision 2's R-3 was wrong. A re-exported `any` must be attributed to the published entrypoint (fixture required). |
| `R-4` | Doctrine root selector is **expanded top-level `packages/*` + `plugins/*`** — the 36 units — **not** every workspace member (root `deno.json:3-9` also lists `packages/cli/e2e`, `examples/*`, `apps/*`). `packages/cli/e2e` is excluded and the exclusion is stated in the doctrine. |
| `R-5` | A14 resolves `imported` \| `locally-bound` \| `unresolved` by lexical import **and** binding collection (no type checker), firing **only** on `unresolved`. All three origins tested; origin 3 needs a synthetic fixture. |
| `R-6` | **PR-B owns the single transition.** PR-B introduces `discoverDoctrineRoots()` returning the final 36-unit selector and repoints `arch:check` at it in one step — **no** interim 17-root list, **no** checked-in root data file. PR-C consumes the same function unchanged for `arch:check:repo`. This retires the two-step that cycle 1 finding 9 and cycle 2 finding 4 both rejected; S-4 holds because the coverage predicate is preserved around one function. |
| `R-7` | **[rescoped, revision 4]** `--max-allow` is wired at the count measured in the implementing PR (**8** after PR-E), and in 0.0.6 it carries **no issue-id requirement** — the scanner has `--allow-read` only and cannot verify an issue is open and milestoned (cycle 3 finding 2). The registration rule and #1545 moved to 0.0.7. The budget still only falls. Superseded text: wired at **8** (after PR-E removes two redundant allowances) and all 8 survivors reference **#1545**, the umbrella registration issue filed for this (owner decision). Without it, #1378's linked-issue rule reds the gate on day one — cycle 2 finding 2. |
| `R-8` | Findings surfaced by newly-covered scans are **triaged into issues, never fixed in the surfacing PR**. |
| `R-9` | Accepted RFCs are promoted to numbered `rfcs/NNNN-*.md`; `.llm/runs/*/design/canonical/` bundles are provenance/draft. PR-C records this in `rfcs/README.md` and maps the five `DECISION_PENDING` entries onto it **without filing them**. |
| `R-10` | **#1374 owns the `docs/site/**` fenced-TS extractor; PR-D consumes it** and sequences after PR #1537 (owner decision; PR #1537 comment `5264583905`). **If that surface stays private:** slice D5 and #1378 box 3 move with the issue, **and PR-D references `#1378` without a closing keyword**, stating the remaining scope. It closes #1545 either way. Cycle 2 finding 9 — a fallback that moves a box while keeping `Closes` would auto-close an issue with undelivered acceptance. |
| `R-11` | **[refined after #1524 landed]** The `labeled`-trigger defect (`drift.md` D-10, D-15) is corrected **in the documents**, and the correction is now a *distinction* rather than a flat negation. `netscript-pr` (`SKILL.md:169-170`) says "applying `status:ready-merge` itself triggers a fresh run (the workflow listens to `labeled`)". Post-#1524 that is half true and therefore worse than before: **`openhands-phase-eval.yml` does listen to `labeled`**, but **`ci.yml:41` still does not** — and `ci.yml` is the workflow that runs `close-gate` and the acceptance mirror. So the label fires phase evaluation and does **not** re-run the close-gate. PR-C slice C7 states exactly that, plus "for `status:ready-merge`, label then **push**", and applies the same fix to `check-close-gate.ts`'s repair hint. `.claude/skills/` mirror regenerated. **No workflow trigger is changed.** |
| `R-12` | #1378 box 6 is a property of a **diff**, which a file scanner cannot observe. It is proved by **one added step in the existing `code-quality` PR job** (owner decision): compare the `--max-allow` delta against issue links in the same diff and fail when the budget rose without one. A step in a job that already runs on PRs; no trigger and no skip-semantics change. Cycle 2 finding 3. |

## Open decisions — none force rework

| Decision | Status |
| --- | --- |
| `docs/site/**` extractor ownership | **RESOLVED** — `R-10`, with the closing-keyword consequence stated |
| The 567 `deno doc` warnings | **WITHDRAWN BY RESCOPE — not resolved.** Export-reachability moved to 0.0.7 with #1378 (`drift.md` D-17). Nothing in 0.0.6 depends on an answer. Cycle 4 finding 4 flagged this row as still claiming a 0.0.6 resolution. |
| The 8 pre-existing allowances | **WITHDRAWN BY RESCOPE — not resolved.** The registration rule and #1545 moved to 0.0.7. In 0.0.6, `--max-allow` is wired at the measured count with **no** issue-id requirement, so the population needs no register yet. |
| Budget-link predicate mechanism | **RESOLVED** — `R-12`, one added step in the existing `code-quality` PR job. Stays in 0.0.6 as #1549 box 5. |
| `arch:check:repo` residue after R-4/R-5 | defer to PR-C — #1380 box 13 accepts "exit 0 **or** residue enumerated" |
| Successor records for `sagas`/`streams`/`hello-world` | defer to PR-C — the deliverable is to **state the absence**, not to find one |

## Risk register

| Risk | Mitigation |
| --- | --- |
| PR-D's budget wiring reds an in-flight PR from a sibling 0.0.6 lane | wired at the measured 8 with all survivors registered to #1545; PR body states the new behaviour; merge reported immediately |
| The A14 fix silences the true positive with the two sanctioned origins | origin 3 is a mandatory synthetic fixture that must stay **red**; all three origins in one test |
| PR-C invents rename provenance | the six-row reconciliation table above, both sources cited, absences stated |
| The `deno doc` intersecting set turns out large | PR-D measures **before** wiring and reports the number; if green is unreachable that is a rescope trigger in `drift.md`, not a silently weakened gate |
| #1537 does not land in time | `R-10`'s fallback: box 3 moves and PR-D drops the closing keyword — stated now, not discovered at merge |

## Validation plan

| Order | Gate | Command | Expected |
| --- | --- | --- | --- |
| 1 | tool tests | `deno test --allow-read --allow-env --allow-write --allow-run .llm/tools/quality/ .llm/tools/fitness/` | pass |
| 2 | repo quality scan | `deno task quality:scan:repo` | exit 0 **after PR-E**; `allowCount` 10 → 8 |
| 3 | default quality scan | `deno task quality:scan` | exit 0 |
| 4 | quality gate | `deno task quality:gate` | exit 0 |
| 5 | doctrine (curated) | `deno task arch:check` | exit 0 throughout |
| 6 | doctrine (repo) | `deno task arch:check:repo` | exit 1 / FAIL=55 before PR-C; after PR-C exit 0 or enumerated residue |
| 7 | scoped wrappers | `run-deno-{check,lint,fmt}.ts --root .llm/tools --ext ts` | pass |
| 7b | **generated asset freshness** | `deno task gen:assets-barrel`, then `git status --porcelain` must be **empty** | **Mandatory for every rail PR.** The source of `.llm/tools/quality/**` and `.llm/tools/fitness/**` files is embedded as strings in `packages/cli/src/kernel/assets/{skills,agent-tools}.generated.ts`, so editing a bundled tool makes them stale and reds `ci.yml`'s `quality` job. Found the hard way on PR-E (`drift.md` D-22). The empty-status re-run also proves the generator is idempotent. |
| 8 | doctrine-document tests | PR-C's existence + coverage tests | fail on a fabricated row and on an ungated live unit |
| 9 | budget-link step | the added `code-quality` step, exercised on PR-D itself | red when the budget rises without a same-diff issue link |

`--allow-write --allow-run` is mandatory: nine tests under `.llm/tools` call `Deno.makeTempDir()` and one
spawns a subprocess (`drift.md` D-8). `deno task e2e:cli` is out of scope for the whole rail.

## Acceptance-box routing — every in-milestone box has a slice, files, and a proof

**Denominator after the rescope: 28 in-0.0.6 boxes** — #1530 (7, one `[post-merge]`), #1403 (5),
#1380 (13), #1549 (7) minus the 4 `gate:`/duplicate overlaps counted once. The 14 boxes of #1378 and
#1545 are **out of milestone**, not unrouted (cycle 4 finding 4).

Slice ids refer to `worklog.md` § Design.

| Boxes | Route | Slices | Proof |
| --- | --- | --- | --- |
| #1530 · 1–6 | PR-E | E1–E4 | RED-first fixture committed red; dir+suffix rule; leakage controls both ways; `allowCount` 10 → 8; named gate pair |
| #1530 · 7 | PR-E, **`[post-merge]`** | — | live box carries the `[post-merge]` marker (issue line 92), which `netscript-pr` defines as exclusion-with-notice, verified by comment after merge; cycle 2 accepted this rebuttal |
| #1403 · 1–5 | PR-B | B1–B3 | `discoverDoctrineRoots()` + coverage test that fails when a publishable `plugin-*-core` leaves the selector; repaired gate run on `plugin-streams-core`; triage list with **no** `packages/**` source edit |
| #1380 · 1, 3, 11, 12 | PR-C | C3, C4 | existence test fails on a fabricated row; coverage test fails on an ungated live unit; `06-archetypes.md` sync test |
| #1380 · 2 | PR-C | C3 | the six-row reconciliation table, each row citing the git probe **and** the `arch-debt.md` record or its stated absence |
| #1380 · 4, 6 | PR-C | C2 | `arch:check:repo` consumes `discoverDoctrineRoots()`; output contains no `.llm/tmp/`, `docs/`, `.llm/tools/` path |
| #1380 · 5 | PR-C | C1 | three-origin fixture: import quiet, local binding quiet, bare global **red** |
| #1380 · 7 | PR-C | C5 | `arch-debt.md` entry closed or dated, naming both mechanical causes |
| #1380 · 8 | PR-C | C4 | `10-…md` names which of the 36 units `arch:check` gates and why `packages/cli/e2e` is excluded; test fails if that set and `discoverDoctrineRoots()` disagree |
| #1380 · 9 | PR-C | C5 | `10-…md` carries a **dated** plan for engineering-reference §1–§5/§8–§10; test asserts the section exists and is dated |
| #1380 · 10 | PR-C | C6 | `rfcs/README.md` records `rfcs/NNNN-*.md` canonical per `R-9`; all five `DECISION_PENDING` ids mapped; test asserts all five present |
| #1380 · 13 | PR-C | C2 | named gate pair |
| **#1549 · 1–2** | PR-D | D5 | `as any` in a `docs/site/**` fence red, proven red-first, **consuming** #1374's extractor — a test asserts no second fence parser exists in the tree |
| **#1549 · 3** | PR-D | D5 | the 6 `*-soundness_test.ts` files green with `@ts-expect-error` unchanged, and a test asserts the exemption rather than relying on filename luck |
| **#1549 · 4** | PR-D | D3 | `--max-allow` wired into both tasks at the count measured in that PR; overflow fixture red. **No issue-id requirement in 0.0.6.** |
| **#1549 · 5** | PR-D | D4 | the added `code-quality` step (`R-12`) is red when the budget rises without a same-diff issue link, with a linked-GREEN control; exercised on PR-D itself |
| **#1549 · 6** | PR-D | D6 | `docs/site/reference/triggers/index.md:310` and `examples_test.ts:65` typed; both compile with no `any` |
| **#1549 · 7** | PR-D | D3–D6 | `gate:` `quality:scan:repo` + `arch:check` green (depends on PR-E, PR-B, PR-C) |
| ~~#1378 · 1–9~~ · ~~#1545 · 1–5~~ | **moved to 0.0.7** | ~~D1, D2~~ | Slices **D1** (export-awareness) and **D2** (allowance registration) move with their issues. Written reasons on #1378 and #1545; measurement in `drift.md` D-17. Not routed here and not ticked here. |
