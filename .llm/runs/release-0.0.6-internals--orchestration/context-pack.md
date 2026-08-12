# Context Pack — release-0.0.6-internals--orchestration

Resumable summary. Read this first when resuming; then `supervisor.md`, `plan.md`, `worklog.md`,
`cut-trace.md`, `drift.md`.

## What this run is

The **0.0.6 chores/internals lane**: a topical milestone orchestration owning exactly five issues —
internal quality and gate correctness. It coordinates and delegates; it does not author tooling or
framework implementation code, and it does not publish. Root 0.0.6 orchestration owns canary and the
stable cut.

## Where it stands

| Stage | Status |
| --- | --- |
| A — Bootstrap | **done** — identity/worktree proved, five issue bodies read live, 30 acceptance boxes inventoried, run dir written |
| B — Wave plan | **done** — `plan.md` committed; dispatch preconditions executed and GREEN; wave-plan PLAN-EVAL decision recorded |
| C/D — Wave 1 (PR-A) | next |
| C/D — Wave 2 (PR-B → PR-C → PR-D) | pending |
| E — Canary | N/A for this lane (`drift.md` D-3) |
| G — Close | pending |

## The four PRs

| PR | Branch | Closes | Lane | Eval |
| --- | --- | --- | --- | --- |
| PR-A | `fix/1436-1415-close-gate-trust` | #1436, #1415 | Sol · low | both waived (owner, `drift.md` D-1); negative cases proven instead |
| PR-B | `fix/1403-quality-gate-coverage` | #1403 | Sol · low | rail PLAN-EVAL + own IMPL-EVAL |
| PR-C | `fix/1380-doctrine-verdict-and-repo-gate` | #1380 | Sol · medium | rail PLAN-EVAL + own IMPL-EVAL |
| PR-D | `fix/1378-quality-scan-rule-power` | #1378 | Sol · high | rail PLAN-EVAL + own IMPL-EVAL |

Strictly sequential (one active implementation thread). Sequencing locks S-1…S-6 in `plan.md`.

## The three facts most likely to be lost

1. **#1436's prescribed fix is a no-op.** The `\b` it asks for is already in the code; `\b` is the
   *cause*, because `-` is a non-word character. The fix needs a `(?<![\w-])`-shaped predicate.
   Mandatory RED cases: `pre-fix #N`, `un-fixed #N`. See `drift.md` D-4.
2. **#1436 has zero acceptance boxes.** The close-gate has no issue checklist to validate for it, so
   PR-A's own body checklist is the only record — which makes pre-merge check 7 (PR body matches what
   shipped) load-bearing rather than routine for this PR.
3. **#1380 and #1378 are labelled `type:docs` but their acceptance requires tooling code.** They are
   not docs-lane PRs; do not let them take the docs CI lane on label evidence.

## Baselines measured at `01aa12b67` (2026-08-12)

- Live units: **30** `packages/*` + **6** `plugins/*` = **36**.
- `arch:check` (`deno.json:156`): **16** hand-listed roots; `packages/plugin-streams-core` absent.
- `arch:check:repo` (`deno.json:157`): bare `check-doctrine.ts`, no `--root` → evaluates the repo root
  as one package.
- `quality:scan` `DEFAULT_ROOTS` (`scan-code-quality.ts:18`): `['packages/cli/src', 'plugins']`.
- `--max-allow` exists (`:173-181`), wired by **no** task and **no** workflow.
- Allowance counts per #1378: 7 default / 10 repo-wide (to be re-measured in PR-D before wiring).

## Do-not-do list

- Do not absorb any other 0.0.6 issue; do not touch PR #1522.
- Do not fix findings surfaced by a newly-covered scan in the PR that surfaced them (S-5).
- Do not delete PR-B's coverage assertion when PR-C generalizes the root list (S-4).
- Do not tick an acceptance box that is not truthfully done — it moves with its issue instead.
- Do not run `deno task e2e:cli` for this lane; no PR here touches scaffold/DB/Aspire surfaces.
