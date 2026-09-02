# Context pack — SDK client contributions S5/S6/S7

## Objective

Implement three ordered consumers/proofs of the existing SDK client-contribution seam without
redesigning it:

`S5 bearer auth (#1352)` → `S6 transport-owned trace (#1353)` → `S7 locale (#1467)`.

This run is planning-only. The next session must not write product code until a separate PLAN-EVAL
passes.

## Start here

Read in this order:

1. `AGENTS.md`
2. `.agents/skills/netscript-harness/SKILL.md`
3. `.agents/skills/netscript-doctrine/SKILL.md`
4. `.agents/skills/netscript-deno-toolchain/SKILL.md`
5. `.llm/runs/feat-sdk-client-contributions--1352-1353-1467/research.md`
6. `.llm/runs/feat-sdk-client-contributions--1352-1353-1467/plan.md`
7. `rfcs/0001-sdk-client-contributions.md`
8. the current live issue bodies/amendments for `#1352`, `#1353`, and `#1467`
9. focused public documentation with `deno doc`, then only the focused files below

Do not rely on the old issue summaries where they conflict with live amendments or the accepted RFC.

## Non-negotiable decisions

- Current doctrine classifies `packages/sdk` as Archetype 2, Keep—not Archetype 4.
- Consume the shipped S1–S3 public protocol and private adapters. Do not redesign, duplicate, or
  expose them.
- The HTTP transport is the sole final outbound-header authority.
- Auth and locale reach transport only as validated prepared contribution headers.
- Trace is **not** a contribution. `traceparent` and `tracestate` remain reserved.
- Keep `propagateTraceContext` and `ServiceClientContext.traceHeaders` public compatibility inputs.
- Default/true inject the CLIENT span; false emits neither trace header but still records the span.
- Explicit trace headers select a parent/fallback; final bytes describe the CLIENT child.
- Credentials never enter logs, durable errors, spans, URLs, cache keys, generated files, manifests,
  or run artifacts.
- `deno.lock` must remain byte-identical.
- Slices are sequential; none may run concurrently.
- Every leaf PR uses `Refs #N`, never a closing keyword. Epic `#1348` is never closed by a leaf.

## Existing seam — consume, do not redesign

Public:

- `packages/sdk/src/ports/sdk-client-contribution.ts`
- `packages/sdk/src/client/sdk-client-contribution.ts`
- `packages/sdk/src/ports/service-client.ts`
- `packages/sdk/src/client/service-client.ts`
- `packages/sdk/src/presets/define-services.ts`

Private adapters:

- `packages/sdk/src/internal/client-contributions/adapter-ports.ts`
- `packages/sdk/src/internal/client-contributions/prepared-call.ts`
- `packages/sdk/src/internal/client-contributions/stable-v1-adapter.ts`

Final transport seam:

- `packages/sdk/src/client/http-client-link.ts`

The prepared-call implementation already provides validation, immutable contribution inputs,
conflict/reserved-header rejection, cache partitioning, redacted errors, and preparation epochs.

## Focused S5 context

Inspect:

- `packages/plugin-auth-core/src/contracts/v1/auth.contract.ts`
- `packages/plugin-auth-core/deno.json`
- `packages/plugin/src/config/domain/plugin-contributions.ts`
- `packages/plugin/src/config/application/contribution-merger.ts`
- `packages/plugin/src/config/builders/plugin-builder.ts`
- `plugins/auth/src/adapter/plugin.ts`
- `plugins/auth/src/adapter/resources/`
- `packages/service/src/auth/static-credential-authenticator.ts`
- `packages/cli/src/public/features/plugins/auth/auth-session-client.ts` only to preserve the
  recorded deferral

Ship `@netscript/plugin-auth-core/sdk`, manifest reference data, and explicit application/starter
selection. Do not add ambient environment resolution or cookie/session support. Do not migrate the
CLI explicit-URL raw fetch calls in this slice; record that partial acceptance clearly.

Security test rule: create fake secrets at runtime and assert only booleans/counts. Never print or
snapshot the value, captured authorization header, or resolver output.

## Focused S6 context

Inspect:

- `packages/sdk/src/client/http-client-link.ts`
- `packages/sdk/tests/client-contribution-observability_test.ts`
- `packages/sdk/tests/integration/service-client-runtime_test.ts`
- `packages/sdk/tests/integration/client-contribution-adapter_test.ts`
- telemetry public APIs for extracting a parent context and creating a CLIENT span

Present defect/rebaseline: the upstream link callback and final fetch wrapper both participate in
trace authorship, and the final wrapper overwrites the earlier value. Consolidate policy and final
bytes at fetch. Update the current test that expects a trace under `propagateTraceContext: false`;
the amended issue requires neither trace header in that case.

Do not touch the private adapter seam or add a public trace contribution.

## Focused S7 context

Inspect:

- the locale example in `packages/sdk/src/client/sdk-client-contribution.ts`
- current contribution type fixtures and cache/query tests
- SDK export barrels and README

Ship a canonical SDK locale contribution owning `accept-language`. Prove typed
direct/query/generated use, conflicts, cache partition/direct-only behavior, retry/new-epoch
behavior, cancellation, redaction, and composition with the landed bearer contribution. Do not touch
HTTP transport.

## File ceilings

| Slice | Hard ceiling | Stop condition                                                   |
| ----- | -----------: | ---------------------------------------------------------------- |
| S5    |           27 | Any SDK adapter/HTTP-link or CLI transport edit, or file 28      |
| S6    |            9 | Any private contribution adapter/public algebra edit, or file 10 |
| S7    |            9 | Any HTTP-link/private-adapter/auth/plugin edit, or file 10       |

The exact expected files are enumerated in `plan.md`. A ceiling is not permission to substitute
unrelated files.

## Gate baselines

`deno.lock` SHA-256:

`01ff3a232713a35e9bd5c9f34db7669568fadd16273cb9c82389832b10b55cbe`

Doc-lint A/B baselines:

- `packages/sdk`: 3 private, 0 missing, 0 other.
- `packages/plugin-auth-core`: 4 private, 0 missing, 0 other.
- `packages/plugin`: 15 private, 0 missing, 0 other.
- `plugins/auth`: 13 private, 0 missing, 0 other.

Use the exact file/count sets in `research.md`, not only the totals. Post-state must be a subset;
new subpaths must be clean.

Use structured repository wrappers for check/test/lint/source-format, focused package tests,
`deno doc`, JSR audits, publish dry-runs, packed-consumer probes, architecture/quality gates,
`git diff --check`, touch ceiling, and lock hash. For targeted workspace checks, retain the
repository's `--unstable-kv` requirement where the invoked wrapper/command accepts it.

## Prohibited operations

Do not run locally:

- Aspire or any local service runtime;
- Docker/container commands;
- browser gates;
- `e2e:cli`, including `scaffold.runtime`.

S5's eventual scaffold runtime verdict belongs to authorized remote CI/OpenHands. If unavailable,
leave the merge-readiness gate pending; do not substitute an out-of-brief local run.

Do not delete or reload caches/locks. Do not modify another run's `.llm/runs/**` content. Do not
store request headers, credentials, or raw secret-bearing command output in this run directory.

## Evaluation handoff

Before implementation:

1. create the required harness control artifacts for the implementation run;
2. copy the Design checkpoint from `plan.md` into its `worklog.md`;
3. run separate-session PLAN-EVAL under the repository lane policy;
4. stop unless it returns PASS.

During implementation, one worker owns one slice at a time. After each slice, run its focused gates
and separate IMPL-EVAL before landing and starting the successor. Any drift in ordering, authority,
security, public contract, touch ceiling, lock policy, or partial scope returns to planning.
