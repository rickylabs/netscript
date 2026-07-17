# Context Pack: generated Fresh Markdown clean-runner build

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `fix-790-md-hydration-ci--codex` |
| Branch | `fix/790-md-hydration-ci` |
| Current phase | `gate — awaiting own-PR check-test` |
| Archetype | `4 — Public DSL / Builder` |
| Scope overlays | `frontend` |

## Current State

The root cause is fixed at `@netscript/fresh/vite`: Fresh core's versioned Signals import now
converges on the generated app's pinned bare import-map entry, Signals is deduped beside Preact, and
future Markdown build failures print labeled stdout/stderr. A brand-new isolated Deno cache now
passes the production-build gate.

## Completed

- Loaded requested skills, harness workflow, doctrine, frontend overlay, and JSR rubric.
- Verified clean branch/base/worktree identity.
- Read GitHub job `87754952044` through the repository token resolver.
- Reproduced the failure with an isolated `DENO_DIR`.
- Locked the plan and Design checkpoint without source edits.
- Opened draft PR #797 with the required base, labels, milestone, and non-closing issue context.
- Captured a red focused resolver regression before implementation.
- Implemented and documented package-owned Signals canonicalization/dedupe.
- Passed clean-cache build, focused Markdown/Vite tests, all 200 Fresh tests, root/touched-root
  checks, lint/fmt, scoped quality, architecture, and publish dry-run.

## In Progress

- S1 evidence update, commit, explicit push, and PR `check-test` acceptance.

## Next Steps

1. Commit and explicitly push S1.
2. Update PR #797 body/comment with the complete evidence.
3. Wait for the PR's real `check-test` result; do not dispatch evals or merge.

## Key Decisions

| Decision | Source | Notes |
| -------- | ------ | ----- |
| Vite resolver is the owner | CI log + existing `@netscript/fresh/vite` Preact policy | Avoids a test-only cache warm-up. |
| Peer warning is non-causal | full job log | Do not broaden into dependency changes. |
| No evaluator dispatch | explicit owner constraint | This lane does not self-certify. |

## Files Changed

| Path | Status | Notes |
| ---- | ------ | ----- |
| `.llm/runs/fix-790-md-hydration-ci--codex/**` | new | Harness research, plan, design, and evidence. |
| `packages/fresh/src/application/vite/vite.ts` | changed | Signals canonicalization and dedupe at the owner boundary. |
| `packages/fresh/src/application/vite/vite.test.ts` | changed | Red/green resolver, boundary, metadata, and merged-dedupe coverage. |
| `packages/fresh/src/application/vite/README.md` | changed | Clean-cache hydration runtime policy. |
| `packages/fresh-ui/tests/registry/markdown-renderer.test.ts` | changed | Explicit command/stdout/stderr failure output. |

## Gates

| Gate family | Current status | Evidence |
| ----------- | -------------- | -------- |
| Static | pass | root check 2,304 files; touched-root check/lint/fmt clean |
| Fitness | pass with attributed baseline residue | scoped quality and architecture pass; `./vite` docs clean; publish dry-run pass |
| Runtime | pass | clean-cache build 1/1; Vite 10/10; Markdown 2/2; Fresh 200/200 |
| Consumer | pass locally; CI pending | generated Fresh production build passes from new cache; PR #797 `check-test` pending |

## Open Questions

- None blocking implementation.

## Drift and Debt

- Drift: evaluator dispatch reserved to supervisor; warm cache masked the failure; untouched
  repository quality/doc findings remain outside this slice.
- Debt: none planned.

## Commits

- See the draft PR's commit list + per-slice PR comments after S0.
