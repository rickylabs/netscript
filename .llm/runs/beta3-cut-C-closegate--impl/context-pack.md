# Context Pack: close-gate verified acceptance

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `beta3-cut-C-closegate--impl` |
| Branch | `chore/close-gate-387` |
| Current phase | `implement` |
| Archetype | `N/A - process/tooling` |
| Scope overlays | `docs` |

## Current State

The close-gate docs, Deno checker, CI job, override label, AGENTS pointer, and Claude skill mirror
are implemented locally. Validation has run except for pre-merge execution of the GitHub Actions job.

## Completed

- Read requested skills: netscript-harness, netscript-pr, netscript-tools, netscript-doctrine, rtk.
- Read harness activation/run-loop, archetype selection, gate matrix, plan-gate, plan protocol, and
  docs overlay.
- Confirmed #260 is a real false-closed fixture with unchecked acceptance/gate boxes.
- Planned one implementation slice.
- Implemented `.llm/tools/validation/check-close-gate.ts`.
- Wired `.github/workflows/ci.yml` close-gate job.
- Updated `.agents/skills/netscript-pr/SKILL.md`, `.claude/skills/netscript-pr/SKILL.md`,
  `.github/labels.yml`, and `AGENTS.md`.
- Ran type-check, no-config lint, fmt wrapper, Claude sync/check, and #260 real fixture.

## In Progress

- Commit, push, PR creation, PR fixture run, and implementation phase comment.

## Next Steps

1. Commit the slice.
2. Push `HEAD:refs/heads/chore/close-gate-387`.
3. Open/update PR with required body, labels, and milestone.
4. Run close-gate against the PR and post implementation evidence.

## Key Decisions

| Decision | Source | Notes |
| -------- | ------ | ----- |
| Only acceptance/gate sections count | plan | Prevents unrelated checklists from blocking. |
| `status:close-gate-override` bypass | user prompt | Auditable exception path. |

## Files Changed

| Path | Status | Notes |
| ---- | ------ | ----- |
| `.llm/runs/beta3-cut-C-closegate--impl/` | new | Harness artifacts. |
| `.llm/tools/validation/check-close-gate.ts` | new | GitHub close-gate checker. |
| `.github/workflows/ci.yml` | changed | Adds PR close-gate job and read permissions. |
| `.agents/skills/netscript-pr/SKILL.md` | changed | Canonical close-gate convention and override label. |
| `.claude/skills/netscript-pr/SKILL.md` | changed | Generated mirror. |
| `.github/labels.yml` | changed | Adds `status:close-gate-override`. |
| `AGENTS.md` | changed | Adds pointer to canonical close-gate rule. |

## Gates

| Gate family | Current status | Evidence |
| ----------- | -------------- | -------- |
| Static | pass/partial | `deno check`, `deno lint --no-config`, fmt wrapper, Claude validation passed; actionlint unavailable. |
| Fitness | pass | Source alignment/scope separation reviewed. |
| Runtime | N/A | No runtime behavior. |
| Consumer | reviewed | CI workflow cannot be executed before merge. |

## Open Questions

- None.

## Drift and Debt

- Drift: activation doc points to a stale docs overlay path.
- Debt: none.

## Commits

- See `.llm/runs/beta3-cut-C-closegate--impl/commits.md` plus PR commits/comments per coordinator
  instruction.
