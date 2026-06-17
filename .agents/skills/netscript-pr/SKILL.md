---
name: netscript-pr
description: Author NetScript branches, pull requests, and the per-phase structured PR comments used by the harness (research / plan / plan-eval / impl / impl-eval / review summaries), plus umbrella↔sub-PR linking and the namespaced label taxonomy. Use this whenever you are about to create a branch, open or update a PR, post a phase summary comment, split an umbrella into sub-PRs, or apply status/type/area labels in this repo — even if the user just says "open a PR", "push this", "comment the results", or "mark it ready for review". Getting the branch name, PR body, and labels right the first time is what keeps the harness board from rotting.
---

# NetScript PR Authoring

Consistent branches, PR bodies, phase comments, and labels are what let the harness run as a
machine: humans and agents read the same structured surface, and automation (Phase D labels +
Projects v2) keys off it. Sloppy PR hygiene is how a board becomes a graveyard. This skill is the
house format.

## Tooling note

`gh` is **not** on PATH in this environment. Use the **GitHub MCP** tools for all PR/issue/label
operations (`create_pull_request`, `update_pull_request`, `add_issue_comment`, `issue_write`,
`pull_request_read`, label tools). For ground-truth branch/remote state, spawn git directly (RTK can
serve stale reads) — see the **netscript-tools** skill.

## Branch naming

`<type>/<slug>` — lowercase, kebab, no trailing dates. Types match the commit/PR taxonomy:

- `feat/`, `fix/`, `chore/`, `docs/`, `refactor/`, `perf/`, `test/`.
- Sub-branches of an umbrella append a scope: `chore/deno-2.8-aspire-13.4-upgrade` (umbrella) →
  `chore/deno-2.8-aspire-13.4-upgrade-fresh` (sub). Keep the umbrella prefix so the relationship is
  visible in `git branch` and the PR list.

## Umbrella vs sub-PR (wave-4/5 pattern)

- **Umbrella PR**: the coordinating PR for a multi-slice effort. Body carries the slice checklist and
  links every sub-PR. Labelled `type:umbrella`.
- **Sub-PR**: one parallelizable slice on its own sub-branch, targeting the **umbrella branch** (not
  `main`). Labelled `type:sub-pr` and links back to the umbrella with `Part of #<umbrella>`.
- **Sequential vs parallel**: only split into sub-PRs when slices are genuinely independent. Slices
  that all edit `deno.json`/catalog are conflict-prone → keep them **sequential on one branch**, one
  commit per slice. (This is why PR #44's remediation is sequential, not fanned out.)

## PR body template

Always structure the body like this so reviewers and automation find the same anchors:

```markdown
## Summary

<1–3 sentences: what this PR changes and why.>

## Scope

- Archetype / area: <e.g. tooling, packages/fresh, plugins/workers>
- Part of #<umbrella> · Sub-PRs: #<n>, #<n>   <!-- omit the side that doesn't apply -->

## Slices

- [x] S1 <slice> — <commit>
- [ ] S2 <slice>

## Validation

- `deno task check:<slice>` — <result>
- `deno task ci` / `e2e:cli scaffold.runtime` — <result + native-WSL note if applicable>

## Harness

- Run dir: `.llm/tmp/run/<run-id>/`
- Phase: <research|plan|plan-eval|impl|impl-eval|review> — see phase comments below.

## Drift / Debt

- <DEBT_ACCEPTED rows or "none">
```

Keep `Validation` honest: paste real results/exit codes; if a gate was skipped, say so. A green
checkbox with no evidence is how false-green merges happen.

## Per-phase structured comments

Each harness phase posts ONE comment so the PR timeline reads as a phase log. Lead with a status
token line so the (future) label automation can parse it:

```markdown
**[PHASE: IMPL-EVAL] [VERDICT: CHANGES_REQUESTED]**

<one-line headline>

### Findings
1. **C1 …** — <what + where + fix>
...

### Next
- <action + owner>
```

Phases & their verdict vocabulary:

- `RESEARCH` → (no verdict; summary only)
- `PLAN` → summary; gate is a separate `PLAN-EVAL` comment with `APPROVED` / `CHANGES_REQUESTED`.
- `IMPL` → summary of slices landed.
- `IMPL-EVAL` → `PASS` / `CHANGES_REQUESTED` (the gate that clears merge).
- `REVIEW` (augment/Fable) → advisory.

The evaluator must be a **separate session** from the generator (harness rule). Comment, don't edit,
when acting as evaluator.

## Draft ↔ ready

- Open multi-slice work as a **draft** PR; per-commit CI (Phase C tier 1) runs on drafts but is
  non-blocking.
- Flip to **ready for review** only when the slice checklist is complete and IMPL-EVAL is expected to
  pass — that transition is what triggers the blocking e2e tier and `status:impl-eval`.

## Label taxonomy (namespaced — Phase D)

Exactly one `status:` at a time; `type:`/`area:`/`ci:` as needed. The single-status rule is what lets
a board column reflect reality.

- `type:` — `umbrella`, `sub-pr`, `chore`, `feat`, `fix`, `docs`
- `status:` — `research`, `plan`, `plan-eval`, `impl`, `impl-eval`, `augment-review`, `ci-fail`,
  `ready-merge`
- `area:` — `cli`, `fresh`, `plugins`, `deps`, `aspire`, `tooling`
- `ci:` — `skip-e2e`, `full` (manual overrides for the path-filtered CI)

Source of truth stays the harness run artifacts under `.llm/tmp/run/`. Labels + Projects v2 are a
**view and a trigger**, not the record. When you advance a phase, move the `status:` label in the
same action you post the phase comment, so the board never lags the timeline.

> Phase D (the Action that enforces single-status, syncs label→Project column, and fires the right
> workflow per status) is deferred to the repo-process-automation umbrella. Until it lands, apply
> labels manually per this taxonomy so the future automation has clean data.

## Path-filter awareness (Phase C)

Config/docs-only PRs are auto-skipped by CI `paths-ignore`; override with `ci:full` when a docs PR
must run e2e, or `ci:skip-e2e` to suppress it. Don't fight the filter by editing workflows per-PR.
