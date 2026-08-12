# Quality Rail Plan — #1403 → #1380 → #1378

The single plan for wave 2. One PLAN-EVAL covers all three PRs because the issues overlap on root
lists, scan semantics, doctrine and architecture debt; evaluating their sequencing separately would
evaluate the wrong thing. Sequencing locks S-2…S-5 live in `plan.md` and are not restated.

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `release-0.0.6-internals--orchestration` |
| Phase | `plan` (rail) |
| Target | `.llm/tools/quality/scan-code-quality.ts`, `.llm/tools/fitness/check-doctrine.ts`, `deno.json` tasks, `docs/architecture/doctrine/`, `.llm/harness/debt/arch-debt.md`, `rfcs/README.md` |
| Archetype | N/A — repo tooling and governance documents; no `packages/**`/`plugins/**` source authored |
| Scope overlays | `SCOPE-docs.md` for PR-C's doctrine-document half |

## Executed baseline — every number below is a command result at `01aa12b67`, 2026-08-12

| Measurement | Value | Command |
| --- | --- | --- |
| `deno task quality:scan` | exit **0**, `findings: []`, `allowCount: 7` | executed |
| `deno task quality:scan:repo` | exit **1**, **5** findings, `allowCount: 10` | executed |
| `deno task arch:check` | exit **0**, 16 hand-listed roots | executed |
| `deno task arch:check:repo` | exit **1**, **FAIL=55** (54 × A14 + 1 × A1) | executed |
| Live units | 30 `packages/*` + 6 `plugins/*` = **36** | executed |
| Verdict-table rows naming non-live units | **6** | executed |
| Live units with no verdict row | **14** | executed |
| `*-soundness_test.ts` files | **6** | executed |
| `*_type.ts` files | **12**, all under `tests/type-fixtures/`, **3** contain `@ts-expect-error` | executed |

### Drift against the issue bodies (measured 2026-08-08, now stale)

| Issue claim | Then | Now | Consequence |
| --- | --- | --- | --- |
| `arch:check:repo` FAIL count (#1380 D8) | 53 | **55** | The A14 false-positive population grew by 2 in four days. It grows with every new `@std/testing/bdd` test, which is the argument for fixing the predicate rather than enumerating residue. |
| `quality:scan:repo` is green (#1378 § Current surface) | green, 0 findings | **RED, exit 1, 5 findings** | #1378's `gate:` acceptance box ("`quality:scan:repo` … green after the change") **cannot be satisfied** without first clearing this. Filed as **#1530**; it is PR-E, and PR-D depends on it. |
| Repo-wide `allowCount` (#1378) | 10 | 10 (unchanged) | `--max-allow` must be wired at the value measured **at the time of wiring**, not at 10 on faith. #1530 lowers it to 8. |

### The 6 stale verdict rows are not what #1380 assumes

#1380 hypothesises that "four of the five packages were plausibly renamed into the `plugin-*-core`
tier", while correctly warning that "the re-walk must record rename-vs-deletion per row, not assume".
Executed against the full history (`git log --all --diff-filter=A -- packages/<p>/deno.json`):

| Stale row | Ever existed in this repo? | Correct record |
| --- | --- | --- |
| `@netscript/streams` | **no** — no `deno.json` ever added at `packages/streams` | never existed under this name |
| `@netscript/triggers` | **no** | never existed under this name |
| `@netscript/workers` | **no** | never existed under this name |
| `@netscript/sagas` | **no** | never existed under this name |
| `@netscript/shared` | **yes** — added at `0ef13de35 chore: genesis eject`, 10 commits of history | genuinely removed; PR-C must find and cite the removal |
| `plugins/hello-world` | **no** | never existed under this name |

So "renamed vs deleted" is a **false dichotomy for five of the six rows**: the third state is *the
table was authored against a layout that never landed in this repository*. That materially changes the
deliverable — a rename note pointing `@netscript/workers` → `packages/plugin-workers-core` would be a
fabricated provenance claim. PR-C records the executed per-row verdict, with the third state allowed.

This also reframes the whole issue: the verdict table is not merely *stale*, it was never a
measurement of this tree. `docs/architecture/doctrine/10-…md:197-208` defines doctrine completion
against that walk, and `.agents/skills/netscript-doctrine` routes every agent through it.

## Locked rail decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| `R-1` | **PR-E (#1530) lands before PR-D (#1378).** | #1378's `gate:` box requires `quality:scan:repo` green. It is red on `main` today for a reason that is not a defect (negative type fixtures scanned as production source). PR-D cannot truthfully tick that box until PR-E clears it. |
| `R-2` | The `*_type.ts` exemption is keyed on **directory + suffix** (`tests/type-fixtures/**/*_type.ts`), never a filename allowlist and never a widened test regex. | A widened `_test`-style regex would exempt production code; an allowlist rots on the next fixture. The exemption must be an explicit rule asserted by test, which is the shape #1378 § Target contract already mandates for the 6 soundness tests. |
| `R-3` | Export-awareness is driven by **`deno doc --json` over each package's `exports` map**, not a fourth line-regex. | #1378 offers both. `deno doc --json` already answers "is this symbol published"; `check-doctrine.ts:467-484`'s line-start matching provably misses `export const`, class members, generic defaults and re-exports. Adding a regex that misses the same things would ship a rule that looks export-aware and is not. |
| `R-4` | **[revised, cycle 2]** `arch:check:repo` iterates **expanded top-level `packages/*` + `plugins/*` workspace members**, not a hand-listed set, not the repository root, and **not every workspace member**. `packages/cli/e2e` is explicitly excluded and the exclusion is stated in the doctrine. | #1380 acceptance requires it. Reading the workspace list means a new package is gated the moment it joins the workspace — the property #1403's coverage test is reaching for, generalised. |
| `R-5` | **[revised, cycle 2]** The A14 predicate must resolve `imported` \| `locally-bound` \| `unresolved` and fire **only** on `unresolved`, collecting both import specifiers and top-level/local bindings lexically (no type checker). | The population is **53** sanctioned `@std/testing/bdd` imports **plus one locally bound helper** — `packages/mcp/tests/service-endpoint-sources_test.ts:248` declares `const describe = (workDir: string) => …` and imports nothing named `describe` (verified). A predicate that collects only imports would still flag it. Origin 3 (a genuine bare global) has **zero** live instances, so it needs a synthetic fixture and must stay red. |
| ~~`R-6`~~ | **WITHDRAWN, cycle 2 — the evaluator was right.** A checked-in 16-root data list would be replaced by R-4's discovery in the very next PR, creating two sources of truth and touching task ownership twice. **Replacement:** PR-B introduces `discoverDoctrineRoots()` and asserts coverage against **that function**; PR-C expands the same function to the final policy. S-4 is honoured by preserving and evolving the coverage predicate, which never required a list file. |
| `R-7` | `--max-allow` is wired at the count **measured in the wiring PR**, and the PR body states that adding an allowance will now fail CI. | Wiring a budget is a behavioural change to every future PR, not a flag addition. Unstated, it reads as a break. |
| `R-8` | Findings surfaced by newly-covered scans are **triaged into issues, never fixed in the surfacing PR** (`plan.md` S-5). PR-E is not an exception: it fixes the **scanner's scope**, not the findings. | #1403 box 5 and #1378 § Boundaries both require it. The distinction matters for honest box-ticking, so PR-E's body states it explicitly. |
| ~~`R-9`~~ | **WITHDRAWN, cycle 2 — premise was false at this plan's own baseline.** The claim that `rfcs/` holds only a template and a README was inherited from #1380's 2026-08-08 measurement and never re-measured. At `01aa12b67`, `rfcs/0001-*.md` through `0005-*.md` are present, all `status: Accepted`, and `rfcs/0005-devtools-contribution.md:10-18` names `rfcs/README.md` as canonical. **Replacement (`R-9b`):** accepted RFCs are promoted to numbered `rfcs/NNNN-*.md`; `.llm/runs/*/design/canonical/` bundles are provenance/draft artifacts. PR-C records that in `rfcs/README.md` and maps the five `DECISION_PENDING` entries onto it **without filing them**. See `drift.md` D-11. |

## Open decisions

| Decision | Status | Notes |
| --- | --- | --- |
| Whether `quality:scan` should scan `docs/site/**` fences itself, or consume a shared extractor with #1374 | **must resolve before PR-D** | #1374 (`test(docs): docs:accuracy is a fixed-string needle checker`) is live in the **docs lane** at `/home/codex/repos/ns006-1374-compilegate` and needs the same fenced-TS extraction from `docs/site/**`. Two independent extractors with different fence-parsing rules would disagree about what a snippet is, and the disagreement would be invisible. Coordinate before PR-D writes one. |
| Whether the residue of `arch:check:repo` after R-4/R-5 is green or enumerated debt | safe to defer to PR-C | #1380 accepts either ("exits 0 or its residue is enumerated in `arch-debt.md`"). PR-C measures after the two mechanical fixes and reports the real number. |
| Whether `@netscript/shared`'s removal commit can be cited precisely | safe to defer to PR-C | It existed and has 10 commits of history; the removal is findable. If it cannot be found, the row records "removed, commit not identified" rather than a guess. |

## Risk register (rail-specific; `plan.md` holds the lane-wide register)

| Risk | Mitigation |
| --- | --- |
| PR-C invents rename provenance for the four never-existed rows. | The executed evidence and the third state are in the brief, with the exact command that produced them. |
| `deno doc --json` is too slow to run per package in CI. | Measure before committing to it in PR-D; the fallback is scanning only each package's `exports` entrypoints and their re-export graph, recorded as a decision, not discovered as a timeout. |
| R-6's root-list move collides with PR-C's live-member switch. | R-6 lands the *shape* (data, not shell) and PR-C changes the *source* (workspace list). Sequential, with S-4 forbidding deletion of PR-B's assertion. |
| Wiring `--max-allow` reds an unrelated in-flight PR from another 0.0.6 lane. | Three sibling lanes are active. PR-D announces the budget in its body and the orchestrator reports the merge immediately so the other lanes learn the count. |
| A14 fix silently exempts genuine Jest/Vitest usage. | The negative case is mandatory: a fixture with a real bare `describe(` global must still FAIL after the fix. |

## Validation plan

| Order | Gate | Command | Expected |
| --- | --- | --- | --- |
| 1 | quality scan (default) | `deno task quality:scan` | exit 0 |
| 2 | quality scan (repo) | `deno task quality:scan:repo` | exit 0 **after PR-E**; exit 1 with 5 known findings before it |
| 3 | doctrine (curated) | `deno task arch:check` | exit 0 throughout |
| 4 | doctrine (repo) | `deno task arch:check:repo` | exit 1 / FAIL=55 before PR-C; after PR-C exit 0 or enumerated residue |
| 5 | rail tests | `deno test --allow-read --allow-write --allow-env .llm/tools/quality/ .llm/tools/fitness/` | pass |
| 6 | scoped wrappers | `run-deno-{check,lint,fmt}.ts --root .llm/tools --ext ts` | pass |
| 7 | doctrine-document tests | the new existence + coverage tests from PR-C | fail on a fabricated row and on an ungated live unit |

`deno task e2e:cli` is out of scope for the whole rail — no PR touches scaffold, DB, Aspire, or plugin
copy mode. `--allow-write` is required for the tool test suites (established by PR-A's escalation: 9
pre-existing tests call `Deno.makeTempDir()`).

## Per-PR contract summary

| PR | Closes | Lane | Must prove (negative case) |
| --- | --- | --- | --- |
| PR-E | #1530 | Sol · low | A `@ts-expect-error` in a `*_type.ts` under `tests/type-fixtures/` is reported **before** and not after; the same directive in ordinary source and in a `*_type.ts` **outside** `tests/type-fixtures/` is still reported; repo-wide `allowCount` falls 10 → 8 |
| PR-B | #1403 | Sol · low | The coverage test **fails** when a publishable `plugin-*-core` package is removed from the root list; the repaired gate reports `packages/plugin-streams-core`'s real state and its findings are triaged, not fixed |
| PR-C | #1380 | Sol · medium | Existence test fails on a verdict row naming a non-existent directory; coverage test fails on a live unit with no row; A14 does **not** fire on `@std/testing/bdd` **and still fires** on a real bare global |
| PR-D | #1378 | Sol · high | Exported `any` fails while a local `any` keeps its current severity; an unlinked `as unknown as` fails; `as any` in a `docs/site/**` fence fails; the 6 soundness tests stay green unchanged; budget overflow fails |

---

# Revision 2 — response to `plan-eval.md` (`FAIL_PLAN`, 6 blocking / 3 should-fix / 1 advisory)

Cycle 1 verdict: `FAIL_PLAN` from a fresh Codex · Sol · high session (thread `019ff508-…`), opposite
family to this Claude-authored plan. Every finding is accepted except one, which is rebutted with
evidence below. The withdrawn decisions are struck above rather than edited away, so the record shows
what was wrong and why.

## Baseline correction — the A14 decomposition (finding 1, blocking)

The table above says `FAIL=55` = 54 × A14 + 1 × A1. The **count** is confirmed; the **cause** was wrong.
Corrected, and verified independently by this session:

| Identifier origin | Count | Sanctioned? | Evidence |
| --- | --- | --- | --- |
| imported from `@std/testing/bdd` | **53** | yes | e.g. `packages/database/tests/migrate-retry_test.ts:10` |
| **locally bound** in the test file | **1** | yes | `packages/mcp/tests/service-endpoint-sources_test.ts:248` — `const describe = (workDir: string) => …`; the file's imports (`:1-6`) are `@std/assert` plus four local modules, nothing named `describe` |
| genuinely unresolved global | **0** | **no — the real signal** | none live; needs a synthetic fixture that must stay red |

`check-doctrine.ts:403-413` matches a bare identifier anywhere in a `*_test.ts` file and so cannot
distinguish any of the three. Treating all 54 as import false-positives would have produced a fix that
went quiet on the true positive too — the same defect, re-shipped inside its own repair.

## Decisions revised, withdrawn, and added

| ID | Change |
| --- | --- |
| `R-3` | **Caveat adopted (finding 7).** `deno doc --json` is fast enough — 3.733 s across all 30 package export maps, exit 0 — but that run emitted **567** `Warning Failed resolving types`. Exit 0 is therefore **not** a completeness proof. The export audit is **fail-closed**: an unresolved published declaration is a finding, unless it falls in a named, tested allowlist class. PR-D additionally carries a fixture proving a **re-exported** `any` is attributed to the published entrypoint. |
| `R-4` | Revised in place above — selector narrowed from "workspace members" to expanded top-level `packages/*` + `plugins/*`, with `packages/cli/e2e` explicitly excluded and the exclusion stated in the doctrine (finding 8). |
| `R-5` | Revised in place above — three origins, lexical import **and** binding collection, all three tested (finding 1). |
| ~~`R-6`~~ | **Withdrawn** (finding 9). Replaced by a single `discoverDoctrineRoots()` introduced in PR-B and expanded in PR-C. No transient list, one source of truth, S-4 honoured through the coverage predicate. |
| `R-7` | **Caveat adopted.** Ratcheting at the measured count does not prove #1378 box 6. A separate **fireable** control is added (slice D4): raising `--max-allow` **without** a same-PR issue link is red. |
| ~~`R-9`~~ | **Withdrawn** (finding 2). Replaced by `R-9b`. |
| `R-9b` | Accepted RFCs are promoted to numbered `rfcs/NNNN-*.md`; `.llm/runs/*/design/canonical/` bundles are provenance/draft artifacts. `rfcs/0001-*.md`–`0005-*.md` exist at `01aa12b67`, all `status: Accepted`, and `rfcs/0005-devtools-contribution.md:10-18` names `rfcs/README.md` canonical. PR-C records this and maps the five `DECISION_PENDING` entries onto it **without filing them**. |
| `R-10` **(new)** | **The `docs/site/**` fenced-TS extractor is owned by #1374 and consumed by PR-D** (finding 6, resolved with owner authority). PR-D imports the extractor from draft PR **#1537** and sequences after it lands; it does **not** write a second parser. Coordination and the API request (stable per-snippet provenance) are posted at PR #1537 comment `5264583905`. **Fallback, stated now rather than discovered later:** if #1537's surface stays private to `docs:accuracy`, slice D5 and #1378 box 3 **move with the issue** — they are not forked and not ticked. |
| `R-11` **(new)** | The `labeled`-trigger defect (`drift.md` D-10) is fixed **in the documents, not the workflow** (owner decision). PR-C slice C7 corrects `.agents/skills/netscript-pr` and `check-close-gate.ts`'s repair hint to say "label, then push", regenerates the `.claude/skills/` mirror, and touches **no** workflow file. |

## Open decisions — now none that force rework

| Decision | Status | Resolution |
| --- | --- | --- |
| `docs/site/**` extractor ownership | **RESOLVED** | `R-10`. This was the finding-6 blocker; `plan-gate.md:20-22` is satisfied. |
| `arch:check:repo` residue after R-4/R-5 | safe to defer to PR-C | #1380 box 13 accepts "exit 0 **or** residue enumerated in `arch-debt.md`". PR-C measures and reports the real number. |
| `@netscript/shared`'s removing commit | safe to defer to PR-C | It existed (`0ef13de35`) so a removal is findable. If it cannot be found, the row records "removed, commit not identified" rather than a guess — the amended box 2 requires evidence, not a label. |

## Acceptance-box routing — all 34 live boxes, none unrouted

Denominator corrected to **34** (the brief said 33; #1380 carries a thirteenth `gate:` box). The six the
evaluator found unrouted are routed here to a named slice, file, and proof. Slice ids refer to the
`## Design` § Commit Slices table in `worklog.md`.

| Issue / box | Route | Slice | Proof |
| --- | --- | --- | --- |
| #1403 · 1–5 | PR-B | B1–B3 | root added + `discoverDoctrineRoots()` coverage test; repaired gate run on `plugin-streams-core`; triage list with **no** `packages/**` source edit in the diff |
| #1380 · 1, 3, 11, 12 | PR-C | C3, C4 | existence test fails on a fabricated row; coverage test fails on an ungated live unit; `06-archetypes.md` sync test |
| #1380 · 2 | PR-C | C3 | **amended box** (owner-authorized, issue comment `5264580324`): per-row git evidence, with `never present under that name` admitted. Five rows carry the never-present verdict; `@netscript/shared` carries its removing commit. |
| #1380 · 4, 6 | PR-C | C2 | `arch:check:repo` iterates `discoverDoctrineRoots()`; output no longer contains `.llm/tmp/`, `docs/`, `.llm/tools/` paths |
| #1380 · 5 | PR-C | C1 | three-origin fixture: import quiet, local binding quiet, bare global **red** |
| #1380 · 7 | PR-C | C5 | `arch-debt.md` entry closed, or carries a dated closure plan naming both mechanical causes |
| **#1380 · 8** *(was unrouted)* | PR-C | C4 | `10-…md` gains a section naming which of the 36 units `arch:check` gates and why `packages/cli/e2e` is excluded; asserted by a test that fails if the gated set and `discoverDoctrineRoots()` disagree |
| **#1380 · 9** *(was unrouted)* | PR-C | C5 | `10-…md` gains a **dated** plan for engineering-reference §1–§5/§8–§10, authored as a byproduct of the refactors; test asserts the section exists and carries a date |
| **#1380 · 10** *(was unrouted)* | PR-C | C6 | `rfcs/README.md` records `rfcs/NNNN-*.md` as canonical per `R-9b`; all five `DECISION_PENDING` ids (`CRON-SUBSYSTEM-DUP`, `RUN-ARTIFACT-ARCHIVAL-POLICY`, `PAGEBUILDER-LEGACY-COMPAT-TREE`, `FORMPAGEPROPS-PLAYGROUND-MIGRATION`, `REDIS-LEGACY-VALUE-FALLBACK`) mapped onto it; test asserts all five are present |
| #1380 · 13 | PR-C | C2 | named gate pair: `arch:check` exit 0, `arch:check:repo` exit 0 or enumerated residue |
| #1378 · 1 | PR-D | D1 | exported `any` red, local `any` unchanged, plus re-export attribution fixture |
| #1378 · 2 | PR-D | D2 | unlinked `as unknown as` red; linked allowance green |
| #1378 · 3 | PR-D | D5 | `as any` in a `docs/site/**` fence red, via #1374's extractor. **Moves with the issue** if #1537's surface stays private (`R-10`). |
| #1378 · 4 | PR-D | D5 | the 6 `*-soundness_test.ts` files green with `@ts-expect-error` lines **unchanged** — regression evidence, explicitly not a negative case |
| #1378 · 5 | PR-D | D3 | `--max-allow` wired at the count measured in that PR; overflow red |
| **#1378 · 6** *(was unrouted)* | PR-D | D4 | a **fireable** same-PR control: raising the budget without an accompanying issue link in the same PR is red. Overflow alone does not prove this, which is why it is its own slice. |
| **#1378 · 7** *(was unrouted)* | PR-D | D6 | `docs/site/reference/triggers/index.md:310` and `docs/site/reference/triggers/examples_test.ts:65` both typed; both compile with no `any` |
| #1378 · 8 | PR-D | D1–D5 | full matrix: exported/local, linked/unlinked, fence, soundness, overflow |
| #1378 · 9 | PR-D | D1–D6 | `quality:scan:repo` + `arch:check` green (depends on PR-E and PR-C) |
| #1530 · 1–6 | PR-E | E1–E4 | RED-first fixture; dir+suffix rule; leakage controls both directions; `allowCount` 10 → 8; named gate pair |
| **#1530 · 7** | PR-E, **`[post-merge]`** | — | **Rebuttal to finding 4.** The live box already reads `` `gate:` the `code-quality-repo` job is green on `main` after merge. `[post-merge]` `` (issue #1530 line 92). `netscript-pr` makes `[post-merge]` the sanctioned mechanism: such a box is *visibly excluded from the merge gate with a notice* and verified by comment afterwards. It therefore needs no verification issue and does not keep #1530 open — the honesty rule is satisfied by the marker, which is what the marker is for. |

## Protocol artifacts added (finding 5, blocking)

`research.md` now exists, and `worklog.md` carries a `## Design` section with public surface, domain
vocabulary, ports, constants, **21 ordered file-scoped commit slices with a gate each**, deferred scope,
and the contributor path. Cycle 1 had neither; `plan-gate.md:16-34` requires both.

## Finding 10 (advisory) — accepted

The evaluator brief described its worktree as detached at `9c3cdfead`; ground truth was branch
`eval/quality-rail-plan-eval` at `83de0dc06`, the brief-only commit on top. The evaluator caught the
mismatch itself and reported it. Cycle 2's brief states the actual branch and sha, and the launcher's
`--expect-base` is set to the same value it verifies.
