# Worklog: TanStack AI coherent family bump

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-tanstack-ai-caret-bump--1695` |
| Branch | `deps/tanstack-ai-caret-bump` |
| Archetype | `4 - Public DSL / Builder` |
| Scope overlays | `none` |

## Design

### Public Surface

- No `@netscript/ai` export or signature changes are planned.
- Existing `@tanstack/ai*` types stay confined behind owned provider, chat-client, and MCP ports.

### Domain Vocabulary

- No new domain types. Existing `ChatClientPort`, `ModelProviderPort`, and `McpTransportPort`
  remain the anti-corruption boundary.

### Ports

- No new ports. Existing ports already isolate every upgraded external dependency.

### Constants

- No new runtime constants. Dependency versions live only in `packages/ai/deno.json` and the lock.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 1 | Prove the full TanStack AI dependency family resolves and preserves the owned adapter contract. | dependency latest/audit, scoped check/test/lint/fmt, JSR/publish, quality gate, lock review; repeat after final merge | `packages/ai/deno.json`, `deno.lock`, any objectively required `packages/ai` adapter/test fix, and this run directory |

### Deferred Scope

- `@tanstack/ai-preact` and `packages/fresh` — not in #1695's four-package family.
- Existing JSR/doc/cardinality warnings — unchanged baseline, not dependency remediation.
- IMPL-EVAL — explicitly supervisor-dispatched after PR handoff.

### Contributor Path

Future TanStack upgrades start at `packages/ai/deno.json`, inspect the only upstream call sites under
`packages/ai/src/adapters/` and `src/mcp/adapters/tanstack-connector.ts`, then run the package's
owned-port tests before accepting the lock delta.

## PLAN-EVAL Assessment

`PLAN-EVAL: N/A`. This is one bounded dependency-family slice with authoritative stable targets,
locked file boundaries, explicit acceptance criteria, and objective compatibility gates. Research
found no unresolved architecture, sequencing, scope, or trade-off decision: the imported factory
signatures remain compatible, catalog removals do not hit used model IDs, and any source adjustment
is confined to the already-named adapter boundary.

## Authoritative Stable-Version Output

Command (captured with `out=$(cmd 2>&1); rc=$?`):

```text
Task deps:latest deno run --allow-read --allow-net .llm/tools/deps/latest.ts --pretty --behind-only '--filter' '@tanstack/ai*'
deps:latest — 5 behind / 5 total

  ✗ npm:@tanstack/ai  ^0.39.0  →  0.52.0
  ✗ npm:@tanstack/ai-anthropic  ^0.15.13  →  0.18.3
  ✗ npm:@tanstack/ai-mcp  0.2.1  →  0.3.8
  ✗ npm:@tanstack/ai-openai  ^0.15.10  →  0.22.3
  ✗ npm:@tanstack/ai-preact  ^0.10.1  →  0.14.4
RC=0
```

The fifth row is observed but intentionally outside this leaf because its pin is in
`packages/fresh/deno.json`.

## Breaking-Change Audit

- `deno doc` new surface checked: core `chat`, `EventType`, `AnyTextAdapter`, `StreamChunk`,
  `AnyTool`, `ContentPart`, `JSONSchema`, `ModelMessage`, `ToolCall`; provider
  `openaiCompatible`, `anthropicText`, `createAnthropicChat`; MCP root and `/stdio` surfaces.
- Changelog/release notes checked: current official TanStack/ai changelogs for core, Anthropic,
  OpenAI, and MCP from each old pin through each target. Relevant breaking notes were mapped to
  NetScript call sites; Anthropic's removed model IDs are not used, and core wire-only changes do
  not replace the in-process events consumed by the bridge.
- Call-site audit checked: every static/dynamic `@tanstack/ai*` use under `packages/ai`, plus model
  IDs in `packages/ai`, `packages/plugin-ai-core`, and `plugins/ai`. The existing adapter factories
  match the new documented signatures.
- Conclusion before implementation: no known source change was visible from the named factory
  surfaces. The upgraded compiler then found four core event/activity contract changes, documented
  under Implementation below; they were handled at the existing anti-corruption boundary. The
  standalone new MCP `/stdio` doc resolution returned RC 1, so upgraded package check/tests remained
  a mandatory proof point and passed.

## Baseline Lock State

```text
packages/ai/deno.json: @tanstack/ai ^0.39.0
packages/ai/deno.json: @tanstack/ai-anthropic ^0.15.13
packages/ai/deno.json: @tanstack/ai-mcp 0.2.1
packages/ai/deno.json: @tanstack/ai-openai ^0.15.10
deno.lock resolved core 0.39.0, Anthropic 0.15.13, MCP 0.2.1, OpenAI 0.15.10
```

## Progress Log

| Time (UTC) | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-31T05:04:12Z | 1 | bootstrap/research | Verified exact base/branch, current `origin/main`, stable targets, upstream APIs/changelogs, call sites, and JSR baseline without merging main. |
| 2026-08-31T05:11:50Z | 1 | implementation | Moved all four pins, resolved the lock normally with `deno install` RC 0, adapted the 0.52 activity/event types at the existing bridge, and added focused tool-end/AG-UI-usage regressions. |
| 2026-08-31T05:15:20Z | 1 | final freeze | Fetched and merged `origin/main` `26e1b486f95aec121d71f2f4cd0411dc6069af04` exactly once, then reran the full gate set at merge head `cf1e5091bc5af990fd9a7daf78440d975d9de920`. |

## Implementation

- `@tanstack/ai` `0.52` makes the inferred activity `context` non-null. The bridge now supplies an
  empty provider-invisible object only when the owned optional context is absent; `metadata` remains
  absent, preserving the public contract and wire-isolation test.
- `TOOL_CALL_END` no longer carries `toolCallName`/`toolName`. The bridge now obtains the name solely
  from the preceding `TOOL_CALL_START` entry, with a focused regression proving the streamed name and
  arguments survive.
- `RUN_FINISHED.usage` may now be AG-UI `SpecTokenUsage[]`. The bridge uses TanStack's exported
  `fromSpecTokenUsage` conversion before projecting NetScript's three owned usage fields; a focused
  regression covers the array form.
- No provider factory, MCP connector, model ID, or public NetScript contract needed an API change.

## Lock Delta Before Final Merge

Normal resolution command: `deno install`, captured RC 0. It emitted the expected out-of-scope peer
warning because `packages/fresh` still pairs `@tanstack/ai-preact@0.10.1` with its own core `^0.39.0`
pin; this leaf did not touch either Fresh pin.

```text
deno.lock | 151 ++++++++++++++++++++++++++++++++++++++------------------------
1 file changed, 93 insertions(+), 58 deletions(-)

- npm:@tanstack/ai@0.39
+ npm:@tanstack/ai@0.52
- npm:@tanstack/ai-anthropic@~0.15.13
+ npm:@tanstack/ai-anthropic@~0.18.3
- npm:@tanstack/ai-mcp@0.2.1
+ npm:@tanstack/ai-mcp@~0.3.8
- npm:@tanstack/ai-openai@~0.15.10
+ npm:@tanstack/ai-openai@~0.22.3
```

The remaining closure movement is attributable to the four packages' peer/transitive graph,
including `@tanstack/ai-event-client` `0.11.2` and `@tanstack/ai-utils` `0.4.0`; the old `0.39`
closure remains where the untouched Fresh package still requires it.

At the integrated head, the leaf delta against `origin/main` is:

```text
deno.lock | 152 ++++++++++++++++++++++++++++++++++++++------------------------
1 file changed, 94 insertions(+), 58 deletions(-)
```

The extra insertion is the exact `npm:@tanstack/ai@0.52.0` resolution used while inspecting the
new exported surface. The four owned resolution lines remain exactly those shown above.

## Post-Edit Stable-Version Output

```text
Task deps:latest deno run --allow-read --allow-net .llm/tools/deps/latest.ts --pretty --behind-only '--filter' '@tanstack/ai*'
deps:latest — 2 behind / 5 total

  ✗ npm:@tanstack/ai  ^0.39.0  →  0.52.0
  ✗ npm:@tanstack/ai-preact  ^0.10.1  →  0.14.4
RC=0
```

Both remaining rows come from untouched `packages/fresh/deno.json`; none of the four owned
`packages/ai` imports remains behind.

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Upgrade four pins coherently to the `deps:latest` stable releases | Avoid incompatible 0.x peer families | brief + dependency toolchain |
| PLAN-EVAL N/A | No material decision remains after research | `plan.md`, plan-gate checklist |
| Merge main once only at final freeze | Intermediate integration invalidates evidence | owner correction |
| Adapt core 0.52 at the existing bridge | Compiler identified required activity context, name-less tool-end events, and usage arrays | scoped check + `deno doc` |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Run ID uses launcher `fix-` name instead of brief's stale `deps-` name | minor | yes |
| `rtk` binary unavailable on this host; raw read-only commands used | minor | yes |
| Core stable advanced from brief example 0.48.0 to authoritative 0.52.0 | minor | yes |
| Final `origin/main` advanced beyond the corrected brief hash to `26e1b486f` | minor | yes |

## Gate Results

### Baseline Research Gates

| Gate | Result | Notes |
| --- | --- | --- |
| `deps:latest --filter '@tanstack/ai*'` | PASS (RC 0) | Raw output above. |
| `doc:lint --root packages/ai --pretty` | BASELINE FAIL (RC 1) | Existing per-entrypoint private-type-ref diagnostics; combined summary reports zero. |
| JSR fitness audit | PASS with 2 baseline warnings (RC 0) | `src/ports` cardinality and slow-types banner. |
| package publish dry-run | PASS with 3 baseline warnings (RC 0) | Existing unanalyzable dynamic imports in the MCP connector. |

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| upgraded package check | structured check wrapper | PASS (RC 0) | 101 TypeScript files; includes `--unstable-kv`. |
| upgraded package tests | structured test wrapper | PASS (RC 0) | 149 passed, 0 failed. |
| upgraded package lint | structured lint wrapper | PASS (RC 0) | 101 files, no findings. |
| upgraded package format | structured fmt wrapper | PASS (RC 0) | 101 files, no findings. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| F-1..F-19 | PASS (RC 0) | `deno task quality:gate` | Repository quality and architecture checks pass; existing warnings remain non-blocking. |
| F-6 JSR audit | PASS (RC 0) | package fitness audit | Same two baseline warnings: `src/ports` cardinality and slow-types. |
| F-6 publish dry-run | PASS (RC 0) | package task | Same three existing MCP dynamic-import warnings. |
| doc lint | BASELINE FAIL (RC 1) | package doc wrapper | Same inconsistent baseline: combined summary zero, per-entrypoint private-type diagnostics. |
| dependency audit | PASS (RC 0) | `deno task deps:audit` | Tool reports existing workspace advisories but exits zero at configured low level. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| package semantic/MCP tests | PASS (RC 0) | scoped structured test wrapper | 149 passed; no external provider credentials required. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| current `origin/main` package call sites | PASS (RC 0) | final integrated check/tests | Current main's OpenAI Responses changes are included; 152 tests pass. |

### Final Integrated-Head Gates

All commands below used `out=$(cmd 2>&1); rc=$?`; no pipeline supplied a verdict.

| Gate | Result | Integrated-head evidence |
| --- | --- | --- |
| `deps:latest --filter '@tanstack/ai*'` | PASS (RC 0) | Only the two untouched Fresh rows remain; raw output matches Post-Edit Stable-Version Output above. |
| structured package check | PASS (RC 0) | 101 files, zero diagnostics, `--unstable-kv`. |
| structured package tests | PASS (RC 0) | 152 passed, 0 failed. |
| structured package lint | PASS (RC 0) | 101 files, zero findings. |
| structured package format | PASS (RC 0) | 101 files, zero findings. |
| `deno task quality:gate` | PASS (RC 0) | Quality scan, dependency checks, architecture/doctrine checks pass. |
| JSR package audit | PASS (RC 0) | Same two baseline warnings; 101 files / 21 test files. |
| package publish dry-run | PASS (RC 0) | Same three existing MCP dynamic-import warnings. |
| `deno task deps:audit` | PASS (RC 0) | Existing workspace advisories reported at configured low level. |
| package doc lint | BASELINE FAIL (RC 1) | Unchanged: combined summary zero, same per-entrypoint private-type diagnostics. |
| lock review | PASS | 152-line leaf delta; exact old/new family lines recorded above. |
| sibling boundary | PASS | No diff for `packages/plugin-workers-core/deno.json` or `plugins/triggers/deno.json`. |

## Handoff Notes

- IMPL evaluator should first inspect the four pin/lock lines, the before/after lock evidence, and
  the full post-merge captured-RC gate table.
- PR #1832 remains in `status:impl`; this implementation session did not dispatch or perform
  IMPL-EVAL.
