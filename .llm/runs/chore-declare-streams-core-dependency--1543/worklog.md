# Worklog: declare the plugin-streams-core dependency

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `chore-declare-streams-core-dependency--1543` |
| Branch | `chore/declare-streams-core-dependency` |
| Archetype | `3 - Runtime/Behavior`; `5 - Plugin Package` |
| Scope overlays | none |

## Design

### Public Surface

- No exported function, type, entry point, or runtime behavior changes.
- The only contract is manifest readability: every member directly importing
  `@netscript/plugin-streams-core` declares it.

### Domain Vocabulary

- None introduced; this is manifest consistency only.

### Ports

- None introduced.

### Constants

- Existing exact dependency specifier: `jsr:@netscript/plugin-streams-core@0.0.6`.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 1 | Prove both direct consumers explicitly declare the established streams-core dependency | requested static, architecture, generated-corpus, and publish gates | two manifests plus run artifacts; `deno.lock` only if resolution moves |

### Deferred Scope

- Undeclared cross-package import fitness check — publishing is unaffected, so acceptance box 3 is
  N/A and a new gate would exceed the slice.
- Existing doctrine Refactor work — unrelated to manifest consistency.

### Contributor Path

When adding a direct `@netscript/*` import, mirror the exact stable JSR specifier already used by a
sibling consumer in that workspace member's `deno.json` imports map.

## PLAN-EVAL

`N/A` — mechanical two-line manifest consistency change. The issue, owner brief, established
sibling pattern, scope boundaries, and gate set fully lock the decision; there is no architecture,
sequencing, or trade-off question for a separate evaluator.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-09-01 | S1 | research | Re-baselined at `38f2ce735`; verified both omissions, all six import sites, and sibling pattern. |
| 2026-09-01 | S1 | baseline gate | `deno task publish:dry-run` passed with `REAL_EXIT=0`; omission is silently accepted. |
| 2026-09-01 | S1 | implementation | Added the exact established dependency declaration to both manifests. |
| 2026-09-01 | S1 | lock review | Retained exactly two new workspace dependency-list lines in `deno.lock`, one for each touched member. |
| 2026-09-01 | S1 | gates | All slice-owned gates passed; `check:mcp-export-corpus` failed identically in a detached base probe. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Declare in both manifests | Direct dependencies should be explicit and consistent despite workspace fallback. | issue #1543 and `plugins/workers/deno.json` |
| Do not add a fitness check | Publishing succeeds; conditional acceptance box 3 is N/A. | base dry-run `REAL_EXIT=0` |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| MCP export corpus was already stale at the base | minor | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| Base publish | `deno task publish:dry-run` | PASS (`REAL_EXIT=0`) | Silently accepts omitted declarations; no relevant warning. |
| Root check | `deno task check` | PASS (`REAL_EXIT=0`) | 2,996 files; 25 batches; zero failed batches. |
| Scoped check | `run-deno-check.ts --root packages/plugin-workers-core --root plugins/triggers --ext ts,tsx` | PASS (`REAL_EXIT=0`) | 189 files; two batches. |
| Scoped lint | `run-deno-lint.ts --root packages/plugin-workers-core --root plugins/triggers --ext ts,tsx` | PASS (`REAL_EXIT=0`) | 189 files; zero findings. |
| Scoped format | `run-deno-fmt.ts --root packages/plugin-workers-core --root plugins/triggers --ext ts,tsx --ignore-line-endings` | PASS (`REAL_EXIT=0`) | 189 files; zero findings. |
| Generated agent docs | `deno task check:agent-docs-prose` | PASS (`REAL_EXIT=0`) | Corpus fresh. |
| Generated asset barrels | `deno task check:assets-barrel` | PASS (`REAL_EXIT=0`) | No generated diff. |
| Generated publish assets | `deno task check:publish-assets` | PASS (`REAL_EXIT=0`) | Fresh. |
| MCP export corpus | `deno task check:mcp-export-corpus` | FAIL (`REAL_EXIT=1`) | Same `REAL_EXIT=1` at untouched base `38f2ce735`; fixing requires forbidden `packages/mcp` scope. |
| Final publish | `deno task publish:dry-run` | PASS (`REAL_EXIT=0`) | Workspace dry-run completes successfully after declarations. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| F-6 | PASS | base publish dry-run | Publishing is unaffected. |
| Code quality | PASS | `deno task quality:scan` → `REAL_EXIT=0` | Zero findings; seven pre-existing reviewed allowances. |
| Architecture | PASS | `deno task arch:check` → `REAL_EXIT=0` | Existing warnings only; zero failures. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Runtime behavior | N/A | manifest-only diff | No runtime code or behavior changes. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Workspace consumers | PASS | root and scoped checks | Resolution and all checked import surfaces compile. |

## Lockfile Evidence

`deno.lock` gained only these two lines in workspace-member dependency lists:

```diff
+          "jsr:@netscript/plugin-streams-core@0.0.6",
```

- One line is under `packages/plugin-workers-core`.
- One line is under `plugins/triggers`.
- No package/version stanza changed. The publish dry-run refreshed the lock's member dependency
  snapshots to represent the already-imported streams-core package; the explicit declarations now
  match that resolution graph.

## Acceptance Assessment

1. Publish evidence: PASS (`REAL_EXIT=0`) before and after the manifest additions; the omission was
   silently accepted, with no rejection or relevant warning.
2. Both manifests now declare the exact established dependency specifier.
3. Conditional undeclared-import fitness check: N/A because publishing is unaffected. No new gate
   was added.

## Reconcile Note — S1

- Issue #1543 remains open with `type:chore`, `area:deps`, `priority:p3`,
  `orchestrator:internals`, and milestone `0.0.7`; the PR will carry `Closes #1543`.
- No new issue or PR comments existed at implementation start.
- No scope readjustment is required.

## Handoff Notes

- Owner explicitly retains IMPL-EVAL and ready-for-review transition. Stop after opening the draft
  PR with gate evidence.
