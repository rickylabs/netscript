# Tier-A substantive review — ai-mcp-pool-isolation (#1448 / PR #1661)

Reviewer: `topic-fixes-0.0.7`, native Claude Opus 5 / high, session
`c7597d28-6774-44c9-aa00-b8b40b776165`, Remote Control
`https://claude.ai/code/session_014pCd2QWkCscgZpVdjcUPST`. Separate from the Codex implementation
lane (`gpt-5.6-sol` / medium, thread `01a0048d-61b0-76a2-8117-5f8ce0466495`).

Reviewed head `3a4bc66c4832baf8f209e47cc08c3a336e2ff100`. Base `284dda90a17a13a7e5e8e9834e5411b58887131b`.

## Verdict

**PASS_TO_IMPL_EVAL.** No blocking findings. Two non-blocking items for the coordinator.

Authorizes nothing further — ready flip, relabel, merge, publication, and issue closure remain
coordinator-only. IMPL-EVAL is not launched by this review.

## Contract compliance — the thing this leaf stopped twice to protect

Product delta over the base is **exactly ten files**, matching the twice-amended surface with
**nothing outside it**:

```
git diff --name-only 284dda90a..HEAD -- . ':(exclude).llm/**' <exclude each of the 10>
→ empty
```

`packages/ai/deno.json` `exports` **untouched** (the Ruling-1 denial held). `deno.lock` unchanged.
`packages/fresh` untouched — the leaf did not "fix" the foreign test double.

## Ruling compliance, verified in source

| Ruling | Requirement | Verified |
| --- | --- | --- |
| 2 | snapshot **synchronous**, not async | `pool.ts:108` — `get snapshot(): McpTransportPoolSnapshot`, a getter |
| 2 | per-`serverId`, state **and last error** | `McpServerStatus` (`ports:141`) — `serverId`, `state`, optional `lastError` |
| 2 | reuse `McpConnectionState` | `state: McpConnectionState` — no parallel vocabulary introduced |
| 2 | ready clients alongside | `McpTransportPoolSnapshot.readyClients` keyed by server id (`ports:151`) |
| 2 | I/O-free | interface doc: "Immediate, I/O-free view"; getter reads cached state |
| 5 | `readResource` **optional** on the port | `ports:229` — `readResource?(…)` on `McpTransportPort` (`:211`) |
| 5 | required + cancellable on base and both published transports | `readResource` present in `base-transport.ts`, `stdio-transport.ts`, `streamable-http-transport.ts`; required on `McpClientConnection` (`ports:169`) |
| 5 | `stop(options?)` widened without breaking implementors | `close(options?)` / `stop(options?)`; **`packages/fresh` checks green** — see below |
| 6 | behavioral RED through a **published** path | see the test list below |

### Ruling 6 — the evasion guard actually holds

The bar was that cancellation be proven *behaviorally through a published transport*, not by a
method existing. The suite delivers exactly that:

- `published transport readResource settles when its caller aborts` (`:513`)
- `published transport stop settles when its caller aborts` (`:547`)
- `default published HTTP connector aborts its in-flight fetch` (`:579`)
- `published transport permits late close completion after abort` (`:638`) — criterion 5 on the
  **close** path, which was the specific leak I called out
- `McpTransportPool stop settles hanging servers independently` (`:367`) — the `Promise.all` defect
  at the old `pool.ts:149` is genuinely gone
- `stop aborts in-flight connect work and moves to closed` (`:489`)
- `registerMcpTools settles discovery when its caller aborts` (`:284`) and
  `propagates cancellation to registered calls` (`:300`)

### The cross-package break is avoided — the point of amendment 2

`packages/fresh` still type-checks green with the port change: **197 files selected, 0 failed
batches, 0 occurrences**. That is the concrete proof that keeping `readResource` optional on
`McpTransportPort` preserved `FakeMcpTransport` in
`packages/fresh/src/runtime/ai/mcp-app-call-handler_test.ts`, which this leaf was denied from
touching. Had the member been made required, this check would be red.

## Gates — re-executed by this reviewer

| Gate | Result |
| --- | --- |
| Focused `packages/ai/tests/mcp_test.ts` | `exitCode 0` — **20 passed / 0 failed** |
| `packages/ai` structured check | 98 files, **0 failed batches** |
| **`packages/fresh` structured check (cross-package)** | 197 files, **0 failed batches** |
| `deno task quality:scan` | `ok: true`, **0 findings**, 7 allowances all pre-existing |
| `deno task arch:check` | raw exit **0** |
| `deno task doc:lint --root packages/ai` (Ruling 3) | 13 entrypoints incl. `./mcp.ts` — **0 errors, 0 private-type refs, 0 missing JSDoc** |
| `deno publish --dry-run` (packages/ai) | **Success**, exit 0 |
| `docker ps -a` | empty — no expensive gate ran |

No `// deno-lint-ignore`, `// quality-allow`, `as any`, or `as unknown as` was introduced.

## Live acceptance map (#1448)

| # | Criterion | Evidence |
| --- | --- | --- |
| 1 | RED-first test, healthy + never-settling server | `70f8dc799`, `:341` |
| 2 | per-server settlement, healthy server exposed | `9c07f5951`, `:341` |
| 3 | degraded state **and error** addressable | `McpServerStatus.lastError`; snapshot test asserts `lastError` |
| 4 | abort on connect/list/call/**resource-read**/**close** | `:513`, `:547`, `:579`, `:489`, `7bd1b48f9` |
| 5 | late success closed, no leak | `:638` |
| 6 | `registerMcpTools` cancellation | `17a08e967`, `:284`, `:300` |
| 7 | per-server retry/reconnect, peers survive | `:367`, `:457` |
| 8 | immediate snapshot of ready clients + status, no live I/O | `pool.ts:108` sync getter; `readyClients` + `statuses` |
| 9 | documentation of optional/degraded operation | `3a4bc66c4`, README +37 lines |

## Non-blocking, for the coordinator

- **N-1 — the PR `status:` label lags the phase.** #1661 still reads `status:plan` while the leaf is
  implementation-complete. That is a direct consequence of this lane's standing "do not relabel"
  instruction to leaves, not leaf error. `netscript-pr` wants `status:impl` here; relabeling is
  coordinator-only in this lane, so it is reported rather than taken.
- **N-2 — attribution.** An earlier leaf drift entry credits the first amendment to "the
  coordinator"; it was ruled by this topic orchestrator under delegated authority. Corrected in
  `scope-ruling.md`; the leaf's own line is left as history.

## Standing stops

1. A fresh opposite-family **IMPL-EVAL** is mandatory and is not launched here.
2. Ready flip, relabel, merge, publication, and issue closure remain coordinator-only.
3. No expensive-gate lease exists or was requested; none is needed for this leaf's gate set.
