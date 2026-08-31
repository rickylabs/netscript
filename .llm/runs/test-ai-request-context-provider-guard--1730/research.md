# Research — test-ai-request-context-provider-guard--1730

## Re-baseline

- Carried-in source: issue #1730 and its mutation table; no predecessor thread or #1730 run exists.
- Re-derived against `origin/main` @ `952cc106aafea61570d24247695ac23f5d810026` on 2026-08-30.
- The worktree began clean and non-shallow. `main` advanced from `f8b4f804` to `952cc106` while the
  draft PR was opening; the intervening docs-only commit did not touch `packages/ai`, harness
  tooling, or gate runners. S1 was rebased and every candidate was rerun in a clean detached
  worktree at the new base before the plan was finalized.
- The shipped behavior remains correct: `packages/ai/src/agent/loop.ts` has exactly two
  `input.context` consumers, at the `ChatClientRequest.context` field and tool-dispatch options.
  Neither messages nor system text consume the context.

## Findings

| # | Finding | How to verify |
| - | --- | --- |
| 1 | `ChatClientRequest` has five data fields. The provider-bound four are `messages`, `system`, `tools`, and `options`; `context` is the sole provider-invisible field. | `deno doc --filter ChatClientRequest packages/ai/src/ports/mod.ts`; `packages/ai/src/ports/chat-client.ts` |
| 2 | The existing loop test records two continuation requests and checks only `request.context === CONTEXT`; it never serializes the other four fields to reject the sentinel. | `packages/ai/tests/request_context_test.ts`, test `agent loop: threads the run context into every ChatClientRequest` |
| 3 | `withRetryingChatClient` replays the same `ChatClientRequest` only when a provider throws before emitting output. A recording inner client can therefore expose the initial attempt, retry attempt, and later continuation in one deterministic test. | `packages/ai/src/application/provider-retry.ts`; `packages/ai/tests/provider_retry_test.ts` |
| 4 | The loop supplies `messages`, `system`, `tools`, `options`, and `context` in one object on every turn. Mutation B would place the sentinel into the `system` member before the provider port sees it. | `packages/ai/src/agent/loop.ts:156-163` |
| 5 | The TanStack seam has a complete provider-bound projection: `messages`, `systemPrompts`, `tools`, and `modelOptions`. It already detects bridge mutation A. | `packages/ai/tests/request_context_test.ts:232-248`; `packages/ai/src/adapters/tanstack-chat-client.ts:145-191` |
| 6 | The Anthropic wire test exercises real adapter serialization, but cannot guard bridge mutation A because unknown `modelOptions` keys are discarded below the seam. Its name/documentation must describe that narrower adapter-wire claim. | Issue #1730; `packages/ai/src/adapters/anthropic.adapter.ts`; TanStack seam test |
| 7 | `packages/ai` is doctrine Archetype 4 with verdict **Keep**: preserve the engine/port/composition split. This test-only leaf changes no public surface or package structure. | `docs/architecture/doctrine/10-codebase-verdict-and-handoff.md` |
| 8 | `request_context_test.ts` is 429 lines at base. The planned focused edits must keep it below the F-10 500-line test-shape ceiling. | `wc -l packages/ai/tests/request_context_test.ts`; doctrine F-10 |

## Exact provider-bound field list

The loop-level negative assertion will serialize this object for **every** recorded request:

```ts
{
  messages: request.messages,
  system: request.system,
  tools: request.tools,
  options: request.options,
}
```

This is complete because it enumerates every `ChatClientRequest` property other than `context`.
`GenerationOptions.providerOptions` is nested under `options` and is therefore included. The test
will separately assert `request.context === CONTEXT`, preventing accidental omission of the
positive channel from making the negative check vacuous.

## Baseline gate census (`origin/main`)

Every candidate was run before the plan was contracted, while `HEAD == origin/main` and the tree
was clean.

| Candidate | Base result | Contract consequence |
| --- | --- | --- |
| Focused request-context test wrapper | PASS, 9/9, exit 0, 1690 ms | Contract PASS and require named mutation-red evidence. |
| Full `packages/ai/tests/` wrapper | PASS, 147/147, exit 0, 3615 ms | Contract PASS. |
| Scoped check wrapper (`packages/ai`, 100 files) | PASS, exit 0 | Contract PASS. |
| Scoped lint wrapper (`packages/ai`, 100 files) | PASS, exit 0 | Contract PASS. |
| Scoped format wrapper (`packages/ai`, 100 files) | PASS, exit 0 | Contract PASS. |
| `deno task quality:gate` | PASS, exit 0 | Contract PASS; pre-existing warnings are informational. |
| `deno task doc:lint --root packages/ai --pretty` | **BASE RED**, exit 1: 128 entrypoint `private-type-ref`, 0 missing JSDoc | Never claim PASS. Contract the delta: still 128/0 and no new diagnostic path. |
| JSR audit wrapper | PASS, exit 0; 2 warnings (F-DOCT-5 cardinality and slow-type banner) | Contract no-increase; no surface change is allowed. |
| Package `deno publish --dry-run --allow-dirty` | PASS, exit 0; three existing dynamic-import warnings | Contract PASS with the same warning class. |

The doc-lint runner's combined summary reports zero even while per-entrypoint exit codes and the
process exit are red. The plan therefore keys the delta to the per-entrypoint count and raw exit,
not the misleading combined total.

## jsr-audit surface scan (package wave)

- Surface scanned: all 13 `packages/ai/deno.json` exports, `mod.ts`, `agent.ts`, README, raw publish
  dry-run, and the repository JSR audit wrapper.
- Planned surface change: none. No export, dependency, config, README, JSDoc, or publish include is
  in the product ceiling.
- Current risks held constant: 128 pre-existing private-type-ref entrypoint diagnostics; one
  cardinality warning in `src/ports`; the audit wrapper's slow-type banner warning; three raw
  dynamic-import warnings in the MCP connector.
- Slow-type/surface mitigation: no public TypeScript changes; final gates compare the baseline
  counts and confirm the publish dry-run remains green.

## Open questions

- None. The issue fixes the invariant, mutation, retry/continuation coverage, product ceiling, and
  either/or Anthropic decision. The plan selects rename + boundary documentation for Anthropic.
