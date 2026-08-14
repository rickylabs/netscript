# PLAN-EVAL — docs-comparison-docs-programme--1551

- Cycle: formal PLAN-EVAL **cycle 1** (reset-gate order 6; the 2026-08-13 `APPROVED` comment and the
  Minimax/OpenRouter advisory run carry no weight and were not consulted for the verdict)
- Run: `.llm/runs/docs-comparison-docs-programme--1551/`
- Evaluated head: `d35cbca30872d1f55118d63437638e93270c2ac3`
- Immutable base: `01e0960494c95ce56eb35892c211a095eb13e6ed`
- Surface / archetype: docs leaf, `1-small-contract`
- Scope overlays: `SCOPE-docs`
- Generator (not consulted): WSL Codex thread `019ffcc9-16c2-7573-b7f6-d627172408e8`

## Head reconciliation (independently re-verified)

| Source                                             | Value                                      |
| -------------------------------------------------- | ------------------------------------------ |
| `git rev-parse HEAD`                                | `d35cbca30872d1f55118d63437638e93270c2ac3` |
| `git fetch origin docs/comparison-docs-programme` → `origin/docs/comparison-docs-programme` | `d35cbca30872d1f55118d63437638e93270c2ac3` |
| PR #1652 `headRefOid`                               | `d35cbca30872d1f55118d63437638e93270c2ac3` |
| PR state                                            | OPEN, draft, base `main`, `status:plan-eval` (exactly one lifecycle status) |

All three agree. No mismatch; the gate proceeds. Working tree was clean at evaluation start.

## Route and attachment

| Field             | Value                                                            |
| ----------------- | ---------------------------------------------------------------- |
| Claude session id | `40a06314-b69a-4ca0-a4a0-1224c5e377ca`                            |
| PID               | `2465471` (`/home/codex/.claude/sessions/2465471.json`)           |
| cwd               | `/home/codex/repos/netscript-007-docs-comparison`                 |
| `bridgeSessionId` | `cse_0126JRYrbXqvoJwskcF31RwW`                                    |
| Remote Control    | <https://claude.ai/code/cse_0126JRYrbXqvoJwskcF31RwW>             |
| Requested route   | native Claude Opus 5, effort `low`, Remote Control, `bypassPermissions` |
| Observed route    | `respawnFlags` in `~/.claude/jobs/40a06314/state.json`: `--model claude-opus-5`, `--effort low`, `--remote-control`, `--permission-mode bypassPermissions` |
| Verdict           | **matched** (no substitute provider; Fable 5 not used)            |

`--model`/`--effort` are absent from `/proc/2465471/cmdline` because this is a `--bg` session claimed
over the daemon socket; `respawnFlags` is the observed-route source of record.

## Checklist results

| Plan-Gate item                          | Result | Evidence / location |
| --------------------------------------- | ------ | ------------------- |
| Research present and current            | PASS   | `research.md`; re-baselined against live `origin/main` `01e0960…` (`research.md:7`). Spot-checks against the tree: `docs/site/_data.ts:59-103` really defines the five lanes Start/Learn/Build/Reference/Concepts; `docs/site/explanation/compared.md` exists; `docs/site/_data/xref.ts` exists; `deno.json:84-85` defines `docs:links`/`docs:accuracy`; `docs/site/deno.json:4,8-10` defines `build`/`check:links`/`check:caveats`/`verify`. `deno doc --filter definePage packages/fresh/src/application/builders/mod.ts` confirms the public export claim (`research.md:42`); `rg defineRegion packages/` returns zero hits, confirming the consumer-local attribution correction (`research.md:48`). |
| Decisions locked                        | PASS   | `plan.md:26-35`, eight decisions each with rationale (IA under Concepts, xrefs, evidence vocabulary, exact version pins, presentation held constant, script-only numbers, matrix columns, `Part of #1551`). Corroborated by `worklog.md` `## Design` (`### Public information architecture`, `### Evidence model`, `### Equivalence contract`, `### Closure decision`). |
| Open-decision sweep                     | PASS   | Evaluator-run sweep below found no deferred decision that forces rework. |
| Commit slices (< 30, gate + files each) | PASS   | Four ordered slices P0/S1/S2/S3 (`plan.md:41,67,98,133`); each enumerates files (max 8) and a named gate with exact commands (`plan.md:54,87,121,159`) plus commit intent. |
| Risk register                           | PASS   | `plan.md:188-198`, nine rows, each with likelihood/impact, control, and an explicit stop condition. |
| Gate set selected                       | PASS   | Leaf contract `provingGates` = `check`, `test`, `docs-source-format`, `docs-accuracy` (`release-0.0.7--orchestration/leaf-contracts.json`, key `comparison-docs-programme`). Mapping verified: `check`/`test` → S2 `run-deno-check.ts`/`run-deno-test.ts` (`plan.md:122,125`); `docs-source-format` → `deno task --cwd docs/site build`, which is `check:source-format && lume && …` per `docs/site/deno.json:4` (`plan.md:88,160` via `verify`); `docs-accuracy` → `deno task docs:accuracy` (`plan.md:162`). No release/scaffold/E2E gate is claimed, consistent with `ci:skip-e2e`/`ci:skip-scaffold`. |
| Deferred scope explicit                 | PASS   | Non-goals `plan.md:16-24`; deferred acceptance map `plan.md:200-209` maps all six residual clusters to #1645–#1650. Verified live: all six are OPEN, milestone `Backlog / Triage`, `type:docs`+`area:docs`, exactly one `status:triage`, explicit priority — so no residual work silently re-enters milestone `0.0.7`. |
| jsr-audit surface scan (pkg/plugin)     | N/A    | `research.md:146-148` and `leaf-contracts.json` (`jsrAudit.applicable: false`). No `packages/**` or `plugins/**` path appears in any slice's file list. |

## Open-decision sweep (evaluator-run)

None that would force rework if deferred. Specifically checked and found closed:

- **Navigation shape** — decided as two folder roots inside the existing Concepts lane, not a sixth
  lane (`plan.md:28`); reversing it later would be a `_data.ts` + xref edit, not a content rewrite.
- **Whether any number ships in 0.0.7** — decided yes, but only script-regenerated aggregates
  (`plan.md:33`), with unmatched Next.js values recorded absent/deferred rather than zero or
  estimated (`plan.md:117`). This forecloses the one-measured-side-vs-estimated-side failure.
- **Issue closure** — decided `Part of #1551` with no closing keyword (`plan.md:35`), correctly
  grounded in the live acceptance contract still holding 17 unchecked deliverables rather than in
  the existence of follow-ups (`research.md:27`).
- **Version pins** — Next.js `16.3.0`, EIS-Chat `5191de83…`, consumer NetScript `0.0.6`, Fresh
  `^2.3.3` (`plan.md:31`), with the freshness/refresh policy assigned to the S1 methodology page
  (`plan.md:80`), so a later Next.js release is a metadata update, not a re-plan.
- **Scope containment for future comparisons** — remaining topics and the full parity map are owned
  by #1649/#1650, and the S1 methodology page carries the update policy, so adding a future case is
  a new run against a published contract rather than untracked growth of this leaf.

## Verdict

`PASS`

Implementation may begin at S1. The stop conditions in `plan.md:24` and the no-self-certification
rule in `plan.md:213` remain binding: after S3 the run stops for Tier-A review and a separate
opposite-family IMPL-EVAL.

## Notes (non-blocking; not gate items)

1. `plan.md:182` enumerates the S3 docs-audit rows as links, clean site build, changed-line
   internal-wording scan, specifier scan, command/API sampling, navigation/front matter, prose, and
   cross-page contradictions. The `SCOPE-docs` overlay also names a **Terminology** gate ("names
   match doctrine and the glossary"). It is not a separate row. It is substantively covered by
   `deno task docs:accuracy` (`.llm/tools/docs/check-accuracy-and-discoverability.ts` enforces
   required/forbidden term sets) plus the prose row, so no box is unchecked — but S3 should assert
   the new pages against `docs/site/glossary.md` explicitly. Falsifiable by: the S3 worklog gate
   table showing no glossary assertion.
2. S2 measurements reproduce only from "authorized pinned inputs" (`plan.md:129`) — i.e. a reader
   without access to the private EIS-Chat revision cannot re-run the script. No S1 or S3 content
   bullet requires the published page to state that precondition. The evidence legend and immutable
   source block (`plan.md:148,153`) are the natural place for one sentence saying so. Falsifiable
   by: the rendered case page publishing a `measured` number with no statement of who can reproduce
   it.
3. `docs/site/comparisons/` and `docs/site/migration/` exist on disk as empty, untracked directories
   (residue of the interrupted S1 turn). This does not contradict `research.md:33` — Git tracks no
   files under either path at `d35cbca3` — but S1 must not treat them as pre-existing state.
