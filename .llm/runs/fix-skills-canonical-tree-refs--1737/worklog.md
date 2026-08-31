# Worklog: canonical shipped skill references

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-skills-canonical-tree-refs--1737` |
| Branch | `fix/skills-canonical-tree-refs` |
| Archetype | `6 - CLI / Tooling` |
| Scope overlays | none |

## Design

### Public Surface

- Shipped skill prose under `skills/`, installed by `netscript agent init`.
- No TypeScript export or CLI command surface changes.

### Domain Vocabulary

- **canonical skill tree** — `.agents/skills/`, installed for every supported host.
- **derived mirror tree** — `.claude/skills/`, emitted only for Claude hosts.
- **shipped skill body** — a `*/SKILL.md` file listed by `skills/manifest.json`.

### Ports

- None; this slice introduces no external dependency or test seam.

### Constants

- `.claude/skills/` is the forbidden mirror reference detected by the regression test.

### Commit Slices

| # | Slice | Gate | Files |
| - | - | - | - |
| 1 | Prove shipped skill bodies cannot name the mirror tree (RED). | Focused Deno test fails with both paths. | `skills/canonical-tree-references_test.ts`, run artifacts |
| 2 | Point the two shipped bodies at the canonical tree (GREEN). | Focused test, sync/check, scoped static gates. | `skills/netscript/SKILL.md`, `skills/netscript-operate/SKILL.md`, run artifacts |

### Deferred Scope

- None.

### Contributor Path

Add a shipped skill file to `skills/manifest.json`; the manifest-driven regression test will scan
its body automatically.

## PLAN-EVAL

`N/A` before implementation: issue #1737 completely specifies the two-line correction and required
test, #1675 already locks canonical ownership, and the re-baseline found no open decisions.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-31 | S1 | research | Confirmed exact lines 43 and 50 and exactly two shipped-body matches. |
| 2026-08-31 | S1 | RED | Focused test exited 1 and named both offending manifest paths. |
| 2026-08-31 | S2 | GREEN source | Focused test passed; shipped-body sweep found 0 mirror references. |
| 2026-08-31 | S2 | mirror sync | Sync and check both exited 0; 18 skills / 22 mirrored files, no tracked mirror diff. |
| 2026-08-31 | S2 | boundary resolved | Supervisor explicitly authorized the mandatory generated shipping barrel. |
| 2026-08-31 | S2 | generation | `gen:assets-barrel` exited 0; barrel diff contains only two propagated strings and the derived bundle hash. |
| 2026-08-31 | S2 | scoped static | Check/lint exited 0; fmt found the new test then passed after focused formatting. |
| 2026-08-31 | S2 | final gates | Asset check, focused GREEN, mirror sync/check, and lock diff all captured green. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Scan manifest-listed skill bodies | Covers the entire shipped contract without hard-coding filenames. | `skills/manifest.json`; issue #1737 |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Baseline advanced from the original brief to `eaea940b`. | minor | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| RED regression | `deno test --allow-read skills/canonical-tree-references_test.ts` | FAIL (expected), rc=1 | Actual offenders: `netscript/SKILL.md`, `netscript-operate/SKILL.md`; 0 passed, 1 failed. |
| GREEN regression | `deno test --allow-read skills/canonical-tree-references_test.ts` | PASS, rc=0 | 1 passed, 0 failed. |
| Shipped-body sweep | `rg -n '\.claude/skills/' skills/ --glob 'SKILL.md'` | PASS, rc=1 | Ripgrep's no-match exit; actual match count 0. |
| Mirror sync | `deno task agentic:sync-claude` | PASS, rc=0 | Synced 18 skills / 22 files; no hand edits. |
| Mirror check | `deno task agentic:sync-claude:check` | PASS, rc=0 | All 22 mirrored files byte-current. |
| Scoped check | `run-deno-check.ts --root skills --ext ts` | PASS, rc=0 | 1 file selected; `--unstable-kv`; 0 findings. |
| Scoped lint | `run-deno-lint.ts --root skills --ext ts` | PASS, rc=0 | 1 file selected/processed; 0 findings. |
| Scoped fmt | `run-deno-fmt.ts --root skills --ext ts` | PASS after fix, rc=0 | Initial rc=1 identified only the new test; focused `deno fmt` rc=0, recheck 0 findings. |
| Asset currency | `deno task check:assets-barrel` | PASS, rc=0 | Regeneration plus diff check; no unrelated generated drift. |
| Lock hygiene | `git diff --exit-code -- deno.lock` | PASS, rc=0 | Lock file byte-unchanged. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Canonical ownership | PASS | RED rc=1 before repair; GREEN rc=0 after repair | Source invariant proven. |
| Generated projection | PASS | `gen:assets-barrel` rc=0; `check:assets-barrel` rc=0 | Only two source-string propagations plus deterministic bundle hash. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Runtime behavior | N/A | Scope analysis | No runtime behavior changes. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| VS Code-only scaffold | PASS (focused invariant) | Manifest-driven test rc=0; sweep count 0 | The test reads the exact bundle bodies copied into `.agents/skills/` for non-Claude hosts. |

## Handoff Notes

- IMPL-EVAL is mandatory and supervisor-dispatched after final gates pass.
- PR #1759 shares the generated barrel. The coordinator owns merge ordering; regenerate after the
  first PR lands rather than manually resolving the carrier.
- Repo-wide `deno task test` was not run due explicit sibling-leaf contention guidance; the focused
  regression and scoped wrappers are the selected proof for this documentation/generated-asset fix.
