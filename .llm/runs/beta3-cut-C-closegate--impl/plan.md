# Plan: close-gate verified acceptance

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `beta3-cut-C-closegate--impl` |
| Branch | `chore/close-gate-387` |
| Phase | `plan` |
| Target | `process/tooling docs + CI` |
| Archetype | `N/A - no package/plugin source` |
| Scope overlays | `docs` |

## Archetype

N/A. This slice changes governance docs, GitHub workflow configuration, and a repo validation helper.
It does not change `packages/` or `plugins/` source.

## Current Doctrine Verdict

N/A for package/plugin doctrine. The docs overlay applies because the canonical rule belongs in
`.agents/skills/netscript-pr/SKILL.md` and the AGENTS pointer must avoid becoming a second source of
truth.

## Axioms in Play

| Axiom | Why it matters |
| ----- | -------------- |
| A14 | Tests and gates must preserve the intended process rule instead of relying on memory. |

## Goal

Prevent PRs with closing keywords from auto-closing issues whose acceptance or `gate:` checklist
items remain unchecked.

## Scope

- Extend `.agents/skills/netscript-pr/SKILL.md` with the close-gate convention, evidence standard,
  CI behavior, and override label.
- Regenerate `.claude/skills/` from the source skill.
- Add a checked-in Deno close-gate checker and wire it into CI for pull requests.
- Add `status:close-gate-override` to the label taxonomy.
- Add one short AGENTS pointer to the close-gate canonical skill section.
- Commit run artifacts, including coordinator-required `commits.md`.

## Non-Scope

- No product fix for #260 or any AI/plugin runtime gap.
- No edits under `packages/` or `plugins/`.
- No branch protection configuration outside checked-in workflow files.

## Hidden Scope

- The script must support real GitHub API fixtures so the PR comment can cite actual command output.
- The workflow cannot be fully executed before merge; local validation is limited to Deno type/lint/fmt
  and YAML review or `actionlint` if available.

## Locked Decisions

| ID | Decision | Rationale |
| -- | -------- | --------- |
| D1 | Put the checker under `.llm/tools/validation/check-close-gate.ts`. | It is repo process validation, matching existing validation tooling. |
| D2 | Count only unchecked boxes in acceptance/gate sections, plus `gate:` boxes anywhere. | This satisfies the noise-free requirement and avoids blocking on unrelated issue checklists. |
| D3 | Use `status:close-gate-override` as the explicit bypass label. | The issue requested an auditable override label and gave this exact example. |
| D4 | Check PR body closing keywords, not arbitrary comments. | The existing canonical closing-keyword standard uses the PR body as the auto-close home. |

## Open-Decision Sweep

| Decision | Status | Notes |
| -------- | ------ | ----- |
| Enforcement target | resolved | CI pull_request job runs the checker for PRs against `main`/existing CI branches. |
| Evidence-link validation | safe to defer | This slice fails unchecked acceptance/gate boxes. Human/evaluator review still verifies linked evidence on checked boxes. |

## Risk Register

| Risk | Mitigation |
| ---- | ---------- |
| False positives from ordinary checklists | Markdown section parser limits acceptance/gate scope; `gate:` boxes count anywhere by explicit convention. |
| Workflow token lacks issue read access | Add `issues: read` and `pull-requests: read` permissions. |
| Legitimate exception blocked | Document and implement `status:close-gate-override`. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| -- | ------ | ---- |
| false-green / false-done process | existing | Convert the manual rule into docs plus CI enforcement. |

## Fitness Gates

| Gate | Required | Expected evidence |
| ---- | -------- | ----------------- |
| Source alignment | yes | PR skill is canonical; AGENTS only points to it. |
| Scope separation | yes | No package/plugin source edits. |
| Link integrity | yes | Referenced local paths exist. |

## Arch-Debt Implications

| Entry | Action | Notes |
| ----- | ------ | ----- |
| none | none | No architecture debt created or closed. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| ----- | ---- | ---------------- | --------------- |
| 1 | Script type-check | `deno check .llm/tools/validation/check-close-gate.ts` | pass |
| 2 | False-closed fixture | `deno run --allow-env --allow-net .llm/tools/validation/check-close-gate.ts --repo rickylabs/netscript --issue 260 --pretty` | fail with unchecked `gate:e2e` |
| 3 | PR fixture | same script against this PR after creation | pass for issue #387 if acceptance is checked, or fail with concrete unchecked items |
| 4 | TS lint | scoped lint wrapper on the script file | pass |
| 5 | TS fmt | scoped fmt wrapper on the script file | pass |
| 6 | Claude mirror | sync + validate scripts | pass |
| 7 | Workflow YAML | `actionlint .github/workflows/ci.yml` if available, else manual review | pass/reviewed |

## Risks

- The PR fixture may fail if issue #387 itself still has unchecked acceptance. That is acceptable
  evidence; the close-gate should report the blocker instead of hiding it.

## Dependencies

- GitHub API access through `gh`/`GITHUB_TOKEN` for real fixture validation.

## Drift Watch

- Missing docs overlay path in activation docs.
- Existing draft close-gate text that needs refinement rather than replacement.
