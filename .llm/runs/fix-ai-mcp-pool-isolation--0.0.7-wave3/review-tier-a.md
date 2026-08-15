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

---

# CORRECTION — this Tier-A PASS is withdrawn (IMPL-EVAL F-1)

IMPL-EVAL cycle 1 (`8d6b4726c`, evaluated head `e3c74d7aa`, canonical Fable 5 · medium) returned
**`FAIL_FIX`** on blocking finding **F-1**, which this Tier-A missed.

## What I got wrong

I marked live criterion 6 (`registerMcpTools` accepts/propagates cancellation) **met** because the
`options` argument was forwarded into `callTool`. I checked that propagation *exists*. I never asked
what forwarding a **registration-scoped** signal into **per-call** handlers means at runtime.

Verified in source after the verdict:

- `register-tools.ts:38-41` — the registered handler closes over `options`, the `registerMcpTools`
  argument, and passes it to `transport.callTool(...)`. The registration signal therefore *is* the
  per-call signal for **every** tool, for the lifetime of the registry.
- `README.md:194-195` — the documented failure-isolated pattern is
  `const startup = AbortSignal.timeout(1_500); await registerMcpTools(registry, pool, { signal: startup })`.
  Following the documentation, **every tool call made more than 1.5 s after startup rejects with
  `TimeoutError`**.
- `mcp_test.ts:300` — `registerMcpTools propagates cancellation to registered calls` aborts the
  registration controller and asserts the handler **rejects**. The suite therefore **encodes the
  defect as desired behavior**, which is exactly why every gate was green and why a
  green-gate review could not catch it.

The evaluator did what I should have: a read-only runtime repro —
`call-before-deadline: ok` → `call-after-deadline: ERR TimeoutError`.

## This is the third instance of one pattern

| # | Leaf | Miss | Root cause |
| --- | --- | --- | --- |
| E-1 | #1657 | verified template↔manifest semantics; never asked whether the template is what ships | checked shape, not delivery |
| G-1 | #1657 | inferred `packages/fresh-ui` was outside the root workspace from a substring match against a glob | inferred a negative from a pattern |
| **F-1** | **#1661** | verified a signal is forwarded; never asked what its **scope** means at runtime | checked shape, not behavior |

All three: I checked the shape and not the behavior. The corrective rule already adopted in this
lane — *execute the check; never infer from a pattern match* — is necessary but was not sufficient,
because here I did read the code. The sharper rule this adds:

> **For any cancellation, lifetime, or scope contract, run it.** A signal that is *plumbed* is not a
> signal that is *correctly scoped*. Green tests are no defense when the test encodes the defect.

## Corrected verdict

The Tier-A `PASS_TO_IMPL_EVAL` above is **withdrawn**. The correct verdict at `3a4bc66c4` /
`e3c74d7aa` is **CHANGES_REQUESTED**, subsumed by the formal IMPL-EVAL `FAIL_FIX`.

Everything else in that review stands and the evaluator independently reached the same conclusions:
contract integrity (ten files, `deno.json`/`deno.lock`/`packages/fresh` untouched), Ruling 2's
synchronous I/O-free snapshot, Ruling 5's optional-on-port `readResource` with the cross-package
check green, and Ruling 6's published-transport cancellation bar. The miss is orthogonal to those.

## Fix scope — no new amendment required

F-1's remedy is **inside the already-authorized ten-file surface**: `register-tools.ts`,
`mcp_test.ts`, `README.md`. Decouple registration/discovery cancellation from per-call cancellation;
replace the test at `:300` with a regression proving a registered call **succeeds** after the
registration signal aborts, while keeping a discovery-abort test; and make the README pattern safe
or state explicitly that the registration signal bounds the whole registration lifetime and must not
be a startup timeout. The two currently contradict each other.

---

# Tier-A RE-REVIEW after the F-1 repair

Reviewed head `e4944309361fe18efea20be8a3df364bb8754d82`. Repair base `1bdb09e13`. Same reviewer and
session as above; same separation from the Codex author thread.

## Verdict

**PASS_TO_IMPL_EVAL** — bounded to the F-1 repair. Authorizes nothing beyond requesting the formal
cycle-2 gate.

## The behavioral check I failed to run last time

My previous Tier-A passed this leaf while F-1 was live because I confirmed the signal was *plumbed*
and never asked what its *scope* meant at runtime. So this time I **ran the contract** rather than
reading it — a standalone repro against the real `registerMcpTools` and `createToolRegistry`,
reproducing the README's own pattern with a short startup deadline:

```
call-before-deadline: ok
startup signal aborted? true
call-after-deadline:  ok        ← was ERR TimeoutError at e3c74d7aa
signal attached to call? false
F-1 RESOLVED
```

`startup.aborted === true` matters: the deadline genuinely fired, so this is not a test that passed
by never reaching the failure condition.

## The fix is minimal and correctly scoped

```diff
-        async (call) =>
-          await transport.callTool(tool.name, parseArguments(call.arguments), options),
+        async (call) => await transport.callTool(tool.name, parseArguments(call.arguments)),
```

One line. `transport.listTools(options)` on the discovery path is **unchanged**, so registration-time
cancellation is preserved rather than silently dropped — the specific regression I warned against.
`registerMcpTools settles discovery when its caller aborts` (`:284`) is retained and green.

## The wrong test is gone, and the right one replaces it

- `registerMcpTools propagates cancellation to registered calls` — which **asserted the defect** —
  is **removed** (0 occurrences).
- `registered calls outlive the registration discovery signal` is added, aborting the registration
  controller and then asserting the call **succeeds** and `transport.callSignal === undefined`.

That inverts the assertion from "the bug is the contract" to "the bug cannot return".

## Docs and code now agree

`README.md:182` is `await registerMcpTools(registry, pool);` — no startup deadline — and `:211`
states plainly that the optional signal passed to `registerMcpTools` **bounds discovery**. The
startup deadline moved to `pool.connect({ signal: startup })` (`:194`), which is where a startup
deadline belongs. The contradiction that made criterion 9 false is resolved.

## Scope and gates

| Check | Result |
| --- | --- |
| Repair delta | exactly the three authorized files — `register-tools.ts`, `mcp_test.ts`, `README.md` |
| Outside the repair surface | **empty** |
| `deno.lock`, `packages/ai/deno.json` exports, `packages/fresh` | **untouched** |
| Focused MCP suite | exit 0 — **20 passed / 0 failed** |
| `packages/ai` check | 98 files, 0 failed batches |
| **`packages/fresh` cross-package check** | 197 files, 0 failed batches — Ruling 5's guarantee survives the change |
| `deno task quality:scan` | `ok: true`, **0 findings** |
| `deno task arch:check` | raw exit **0** |
| `doc:lint --root packages/ai` | **0 errors / 0 private-type refs / 0 missing JSDoc** |
| `deno publish --dry-run` | **Success** |
| `docker ps -a` | empty — no expensive gate ran |

**O-3 closed:** the `@tanstack` specifier change is now recorded in `drift.md`.

O-1, O-2, O-4 and O-5 were correctly **not** taken this turn, as instructed.

## What this does not certify

Cycle-1's `FAIL_FIX` stands as the record of what was wrong; this re-review certifies only the
repair. A fresh formal **IMPL-EVAL cycle 2** is mandatory and is requested next — this reviewer has
now missed a blocking defect on this leaf once, so its `PASS` is an input to that gate, not a
substitute for it.

---

# Tier-A — the O-3 / `check-test` repair delta

Reviewed head `45aca4adcd35dd6a9b825db449284e400171a533`. Repair base `4766b258f`.

## Verdict

**PASS_TO_IMPL_EVAL** — bounded to this repair delta. This is a **post-IMPL-EVAL product mutation**,
so a proportionate fresh formal evaluation of the delta follows and is requested next.

## What went wrong, and why my earlier gates could not catch it

CI's `check-test` was a **current failure** (`currentFailures=1`): 4151 passed / **1 failed**, the
sole failure being `root-level scaffold runtime imports resolve in both package-source modes`
(`workspace-mutator_test.ts:261`) — *expected @netscript/ai to compute the @tanstack/ai-mcp runtime
specifier*.

That assertion (`:306-320`) scans the **connector's source text** for `[…].join('')` and requires
**both** `@tanstack/ai-mcp` and `@tanstack/ai-mcp/stdio` to be computed, keeping optional MCP out of
the static JSR import graph so generated projects own runtime resolution.

Two failures on my side, recorded because the pattern matters more than the instance:

1. I accepted cycle 1's **O-3** as bookkeeping, even though the evaluator noted the change was "not
   named in either ruling". That should have prompted *then why is it asserted elsewhere?*
2. My Tier-A gate set covered the packages the delta **touched**. The assertion lives in
   **`packages/cli`**, which the delta does not touch but which asserts on `packages/ai`'s source
   text. Package-scoped gates were structurally incapable of catching it.

## The repair

One product file, faithful to base `284dda90a`:

```diff
+const TANSTACK_MCP_SPECIFIER = ['@tanstack', '/ai-mcp'].join('');
+const TANSTACK_MCP_STDIO_SPECIFIER = ['@tanstack', '/ai-mcp/stdio'].join('');
-    const mcp = await import('@tanstack/ai-mcp');
+    const mcp = await import(TANSTACK_MCP_SPECIFIER);
-    const stdio = await import('@tanstack/ai-mcp/stdio');
+    const stdio = await import(TANSTACK_MCP_STDIO_SPECIFIER);
```

Both constants restored and used at all three dynamic-import sites. **The CLI test was not
weakened** — `packages/cli` source, `packages/fresh`, `deno.lock` and `packages/ai/deno.json`
`exports` are all untouched. The O-3 drift entry is corrected to record this as a real cross-package
regression rather than a publish-graph note.

## Gates — widened to close the gap that let this through

| Gate | Result |
| --- | --- |
| **Repo-wide `deno task test`** | exit 0 — **4152 passed / 0 failed / 19 ignored** (CI's failing run: 4151 / **1**) |
| The previously failing CLI test | exit 0 — **19 passed / 0 failed** |
| **`packages/cli` check** (the asserting package, previously omitted) | 883 files, **0 failed batches** |
| `packages/ai` check | 98 files, 0 failed |
| `packages/fresh` check | 197 files, 0 failed |
| `deno task quality:scan` | `ok`, **0 findings** |
| `deno task arch:check` | exit 0 |
| `doc:lint --root packages/ai` | 0 errors / 0 private-type refs / 0 missing JSDoc |
| **`deno publish --dry-run`** — the invariant the computed form exists to protect | **Success** |
| `docker ps -a` | empty — no expensive gate ran |

The repo-wide suite is the one that matters here: it is the gate CI failed on, and it is the gate my
earlier package-scoped selection omitted. **Rule now standing for this lane:** when a change alters a
package's *source text* in a way another package may assert on — specifier construction, export
shape, generated-artifact content — run the repo-wide suite or gate the asserting package explicitly.

## Unchanged by this delta

Everything the cycle-2 `PASS` certified stands: the ten-file contract, Rulings 2/5/6, the F-1
registration/call lifetime separation, and the nine live acceptance criteria. This delta restores a
packaging invariant and changes no runtime behaviour of the MCP pool.

## Standing stops

1. A **proportionate fresh formal evaluation of this delta** is required and is requested next.
2. Merge, readiness, relabel and issue closure remain coordinator-only. The PR is non-draft; I have
   changed no label, box, or draft state.
