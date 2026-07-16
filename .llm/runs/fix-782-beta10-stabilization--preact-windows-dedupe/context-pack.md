# Context Pack: fix #782 — Preact Windows dedupe

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `fix-782-beta10-stabilization--preact-windows-dedupe` |
| Branch | `fix/782-beta10-stabilization` |
| Current phase | `evaluate` |
| Archetype | `4 — Public DSL / Builder` |
| Scope overlays | `frontend` |

## Current State

Issue #782 is implemented at the `@netscript/fresh/vite` owner boundary. The plugin now returns
Preact dedupe, delegates all required Preact specifier forms with `skipSelf`, preserves resolution
metadata, and normalizes only the final ID. Focused and full Fresh runtime gates are green. Required
package gates are complete, with unrelated baseline quality/doc debt explicitly attributed.

## Completed

- Read requested skills, harness activation/run-loop/lane policy, Archetype 4 profile, frontend
  overlay, relevant doctrine, debt, and templates.
- Read issue #782 and all comments through the required GitHub token resolver/API.
- Read the linked consumer proof in eis-chat PR #150.
- Ran `deno doc` before broad Fresh source reads and `deno task deps:why vite`.
- Reproduced the missing delegated normalization before implementation.
- Recorded research, plan, Design checkpoint, and evaluator ownership.
- Opened draft PR #789 against `feat/beta10-integration` with the required labels and milestone.
- Proved the new regression red before changing framework code, then green after implementation.
- Passed 9 focused Vite tests and all 199 Fresh package tests.
- Passed scoped check/lint/fmt, scoped changed-source quality, root architecture, Fresh doctrine,
  and publish dry-run gates.

## In Progress

- S1 commit/push and supervisor-owned IMPL-EVAL handoff.

## Next Steps

1. Commit/push S1 and update PR #789 body plus implementation evidence comment.
2. Supervisor runs separate-session IMPL-EVAL and any native-Windows acceptance evidence.
3. Keep the PR draft and do not merge until the close gate is satisfied.

## Key Decisions

| Decision | Source | Notes |
| -------- | ------ | ----- |
| Preact-only resolver policy | issue #782 + plan D1 | Avoids unsafe generalization. |
| Delegate then normalize `id` | consumer PR #150 + plan D2/D3 | Preserves normal Vite behavior and metadata. |
| Production build fixture | issue acceptance + plan D6 | Cross-platform controlled slash-variant graph. |
| No evaluator dispatch | owner directive | Supervisor owns both passes. |

## Files Changed

| Path | Status | Notes |
| ---- | ------ | ----- |
| `.llm/runs/fix-782-beta10-stabilization--preact-windows-dedupe/` | new | Harness bootstrap, research, plan, design, context, drift. |
| `packages/fresh/src/application/vite/vite.ts` | changed | Preact dedupe and delegated normalized resolver. |
| `packages/fresh/src/application/vite/vite.test.ts` | changed | Config, resolver, and production module-identity regressions. |
| `packages/fresh/src/application/vite/README.md` | changed | Dedupe-versus-path-canonicalization rationale. |

## Gates

| Gate family | Current status | Evidence |
| ----------- | -------------- | -------- |
| Static | PASS | Scoped check/lint/fmt: 164 files, zero findings; publish dry-run PASS. |
| Fitness | PASS with attributed baseline debt | Changed-source quality 0 findings; `arch:check` PASS; Fresh doctrine 0 failures. |
| Runtime | PASS | Focused 9/9; Fresh 199/199. |
| Consumer | PASS | Alias and merged dedupe/config coverage; external workaround mirrored. |

## Open Questions

- None that block handoff. Native Windows browser/build evidence may be added by supervisor/CI.

## Drift and Debt

- Drift: evaluator dispatch/daemon attachment are supervisor-owned; Linux Vite pre-normalized the
  controlled build ID, so the direct hook simulation is the deterministic red evidence.
- Debt: none created or deepened. Repository quality findings and route doc-lint residue are
  pre-existing, unchanged, and outside this slice.

## Commits

- See the draft PR's commit list + per-slice PR comments after S0 opens it.
