# Plan: remove fabricated plugin scaffolding references

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `docs-plugin-scaffolding-invents--1857` |
| Branch | `docs/plugin-scaffolding-invents-fix` |
| Phase | `implement` |
| Target | `docs/site/reference/{triggers,workers}/index.md` |
| Archetype | `5 - Plugin Package` (described surface only; no plugin source changes) |
| Scope overlays | `docs` |

## Doctrine and goal

Doctrine A1/A2 make the published surface the consumer contract. Correct the two reference pages so
their sub-path tables match the real manifests and `deno doc` surfaces. The current doctrine verdict
for both described plugins is Refactor, but this slice neither changes nor claims to resolve that debt.

## Scope

- Replace each false `/scaffolding` row with the real `/scaffold` export and `./scaffold.ts` path.
- Remove both unverifiable detail sections and fix nearby specifier prose.
- Regenerate the three derived documentation asset surfaces in the prescribed order.
- Preserve and commit this run directory.

## Non-Scope

- Plugin/package source, export maps, `AUTHORITATIVE_MAPPING`, other reference pages, remaining
  omissions, and the auth naming duplication.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Document `/scaffold` with one truthful table row and no new detail section. | Four shared named contracts are fully represented by a concise purpose; a new table would pad both pages. |
| D2 | Use `Refs #1857`, never a closing keyword. | This is step 1 and does not complete issue #1857. |
| D3 | Keep CI in the docs-only lane. | No runtime, scaffold output, or framework source changes occur. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Remaining omissions and authoritative mapping | safe to defer | Explicitly owned by later #1857 slices. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Generated asset drift | Regenerate prose, asset barrel, then publish assets; run all three checks. |
| False replacement prose | Ground the row in `deno.json`, source, and `deno doc --json`. |
| Baseline failure misattributed | Reproduce `check:mcp-export-corpus` in a clean `origin/main` worktree. |

## Debt and anti-pattern implications

- No architecture debt is created, deepened, or closed.
- Avoid false public-surface claims; do not alter implementation to conform to fabricated docs.

## Validation Plan

Run every command listed in the assignment, record real exit codes at the committed head, verify
base-relative diff whitespace, exact final status, lockfile equality, provenance ancestry, and the
known baseline-only MCP corpus failure.

## PLAN-EVAL

`N/A` — the defect is mechanical, falsifiable, already bounded, and has complete scope and gates.
