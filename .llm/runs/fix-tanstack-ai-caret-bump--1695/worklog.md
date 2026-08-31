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

## Post-#1829 Collision Integration — STOPPED ON GENUINE FINDING

On the owner's collision-guard release, `git fetch origin main` resolved then-current main to
`f59874abd2bc39446b21f5126323e0d2dcbce547`. A single merge invocation was made. It returned RC 1
with the expected conflicts in:

- `packages/ai/src/adapters/tanstack-chat-client.ts`
- `packages/ai/tests/tanstack_chat_client_test.ts`

Manual resolution analysis found that both intents require canonical `TokenUsage` objects to pass
through unchanged (preserving #1829's nested fields and object identity), while only TanStack 0.52's
new `SpecTokenUsage[]` form should go through `fromSpecTokenUsage`. The working-tree resolution was
prepared on that basis, retaining both the three #1829 tests and the two dependency-bump tests.

Before any further gate, #1829's own test filter was run with mandatory real exit capture:

```text
out=$(deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all --filter 'TanStack usage:' packages/ai/tests/tanstack_chat_client_test.ts 2>&1); rc=$?
summary: passed=2 failed=1 total=3
RC=1
```

The three named #1829 tests were:

1. `TanStack usage: a fully populated upstream object survives the owned boundary` — **FAIL**:
   expected `finishReason` `"stop"`, received `undefined`. The failure occurs before
   `assertCompleteUsage`, so the nested-detail/identity oracle is not reached.
2. `TanStack usage: the completeness oracle rejects the old core-only projection` — PASS.
3. `TanStack usage: an omitted upstream usage remains omitted` — PASS.

This is a genuine upstream-version interaction, not a test-infrastructure failure. TanStack 0.52's
chat/event path no longer round-trips the fixture's direct `RUN_FINISHED.finishReason` in the form
#1829 asserts; the 0.52 declarations document finish-reason restoration through TanStack metadata.
Per owner instruction, no workaround was applied and no remaining gate, merge commit, push, PR
transition, label change, or IMPL-EVAL was performed. The repository remains in the in-progress
merge state for coordinator direction.

### Required judgements

- **PLAN-EVAL:** remains honestly `N/A`. The original coherent dependency-family move was bounded
  by authoritative versions, fixed adapter scope, and objective compatibility gates; this new
  cross-PR failure is an implementation/evaluation finding requiring owner coordination, not an
  unmade pre-implementation architecture decision.
- **Usage/token-detail plausibility:** yes, the upstream change plausibly affects this flow. The
  actual conflict proves the old three-field projection would erase #1829's nested details, while
  0.52 additionally changes `RUN_FINISHED` event restoration behavior. Both must be evaluated
  together; the failed #1829 oracle is the stop signal.

## Held-Merge Read-Only Finish-Reason Investigation

The merge remains held at `MERGE_HEAD=f59874abd2bc39446b21f5126323e0d2dcbce547`. No source, test,
index, label, PR, commit, or remote state was changed during this investigation.

### Finding

**Round-tripping is possible, but not from the top-level field produced by the server-side
`chat()` iterable.** In 0.52 this path retains the value at
`RUN_FINISHED.metadata.tanstack.finishReason`.

Evidence:

1. `deno doc --filter RunFinishedEvent npm:@tanstack/ai@0.52.0` returned RC 0 and documents
   `finishReason` as restored from `metadata.tanstack`.
2. `deno doc --filter TanStackRunMetadata npm:@tanstack/ai@0.52.0` returned RC 0 and exposes the
   same `stop | length | content_filter | tool_calls | null` union at
   `metadata.tanstack.finishReason`.
3. Installed `normalize-stream-chunk.js` copies every defined incoming `chunk.finishReason` into
   `tanstack.finishReason`. The server-side chat public emitter then invokes `restorePublicUsage`,
   not `restoreInboundChunk`; only the latter copies TanStack metadata extras back to top-level
   fields. This explains why the top-level value is absent at NetScript's bridge.
4. A read-only `deno eval` probe fed `finishReason: "stop"` through the installed 0.52 `chat()` and
   returned RC 0 with the exact terminal event:

   ```json
   {"type":"RUN_FINISHED","threadId":"probe-thread","runId":"probe-run","usage":{"promptTokens":1,"completionTokens":2,"totalTokens":3},"metadata":{"tanstack":{"finishReason":"stop"}}}
   ```

Therefore 0.52 does **not** make the value irrecoverable. It genuinely exposes the value only via
metadata on this in-process server-side path, even though an inbound client/wire restoration path
can reconstruct the convenience top-level field.

### Minimal adapter sketch — not applied

The narrow resolution is a fallback at the existing `RUN_FINISHED` translation point:

```ts
finishReason: toFinishReason(
  chunk.finishReason ?? chunk.metadata?.tanstack?.finishReason,
),
```

Keep the top-level field first for compatibility with adapters/paths that still supply it; use the
typed TanStack metadata field only when it is absent. No test rewrite is required.

Risk is low and localized, with two points to verify after release: precedence is intentionally
top-level-first if malformed input supplies conflicting values, and provider-originated terminal
events must retain the same TanStack metadata through middleware. The installed normalization code
and the exact runtime probe both support the latter. A focused assertion should verify the fallback
and #1829's unchanged suite should remain the acceptance oracle.

### Meaning of the two passing #1829 tests

- `TanStack usage: the completeness oracle rejects the old core-only projection` is meaningful
  **test-sensitivity coverage**: it proves #1829's recursive/identity oracle would catch the exact
  lossy projection present on this branch before collision resolution. It does not itself exercise
  the bumped adapter.
- `TanStack usage: an omitted upstream usage remains omitted` is meaningful **absence-path
  integration coverage** under 0.52: optional usage is still preserved as absent through `chat()`
  and the bridge. It is incidental to nested-detail passthrough and says nothing about whether a
  populated usage object retains its leaves/identity.

Neither passing test substitutes for the blocked fully-populated test, whose finish-reason
assertion currently prevents the nested-detail oracle from running.

## Authorized #1829 Resolution and Workspace Integration

The owner authorized the low-risk 0.52 finish-reason fallback. The adapter now keeps the legacy
top-level field authoritative and falls back only when it is absent:

```ts
chunk.finishReason ?? chunk.metadata?.tanstack?.finishReason
```

The first post-fallback run of the three unchanged `TanStack usage:` tests reached #1829's deeper
identity assertion and returned RC 1 (2 passed, 1 failed): TanStack 0.52 normalizes a canonical
`TokenUsage` through AG-UI and reconstructs an equal object before yielding it publicly. The
adapter therefore uses a per-stream `ChatMiddleware` at the documented raw `onChunk` seam to retain
canonical usage by `runId`; the public `RUN_FINISHED` translation consumes that original object.
AG-UI `SpecTokenUsage[]` still goes through `fromSpecTokenUsage`. No #1829 assertion was changed.

After that compatibility repair, the required filter returned:

```text
exitCode=0; passed=3; failed=0; totalResults=3; CAPTURED_RC=0
```

The full focused file initially caught one stale assertion in this leaf's own AG-UI-array test: it
expected the formerly dropped finish reason to remain `undefined`. Only that leaf-owned assertion
was corrected to expect `stop`; the rerun returned `exitCode=0`, 5 passed, 0 failed, RC 0.

### Byte-identity proof for #1829's tests

Each complete `Deno.test(...)` block was extracted from merged SHA
`f59874abd2bc39446b21f5126323e0d2dcbce547` and from the resolved worktree, then compared and
SHA-256 hashed. The proof command returned RC 0:

| #1829 test | Bytes | Merged-main SHA-256 | Worktree SHA-256 | Equal |
| --- | ---: | --- | --- | --- |
| fully populated upstream object | 352 | `711a2bbbf000622cce807b53c94b7e5fb52415e3a3b079661f2416da655f557d` | `711a2bbbf000622cce807b53c94b7e5fb52415e3a3b079661f2416da655f557d` | yes |
| completeness oracle rejects projection | 338 | `76d4a4b9aa7e63741dbb59b8dd56d39b8e44d66113b653aabf95723517133bc1` | `76d4a4b9aa7e63741dbb59b8dd56d39b8e44d66113b653aabf95723517133bc1` | yes |
| omitted usage remains omitted | 269 | `ce0b193e6fc0a0c700070427ecd8c100fb2f87e5f678131d8c4f5c2f7e5ec629` | `ce0b193e6fc0a0c700070427ecd8c100fb2f87e5f678131d8c4f5c2f7e5ec629` | yes |

### Repo-wide gate finding and repair

The first resolved-tree `deno task test` returned a real `exitCode=1` / RC 1 with 4,439 passed,
5 failed, 19 ignored. `processFailure` was absent, so this was not a misleading 0/0 type-check
death. It exposed two integration gaps:

1. The docs snippet workspace rejected the conflicting `@tanstack/ai` ranges in `packages/ai`
   (`^0.52.0`) and `packages/fresh` (`^0.39.0`). Authoritative `deps:latest` reported the compatible
   stable Fresh pair as `@tanstack/ai@0.52.0` and `@tanstack/ai-preact@0.14.4`; the latter's package
   metadata requires peer `@tanstack/ai@^0.52.0`. Fresh has no executable imports of either package,
   so no Fresh call-site adaptation was required.
2. The scaffold import resolver still emitted `npm:@tanstack/ai-mcp@0.2.1`. Its owned constant and
   direct resolver tests now emit/assert `npm:@tanstack/ai-mcp@^0.3.8`.

The three former failure files were rerun together: `exitCode=0`, 32 passed, 0 failed, RC 0.

### Exact dependency lock movement

Before the one-time main integration, the dependency leaf's lock delta was exactly 152 lines:
94 insertions and 58 deletions. After aligning Fresh and integrating the then-current main, the
base-to-resolved-tree stat is 131 lines: 69 insertions and 62 deletions. The exact TanStack-family
package keys moved as follows (peer suffixes omitted here; the versions are copied from the lock
keys themselves):

| Lock package | Before | After |
| --- | --- | --- |
| `@tanstack/ai` | `0.39.0` | `0.52.0` |
| `@tanstack/ai-anthropic` | `0.15.13` | `0.18.3` |
| `@tanstack/ai-mcp` | `0.2.1` | `0.3.8` |
| `@tanstack/ai-openai` | `0.15.10` | `0.22.3` |
| `@tanstack/ai-preact` | `0.10.1` | `0.14.4` |
| `@tanstack/ai-client` | `0.19.1` | `0.29.2` |
| `@tanstack/ai-event-client` | `0.6.8` | `0.11.2` |
| `@tanstack/ai-utils` | `0.3.1` | `0.4.0` |
| `@tanstack/openai-base` | `0.9.6` | `0.10.8` |

The new stable direct family also resolves `@ag-ui/core@0.1.1-canary.beta.0`; that transitive
version is chosen by TanStack's stable 0.52 packages, not used as authority for the direct-version
decision. Other package-key movement carried by the single main merge is not attributed to this
leaf. `deno install` updated the lock in place (RC 0); the lock was neither deleted nor regenerated,
and no reload flag was used.

### Lock-aware architecture invariant

The first post-Fresh-alignment `arch:check` returned RC 1 because the Zod alignment checker still
required the removed `@ag-ui/core@0.0.52` as an approved Zod-v3 parent. The resolved graph shows the
new `@ag-ui/core@0.1.1-canary.beta.0` on Zod 4, leaving only the documented
`@olli/kvdex@3.6.7` Zod-v3 boundary. The checker and its fixture were updated to encode that exact
graph. Its focused tests returned 6 passed / 0 failed / RC 0; format check over both tool files
returned RC 0. The final `arch:check` returned RC 0 and reported
`residual-v3=@olli/kvdex@3.6.7`.

### Final resolved-tree receipts

Every command below used `out=$(cmd 2>&1); rc=$?`; no pipeline supplied a verdict.

| Gate | Result | Structured evidence |
| --- | --- | --- |
| authoritative `deps:latest --filter '@tanstack/ai*'` | PASS, RC 0 | `0 behind / 5 total` |
| three #1829 `TanStack usage:` tests | PASS, RC 0 | 3 passed, 0 failed |
| full focused `tanstack_chat_client_test.ts` | PASS, RC 0 | 5 passed, 0 failed |
| `packages/ai` check | PASS, RC 0 | 101 files, zero diagnostics, `--unstable-kv` |
| `packages/ai` lint | PASS, RC 0 | 101 files, zero findings |
| `packages/ai` format | PASS, RC 0 | 101 files, zero findings |
| Fresh package check | PASS, RC 0 | all public roots plus StreamDB type fixture checked |
| CLI package check | PASS, RC 0 | six public/CLI roots checked |
| former root-failure tests | PASS, RC 0 | 32 passed, 0 failed |
| Zod alignment focused tests | PASS, RC 0 | 6 passed, 0 failed |
| `arch:check` | PASS, RC 0 | dependency checks and all doctrine roots completed |
| `check:agent-docs-prose` | PASS, RC 0 | corpus fresh; no stale paths |
| `check:assets-barrel` | PASS, RC 0 | generator produced no unstaged asset drift |
| `check:publish-assets` | PASS, RC 0 | check mode passed |
| `check:mcp-export-corpus` | PASS, RC 0 | 35 packages, 271 subpaths, 7,680 symbols |
| repo-wide `deno task test` | PASS, RC 0 | `exitCode=0`; `processFailure` absent; 4,444 passed, 0 failed, 19 ignored |

The one-time merge target remains exactly
`f59874abd2bc39446b21f5126323e0d2dcbce547`. `origin/main` advanced after that integration, but no
second fetch/merge was performed because the owner required exactly one final-freeze integration.
The merge resolution retains #1829's nested usage-detail/identity passthrough and this leaf's 0.52
API adaptations together.

### Final judgements

- **PLAN-EVAL:** `N/A` remains the honest assessment. Even after the workspace gate exposed Fresh,
  scaffold, and lock-invariant consumers, each repair was a mechanically evidenced consequence of
  the same dependency-family move, with stable-version authority and objective gates; no unresolved
  architecture choice emerged that warranted stopping for a separate plan evaluator.
- **Usage/token-detail flow:** the upstream change did plausibly and actually affect the flow.
  TanStack 0.52 moved finish reason into `metadata.tanstack` and normalizes/reconstructs canonical
  usage through AG-UI. The adapter now recovers both values without dropping nested fields or object
  identity, proven by all three byte-unchanged #1829 tests.
