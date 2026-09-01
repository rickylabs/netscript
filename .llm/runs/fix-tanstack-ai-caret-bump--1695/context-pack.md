# Context Pack: TanStack AI coherent family bump

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-tanstack-ai-caret-bump--1695` |
| Branch | `deps/tanstack-ai-caret-bump` |
| Current phase | `cycle-1 repair complete; awaiting supervisor-dispatched IMPL-EVAL cycle 2` |
| Archetype | `4 - Public DSL / Builder` |
| Scope overlays | `none` |
| Draft PR | `#1832` |

## Current State

The coherent TanStack family move is implemented against stable 0.52 and merged once with
`f59874abd2bc39446b21f5126323e0d2dcbce547`, preserving #1829's nested TokenUsage behavior. IMPL-EVAL
cycle 1 returned `FAIL_IMPL` at evaluator commit `220f4b50313fd9116d18288b12fc0ebe3d27346a`
for two bounded integration artifacts: the stale private Fresh UI lock and stale Zod-boundary prose.
Both are repaired. The evaluator's minimum gate set, the five-lock sweep, and the final root suite
are green. No IMPL-EVAL cycle 2 has been run by this implementation session.

## Completed

- Authoritative `deps:latest` lookup and coherent direct-family move to core `0.52.0`, Anthropic
  `0.18.3`, MCP `0.3.8`, and OpenAI `0.22.3`.
- Fresh's second core pin and AI-Preact peer aligned to prevent two core versions in one graph.
- TanStack 0.52 activity-context, tool-end, usage-array, canonical-usage identity, and finish-reason
  metadata changes adapted behind the owned chat bridge.
- #1829's three usage test blocks retained byte-identical while all three pass.
- Scaffolded AI-MCP specifier aligned to the new family.
- Root-lock Zod residual checker narrowed, fail-closed, to the sole kvdex v3 boundary.
- One-time final main integration and complete post-integration gate pass.
- IMPL-EVAL cycle 1 consumed without self-evaluation.
- `packages/fresh-ui/deno.lock` regenerated through its documented `lock:update` task; frozen check
  now passes.
- Canonical Zod boundary prose rewritten to the post-0.52 graph and #1320 blocker.
- Every tracked `deno.lock` enumerated; no pre-bump TanStack entry remains in an active specifier or
  npm resolution key.
- Cycle-1 minimum gates and final repository test pass with real captured exits.

## In Progress

- Harness/PR handoff for the completed cycle-1 repair.

## Next Steps

1. Commit and push the bounded cycle-1 repair by explicit refspec.
2. Update draft PR #1832 scope and post captured phase evidence.
3. Stop for supervisor-dispatched IMPL-EVAL cycle 2. Do not change readiness or labels.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Stable targets come only from `deps:latest` | owner + toolchain skill | Never inferred from `deno outdated --latest`. |
| PLAN-EVAL N/A | plan + cycle-1 evaluator | Upheld as an honest bounded/mechanical dependency adaptation. |
| #1829 assertions remain authoritative | owner + evaluator | Adapter changed; merged test blocks did not. |
| Nested Fresh UI lock is forced scope | IMPL-EVAL F1 | Root lock cannot govern the package's private frozen lock. |
| Zod prose follows the fail-closed checker | IMPL-EVAL F2 | One v3 parent remains; #1320 stays out of scope. |
| Historical probe evidence remains immutable | all-lock sweep | Its old strings are workspace-link metadata, not active specifiers or npm resolutions. |
| IMPL-EVAL external | owner | Cycle 2 is supervisor-dispatched after this report. |

## Files Changed

| Path | Notes |
| --- | --- |
| `.llm/runs/fix-tanstack-ai-caret-bump--1695/*` | Plan, worklog, drift, context, and evaluator evidence. |
| `packages/ai/deno.json` | Four coherent stable caret pins. |
| `packages/fresh/deno.json` | Second core pin plus compatible AI-Preact peer. |
| `deno.lock` | Root TanStack family closure. |
| `packages/fresh-ui/deno.lock` | Private frozen graph regenerated to the same family. |
| `packages/ai/src/adapters/tanstack-chat-client.ts` | 0.52 activity/event/usage compatibility. |
| `packages/ai/tests/tanstack_chat_client_test.ts` | Leaf regressions plus byte-unchanged #1829 cases. |
| `packages/cli/src/kernel/adapters/scaffold/import-resolver.ts` and test | Generated AI-MCP specifier alignment. |
| `.llm/tools/deps/check-zod-alignment.ts` and test | Removed obsolete AG-UI v3 residual. |
| `docs/architecture/zod-dependency-boundary.md` | Post-0.52 Zod graph and #1320 condition. |

## Cycle 1 Repair Gates

| Gate | Result |
| --- | --- |
| Fresh UI `lock:update` | RC 0; 150 files, 2 batches, 0 failed |
| `deps:check:zod` | RC 0; sole v3 residual `@olli/kvdex@3.6.7` |
| `TanStack usage:` filter | RC 0; 3 passed, 0 failed |
| #1829 block comparison | RC 0; all three byte-identical to `f59874abd` |
| Fresh UI frozen check | RC 0; 150 files, 2 batches, 0 failed |
| Five-lock resolution sweep | RC 0; 0 stale active specifiers/resolutions |
| Root `deno task test` | RC 0; `exitCode=0`, `processFailure` absent, 4,444 passed, 0 failed, 19 ignored |

## Drift and Debt

- Significant forced drift: the private Fresh UI lock and canonical Zod prose joined scope after
  IMPL-EVAL exposed the root-lock/scoped-gate blind spot. Recorded in `drift.md`.
- #1320 remains deferred; narrowing the residual boundary does not collapse Zod instances.
- No new architecture debt accepted.

## Commits

- See the draft PR's commit list plus per-slice PR comments; V3 has no `commits.md`.
