# Wave Plan: 0.0.6 chores/internals lane

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `release-0.0.6-internals--orchestration` |
| Branch | `chore/release-0.0.6-internals-orchestration` |
| Phase | `plan` (stage B of `workflow/milestone-run.md`) |
| Target | repo tooling — `.llm/tools/validation/`, `.llm/tools/quality/`, `.llm/tools/fitness/`, `deno.json` tasks, `docs/architecture/doctrine/` |
| Archetype | N/A — no `packages/**` or `plugins/**` source is authored by this lane |
| Scope overlays | none (`SCOPE-docs.md` applies to PR-C's doctrine-document half) |

## Goal

Make the repo's own gates trustworthy, then make them informative, and close the five owned issues
through green leaf PRs to `main` with acceptance that is truthfully tickable.

The lane's thesis: **a gate that invents a requirement (#1436), a gate that accepts its own IOU
(#1415), and a gate whose pass is indistinguishable from a did-not-run (#1403/#1378/#1380) are three
faces of one defect class.** Gate trust is sequenced first because the later PRs are merged *through*
those gates — repairing the quality rail while the close-gate can still fabricate or absolve
requirements would mean landing the rail on unverified acceptance.

## Live re-baseline (executed, not carried in)

Executed at `01aa12b67` on 2026-08-12 in this worktree. Every count below is a command result.

| Claim under test | Source | Executed result |
| --- | --- | --- |
| `extractClosingIssues` lacks word boundaries | #1436 "Fix" section | **Falsified as stated.** `acceptance-evidence.ts:43` already carries `\b(?:close\|closes\|…)` and already strips fenced blocks (`:47`, landed by #1303). `hotfix #999`, `prefixes #888`, `bugfix #777` all correctly return `[]`. |
| `pre-fix #1431` is mis-parsed | #1436 observed instance | **Confirmed at HEAD.** `'Exact pre-fix #1431 head'` → `[1431]`. Second instance found by this lane: `'un-fixed #555'` → `[555]`. |
| Mirror validates presence, not assertion | #1415 | **Confirmed.** `validateEvidenceMapping` (`acceptance-evidence.ts:142`) rejects only `!entry.evidence.trim()`; any non-empty string ticks the box. |
| 36 live units under `packages/` + `plugins/` | #1380 D6 | **Confirmed.** `ls -d packages/*/` → 30, `ls -d plugins/*/` → 6. |
| `quality:scan` default roots are `packages/cli/src` + `plugins` | #1403, #1378 | **Confirmed.** `scan-code-quality.ts:18` `DEFAULT_ROOTS = ['packages/cli/src', 'plugins']`. |
| `arch:check` omits `packages/plugin-streams-core` | #1403 | **Confirmed.** `deno.json:156` names 16 roots; `plugin-streams-core` is the only `plugin-*-core` absent. |
| `arch:check:repo` runs `check-doctrine.ts` with no `--root` | #1380 D8 | **Confirmed.** `deno.json:157` is bare. |

### Finding F-1 (raised now, must reach PR-A's brief)

**#1436's proposed fix does not fix #1436.** The issue prescribes adding `\b` to the keyword
alternation. `\b` is already present, and it is *why* the bug survives: `-` is a non-word character,
so `\bfix\b` matches the `fix` inside `pre-fix` and inside `un-fixed`. The correct predicate excludes
a preceding hyphen as well as a preceding word character — a lookbehind of the
`(?<![\w-])` shape, not another `\b`. Implementing the issue's literal text would produce a no-op
patch that looks correct: precisely the failure class `milestone-run.md` § Gate integrity names
("two guards whose predicate could never be true … both did nothing and looked correct"). Recorded in
`drift.md` D-4 and briefed as a required RED case.

## Clusters and sequencing

Four leaf PRs, each against `main` from its own fresh worktree/branch. One active implementation
thread at a time (brief §4) — so the waves below are strictly sequential, and "wave" here is a
dispatch boundary, not a content contract.

### Wave 1 — gate trust

**PR-A — `fix/1436-1415-close-gate-trust`** · closes #1436, #1415 · lane `light_implementation`
(Sol · low) · review `review_codex_light` (Opus 5 · high).

Clustered because both defects live in `.llm/tools/validation/acceptance-evidence.ts`, both are
consumed by `check-close-gate.ts` **and** `mirror-acceptance-evidence.ts`, both are single-predicate
repairs, and both share one test file (`acceptance-evidence_test.ts`). Splitting them would mean two
PRs editing the same 50 lines in sequence.

Required deliverables:

1. `extractClosingIssues` no longer matches a keyword preceded by a hyphen or word character
   (`pre-fix`, `un-fixed`, `hotfix`, `prefixes`, `bugfix`), and still matches the real forms
   (`Closes #N`, `fixes #N`, full issue URLs, case-insensitively).
2. A reference whose number resolves to a **pull request** does not enter `closingIssues`.
   `resolveClosingIssueReferences` already receives GitHub's authoritative set from
   `getClosingContext`; the regex-derived additions are the ones that need the PR filter.
3. The acceptance mirror rejects evidence that asserts not-yet-done for any box it is about to newly
   tick, failing with the box text and the offending evidence.
4. The not-yet-done predicate is **narrow**: whole-string / leading-token shaped, so
   "supersedes the earlier pending note" is not rejected. That non-rejection is itself a test case
   (#1415 acceptance box 3).

### Wave 2 — quality rail

> **Superseded ordering note (revision 3).** The authoritative order is
> **PR-E (#1530) → PR-B (#1403) → PR-C (#1380) → PR-D (#1378 + #1545)**, defined once in
> `plan-quality-rail.md` § The one PR order. PR-E was inserted after this section was written, and
> `plan-eval-cycle2.md` finding 6 failed the plan for leaving the two statements in conflict. Where
> this section and `plan-quality-rail.md` differ, the rail plan governs.

Serialized under this lane because the three issues overlap on root lists, scan semantics, doctrine
and architecture debt. One rail plan, **one** PLAN-EVAL over the whole rail, then three sequential
PRs each with its own IMPL-EVAL.

**PR-B — `fix/1403-quality-gate-coverage`** · closes #1403 · lane `light_implementation`
(Sol · low) · review `review_codex_light`.

Smallest and highest priority (p0). Adds `packages/plugin-streams-core` to `arch:check`, settles the
`quality:scan` root policy, and adds the coverage assertion so the next publishable plugin-core
package cannot be silently omitted. Its acceptance explicitly expects the repaired gate to *surface*
findings, and explicitly forbids fixing them here — they are triaged into new issues.

**PR-C — `fix/1380-doctrine-verdict-and-repo-gate`** · closes #1380 · lane `normal_implementation`
(Sol · medium — per-row rename-vs-deletion judgement and the RFC-location resolution are real
decisions) · review `review_codex` (Fable 5 · low).

Re-walks the verdict table to the 36 live units, records rename-vs-deletion per removed row, syncs
`06-archetypes.md`, makes `arch:check:repo` iterate live workspace members instead of the repository
root, stops A14 firing on `@std/testing/bdd` imports, and closes-or-dates the accepted-red
`arch-debt.md` entry.

**PR-D — `fix/1378-quality-scan-rule-power`** · closes #1378 · lane `complex_implementation`
(Sol · high) · review `review_codex_complex` (Fable 5 · medium).

The largest slice: export-aware `any` severity, allowances that require a linked open issue and are
budgeted via `--max-allow`, and `docs/site/**` fenced-TS extraction.

### Locked sequencing decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| `S-1` | PR-A lands before any rail PR. | The rail PRs are merged *through* the close-gate and the acceptance mirror. Merging them on a gate that can fabricate a requirement (#1436) or absolve one (#1415) means their acceptance record is unverified — the exact inversion #1415 describes. |
| `S-2` | PR-B (#1403) before PR-C (#1380). | #1403 is p0, is the smallest change, and its coverage assertion is the artifact #1380 then generalizes. Reversing the order would make #1403's "run the repaired gate and report its real state" box depend on #1380's much larger refactor landing first. |
| `S-3` | PR-C (#1380) before PR-D (#1378). | #1378 states its own boundary: "Do not change `arch:check`'s root list here — that is #1380's `arch:check:repo` closure plan." Root scope must be settled before rule power is layered on it. |
| `S-4` | PR-C **evolves** PR-B's coverage test; it does not delete it. | If #1380 replaces the hand-listed roots with live-member iteration, the naive move is to drop the now-"redundant" coverage assertion. That would silently retire #1403's fourth acceptance box after it was ticked. The assertion must survive in generalized form. |
| `S-5` | Findings surfaced by newly-covered scans are triaged to new issues, never fixed in the PR that surfaced them. | #1403 acceptance box 5 and #1378 § Boundaries both require it; folding fixes in would make the PR unbounded and its gate evidence unreadable. |
| `S-6` | No canary point declared by this lane. | Brief §7 — root owns canary and stable. This lane reports merges and keeps `cut-trace.md` live. |

## Non-scope

- Any other 0.0.6 issue, and PR #1522 (owner removed it from the milestone).
- The six open verdict-Refactor/Restructure package refactors (#1380 § Boundaries).
- #1278 Inventory B, #1276 T1–T5, #1245, #1249, #1093, #1280, #1320 (all named out by #1378/#1380).
- `packages/fresh-ui` quality extension — blocked on #1379's lock policy (#1378 § Boundaries).
- Canary or stable publication, and any release-note authoring.

## Hidden scope

- **`arch:check` is `deps:check` + 16 `check-doctrine.ts` invocations in one shell string**
  (`deno.json:156`). Any root change edits a ~2 kB task line; a coverage test therefore has to read
  and parse that task string, not a tidy array. PR-B must decide whether to keep the string or move
  the root list into data — and if it moves it, that is a change PR-C depends on.
- **`quality:scan`'s `--max-allow` exists but is wired by no task and no workflow.** Wiring it at the
  measured count is a behavioural change to CI, not a flag addition: any PR that adds an allowance
  then fails. That is the intent, and it must be stated in the PR body so it is not read as a break.
- **The `code-quality.yml` PR gate scans only changed files** (`:36-42`) while `quality:scan:repo`
  runs on push-to-main and a Monday cron (`:50-59`). A rule that fires only on full-repo scans is
  invisible on the PR that introduces the violation. Rule changes must be checked against both paths.
- **#1380 touches the doctrine surface that `netscript-doctrine` routes agents through.** A stale row
  is not merely wrong prose; it is a skill mis-routing every future agent.

## Fitness gates per PR

| PR | Gates that must be green | Negative case that must be demonstrated |
| --- | --- | --- |
| PR-A | `deno test` on `.llm/tools/validation/`; scoped check/lint/fmt wrappers over `.llm/tools/validation` | `pre-fix #N` / `un-fixed #N` return `[]` after the fix and `[N]` before it; `— Pending …` evidence fails the mirror naming box + evidence; a factual sentence containing "pending" still ticks |
| PR-B | `deno task quality:gate`; `deno task arch:check`; the new coverage test | Coverage test fails when a publishable plugin-core package is removed from the root list |
| PR-C | `deno task arch:check` green; `deno task arch:check:repo` exit 0 or residue enumerated in `arch-debt.md`; new existence/coverage tests | Existence test fails on a verdict row naming a non-existent directory; coverage test fails on a live unit with no row; A14 does not fire on a `@std/testing/bdd` import fixture |
| PR-D | `deno task quality:scan:repo`; `deno task arch:check`; new rule tests | Exported `any` fails; unlinked `as unknown as` fails; `as any` in a `docs/site/**` fence fails; the 6 `*-soundness_test.ts` files stay green; budget overflow fails |

Every PR additionally passes the pre-merge gate in `milestone-run.md` (close-gate green, zero
unticked boxes, no new ignore/cast/lock drift, named expensive gates `SUCCESS` not `SKIPPED`, the
decisive claim re-verified independently, PR-body checklist matches what shipped).

## Risk register

| Risk | Mitigation |
| --- | --- |
| An implementer writes #1436's literal prescribed fix (`\b`) and reports green. | F-1 is in the brief as a required RED case with the exact failing inputs. The orchestrator re-runs the probe against the patched parser itself before merge. |
| The #1415 not-yet-done predicate over-matches and blocks honest evidence. | Whole-string/leading-token shape locked in the brief; the false-positive case is a mandatory GREEN test (#1415 acceptance box 3). |
| PR-B's repaired gate surfaces a large finding set and the implementer "fixes" them. | S-5 locked; the brief forbids it and requires a triage list instead. Orchestrator checks the diff for `packages/plugin-streams-core` source edits. |
| PR-C's doctrine re-walk assumes rename where a package was deleted. | #1380 requires rename-vs-deletion **recorded per row**; the brief requires git evidence (`git log --diff-filter=D`) per removed row, not inference. |
| PR-D wires `--max-allow` and immediately reds CI on an unrelated PR. | Wire at the *measured* count and state the intended behaviour in the PR body; the budget-overflow test proves the direction. |
| Serialized rail runs long; a sub-agent goes idle at a red gate. | Brief the gates as deliverables (skill § Delegation). Watch via `agentic:codex-watch --mode turn` and steer the existing thread; never launch a rival. |
| Three concurrent expensive gates contend. | Only one implementation thread is active at a time (brief §4); expensive gates are serialised (`milestone-run.md` § Gate integrity). |

## Validation plan

| Order | Gate | Command | Expected |
| --- | --- | --- | --- |
| 1 | validation-tool tests | `deno test --allow-read .llm/tools/validation/` | pass |
| 2 | scoped check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root .llm/tools --ext ts` | pass |
| 3 | scoped lint | `.llm/tools/run-deno-lint.ts --root .llm/tools --ext ts` | pass |
| 4 | scoped fmt | `.llm/tools/run-deno-fmt.ts --root .llm/tools --ext ts` | pass |
| 5 | quality gate | `deno task quality:gate` | pass |
| 6 | repo quality scan | `deno task quality:scan:repo` | pass (PR-D: at the wired budget) |
| 7 | doctrine gates | `deno task arch:check` / `deno task arch:check:repo` | `arch:check` green; `arch:check:repo` exit 0 or enumerated residue |
| 8 | close gate | `close-gate` result on each PR | green, and its `closingIssues` re-read by the orchestrator |

`deno task e2e:cli` is **not** in this lane's gate set: no PR here touches scaffold output, plugin
scaffolding, DB wiring, Aspire generation, or plugin copy mode. If a rail PR is found to change
`packages/cli` behaviour, that is a rescope trigger, recorded in `drift.md`, not a silent gate skip.

## Dependencies

- Codex WSL app-server daemon (mobile-visible implementation lane) — precondition checked at stage B.
- GitHub API token for `close-gate` / mirror runs (`gh` authenticated as `rickylabs`, scopes
  `read:org`, `repo`, `workflow`).
- `#1524` (open, unmilestoned draft) would restore the OpenHands evaluator path. Not depended on;
  formal evaluation runs native opposite-family until it lands.

## Drift watch

- Whether the owner reassigns any owned issue out of this lane.
- Whether `origin/main` moves under a rail PR in a way that changes the measured baselines (36 live
  units, 16 `arch:check` roots, 7/10 allowance counts).
- Whether PR-B's root-list refactor changes the shape PR-C depends on.
- Whether any acceptance box turns out to be untickable as scoped (→ honesty rule: it moves with its
  issue, it is never ticked).
