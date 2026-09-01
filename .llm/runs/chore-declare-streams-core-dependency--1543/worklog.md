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
- The cycle-2 contract is manifest readability across the derived consumer set: every workspace
  member other than `packages/plugin-streams-core` itself with a static import or export module
  specifier rooted at `@netscript/plugin-streams-core` declares the exact dependency. String
  literals that merely name the package are reported separately and are not counted as module
  edges.

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
| 2 | Close the evaluator-found completeness gap across every remaining importing member | requested root/scoped/architecture/publish gates | four manifests, justified `deno.lock` refresh, and run artifacts |

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
| 2026-09-01 | S2 | evaluator intake | Preserved remote `FAIL_IMPL` commit `4f194dbb1`; accepted completeness and reference-kind findings. |
| 2026-09-01 | S2 | derivation | Confirmed three publishable gaps plus five genuine CLI E2E imports; excluded `definePlugin(...)` and other strings from module-edge counts. |
| 2026-09-01 | S2 | implementation | Added the established exact specifier to all four remaining importing member manifests. |
| 2026-09-01 | S2 | lock refresh | Root check added exactly one streams-core member-dependency line for each new manifest; no package/version stanza moved. |
| 2026-09-01 | S2 | gates | Required gates passed; initial lint traversal into a nested fixture workspace refused before corrected member scope passed. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Declare in both manifests | Direct dependencies should be explicit and consistent despite workspace fallback. | issue #1543 and `plugins/workers/deno.json` |
| Do not add a fitness check | Publishing succeeds; conditional acceptance box 3 is N/A. | base dry-run `REAL_EXIT=0` |
| Include `packages/cli/e2e` | Five scaffold-gate files contain genuine static imports; non-publishability changes impact, not consistency. | workspace-wide module-edge census |
| Exclude triggers public `definePlugin` string from import count | A package-name string is plugin metadata, not a module-resolution edge. | syntax-context inspection |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| MCP export corpus was already stale at the base | minor | yes |
| S1 claimed workspace-wide declaration completeness after searching only two members and counting a string literal as an import | significant | yes |

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
| S2 root check | `deno task check` | PASS (`REAL_EXIT=0`) | 2,996 files; 25 batches; zero failures; refreshed four lock member lists. |
| S2 scoped check | structured check over all six S1+S2 member roots | PASS (`REAL_EXIT=0`) | 614 files; six batches; zero failures. |
| S2 scoped lint, first attempt | structured lint over all six roots | FAIL (`REAL_EXIT=2`) | No lint findings; traversal entered nested non-workspace desktop fixture and could not resolve its separate `zod` catalog. |
| S2 scoped lint, member scope | same six roots with `packages/cli/e2e/fixtures/` excluded | PASS (`REAL_EXIT=0`) | 607 member files; six batches; zero findings or refusals; all five CLI E2E streams gate files included. |
| S2 scoped format | same corrected six-root member scope | PASS (`REAL_EXIT=0`) | 607 files; zero findings. |
| S2 dependency provenance | `deno task deps:why @netscript/plugin-streams-core` | PASS (`REAL_EXIT=0`) | Source-used, not dead; includes the five CLI E2E module imports. |
| S2 architecture | `deno task arch:check` | PASS (`REAL_EXIT=0`) | Existing warnings only; zero failures. |
| S2 code quality | `deno task quality:scan` | PASS (`REAL_EXIT=0`) | Zero findings; seven pre-existing reviewed allowances. |
| S2 publish | `deno task publish:dry-run` | PASS (`REAL_EXIT=0`) | Workspace dry-run completes successfully with all declarations. |

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

Cycle 2 added exactly four more copies of the same line:

```diff
+          "jsr:@netscript/plugin-streams-core@0.0.6",
```

Before the S2 refresh, the dependency arrays for `packages/sdk`, `packages/plugin-sagas-core`,
`packages/plugin-auth-core`, and `packages/cli/e2e` contained no streams-core entry. After the root
check refreshed resolution, each contains exactly one entry, placed in sorted lockfile order. No
specifier/version/package stanza or unrelated member dependency changed.

## Completeness Derivation

- Counted as dependency edges: static `import ... from`, `import type ... from`, and
  `export ... from` module specifiers rooted at `@netscript/plugin-streams-core`.
- Not counted: `definePlugin(...)` metadata strings, code-generation maps, diagnostic vendor/package
  fields, generated assets/prose, documentation examples, and streams-core's own self-references.
- `packages/cli/e2e`: evaluator correct — five real imports in five scaffold-gate files; now
  declared despite `publish:false` because consistency applies to the workspace member.
- `plugins/triggers/src/public/mod.ts:23`: owner correction accepted — a string reference, not a
  module import.
- Final result: every consumer workspace member with a derived static module edge now declares the
  exact `jsr:@netscript/plugin-streams-core@0.0.6` specifier; the source package is correctly not a
  dependency of itself.

## Acceptance Assessment

1. Publish evidence: PASS (`REAL_EXIT=0`) before and after the manifest additions; the omission was
   silently accepted, with no rejection or relevant warning.
2. Both manifests now declare the exact established dependency specifier.
   S2 additionally closes the same consistency gap in all four other importing members.
3. Conditional undeclared-import fitness check: N/A because publishing is unaffected. No new gate
   was added.

## Reconcile Note — S1

- Issue #1543 remains open with `type:chore`, `area:deps`, `priority:p3`,
  `orchestrator:internals`, and milestone `0.0.7`; the PR will carry `Closes #1543`.
- No new issue or PR comments existed at implementation start.
- No scope readjustment is required.

## Reconcile Note — S2

- IMPL-EVAL `4f194dbb1` returned `FAIL_IMPL`; its completeness and reference-kind findings were
  accepted, while its remote artifact was preserved before implementation resumed.
- Owner authorized expanding this PR to all four remaining importing workspace members and retained
  control of cycle-2 evaluation, draft state, and labels.
- The pre-existing MCP export-corpus drift remains unchanged and out of scope.

## Handoff Notes

- Owner explicitly retains IMPL-EVAL and ready-for-review transition. Stop after updating the draft
  PR with cycle-2 gate evidence.
