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
| `R-4` | `arch:check:repo` iterates **live workspace members read from the root `deno.json` workspace list**, not a hand-listed set and not the repository root. | #1380 acceptance requires it. Reading the workspace list means a new package is gated the moment it joins the workspace — the property #1403's coverage test is reaching for, generalised. |
| `R-5` | The A14 predicate must resolve **where the identifier came from**, not merely that `describe(`/`it(` appears. | 54 of 55 `arch:check:repo` failures are `@std/testing/bdd` imports — the sanctioned API. A predicate that cannot tell an import from a global is not a Jest/Vitest detector. |
| `R-6` | `arch:check`'s 16-root task string is moved into **data** (a checked-in list the task and the tests both read) in **PR-B**, before PR-C generalises it. | The list is a ~2 kB inline shell string; a coverage test would have to parse shell to read it. Moving it to data first makes PR-B's coverage assertion honest and PR-C's live-member switch a small delta rather than a rewrite. |
| `R-7` | `--max-allow` is wired at the count **measured in the wiring PR**, and the PR body states that adding an allowance will now fail CI. | Wiring a budget is a behavioural change to every future PR, not a flag addition. Unstated, it reads as a break. |
| `R-8` | Findings surfaced by newly-covered scans are **triaged into issues, never fixed in the surfacing PR** (`plan.md` S-5). PR-E is not an exception: it fixes the **scanner's scope**, not the findings. | #1403 box 5 and #1378 § Boundaries both require it. The distinction matters for honest box-ticking, so PR-E's body states it explicitly. |
| `R-9` | The RFC-location divergence (#1380 D9/D10) is resolved **by recording the decision the repo already made**, not by adopting a new process. | `rfcs/` holds only a template and a README; five numbered RFCs (0001–0005) were accepted through `.llm/runs/*/design/canonical/` and merged in the last week. The de-facto path is the harness path. PR-C states which location is canonical and maps the 5 `DECISION_PENDING` entries onto it — it does not invent a promotion pipeline. |

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
