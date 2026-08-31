# Plan: recognize and complete the AI exports table

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `docs-ai-exports-heading-and-skills--1809` |
| Branch | `docs/ai-exports-heading-and-skills` |
| Phase | `implement` |
| Target | AI reference docs and exports-drift tooling |
| Archetype | N/A — no package implementation changes |
| Scope overlays | `SCOPE-docs.md` |

## Goal and Scope

- Rename the table heading to `## Exports`, add the missing `/skills` row without altering existing
  rows, and adopt AI into the authoritative export mapping.
- Regenerate the derived docs corpus in the owner-specified order and run every listed gate.

## Non-Scope

- Package source changes, new per-symbol sections, and the other #1777 packages.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Use `symbolCoverage.mode: 'entrypoints-only'`. | The 13-module `deno doc --json` audit finds real symbol omissions; `complete` would be inaccurate. |
| D2 | Describe `/skills` as validated parsing/loading plus tag/semantic matching and an in-memory source. | This directly reflects its 16 exported symbols. |
| D3 | Keep this as one mechanical implementation slice. | The docs row, checker adoption, generated corpus, and gates form one inseparable acceptance unit. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Add dedicated symbol sections | Safe to defer | Explicitly out of scope; the coverage reason records the gap. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Generated corpus becomes stale | Run all three generators in the required order and their four corpus checks. |
| Acceptance evidence loses leading backticks | Fetch issue #1809 and compare the four YAML `box` values character-for-character before PR creation. |
| Validation mutates `deno.lock` | Compare it directly with `origin/main` after all gates. |

## Doctrine and Debt

- A2/A14 apply: public-surface documentation must be simple and mechanically checked.
- No architecture debt is created or deepened.

## Validation Plan

Run every command listed in issue #1809, then report exact exit codes, exact porcelain status,
lockfile equality, and provenance ancestry at the final pushed head.

## PLAN-EVAL

`PLAN-EVAL: N/A` — mechanical, single-package documentation fix with one evidence-checkable coverage
choice and a complete owner-supplied gate contract.
