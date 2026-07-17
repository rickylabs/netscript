# Worklog: beta.10 release union

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `chore-reconcile-main-into-beta10--release-union` |
| Branch | `chore/reconcile-main-into-beta10` |
| Archetype | N/A — release-integration tooling reconciliation |
| Scope overlays | docs/tooling |

## Design

### Public Surface

- No new public surface; preserve the merged routing, CLI, skills, and MCP surfaces.

### Domain Vocabulary

- Review-pairing ladder — `review_codex*` routes retained from integration.
- Restored non-review routes — Fable-based #784 state taken from main.
- Release union — merge result of `d962502f` and `origin/main`.

### Ports and Constants

- No new ports or constants. Existing routing contracts remain authoritative.

### Commit Slices

| # | Slice | Gate | Files |
| - | ----- | ---- | ----- |
| 1 | Form and prove the semantic release union. | agentic tests, MCP smoke, root check, changed-file quality scan | merge conflicts plus this run directory |

### Deferred Scope

- Independent evaluator passes and PR merge, per owner instruction.

### Contributor Path

Inspect the merge commit, then compare `.llm/tools/agentic/runtime/routing-policy.ts` with
`.llm/harness/workflow/lane-policy.md` and the routing-policy tests.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-07-17 | 1 | bootstrap | Fetched `origin/main`; confirmed clean `d962502f` baseline and three missing commits. |
| 2026-07-17 | 1 | merge | Merged `origin/main`; resolved seven conflicts as semantic unions. |
| 2026-07-17 | 1 | reconcile | Preserved #794 review pairings and formal evaluator; accepted #784 non-review restoration and #779 OpenCode lane. No related issue state was mutated. |
| 2026-07-17 | 1 | gate | Updated the routing-state snapshot after the first agentic run exposed the new OpenCode evaluation row; rerun passed. |

## Gate Results

### Static Gates

| Gate | Command | Result | Notes |
| --- | --- | --- | --- |
| Agentic runtime/config | `deno test --no-lock -A .llm/tools/agentic/runtime/ .llm/tools/agentic/config/` | PASS | First run: 152 pass / 1 stale snapshot failure; fixed union snapshot. Rerun: 153 pass / 0 fail. |
| Root check | `deno task check` | PASS | Scoped repository wrapper completed with exit 0. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Code quality, repository | PASS | `deno task quality:scan` | No findings; seven existing allow records reported. |
| Code quality, changed files | PASS | `deno task quality:scan --changed-file <each changed TS file>` | `mode=changed-files`; no findings and no allowances. |
| Doctrine | PASS | `deno task arch:check` | Exit 0; existing warnings only. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| `packages/mcp` | PASS | `cd packages/mcp && deno task test` | 40 pass / 0 fail. |

### Invariant Checks

| Check | Result | Notes |
| --- | --- | --- |
| Forbidden temporary routing condition | PASS | Repository-wide exact search returned no matches. |
| Conflict markers | PASS | No conflict markers remain in any resolved file. |

## Handoff Notes

- Verify all `review_codex*` ladder routes and all non-review #784 restorations independently.
- Formal IMPL-EVAL remains intentionally undispatched; do not treat these generator gates as a
  harness evaluator verdict.
