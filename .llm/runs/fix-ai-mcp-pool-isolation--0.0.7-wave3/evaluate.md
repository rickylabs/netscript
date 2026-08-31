# Evaluation: fix(ai/mcp) — pool failure isolation + cancellation (#1448 / PR #1661)

Formal **IMPL-EVAL**, cycle 1. Fresh session, separate from the Codex author
(thread `01a0048d-61b0-76a2-8117-5f8ce0466495`, `gpt-5.6-sol`) and from the topic orchestrator
that ruled both amendments and signed Tier-A. Tier-A `PASS_TO_IMPL_EVAL` and both rulings were
treated as inputs to verify, not as conclusions; every row below was re-derived in this session.

## Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-ai-mcp-pool-isolation--0.0.7-wave3` |
| Target | `packages/ai` MCP sub-surface (`./mcp` entrypoint) |
| Archetype | `2 — Integration` (coordinator-frozen; Archetype-4 JSR obligations not waived per Ruling 3) |
| Scope overlays | `none` |
| Evaluator | Native Claude, requested `claude-fable-5` · effort `medium` · `/remote-control` on — **canonical** `formal_impl_evaluation` lane (`lane-policy.md:46`, "Fable 5 · medium for Codex work") |
| Observed route | `respawnFlags`: `--model claude-fable-5 --effort medium --remote-control` (job `cb917802` `state.json`) — matched |
| Session id | `cb917802-ee26-4b89-86b9-0eee33c7de1b` (`~/.claude/sessions/520689.json`) |
| Remote Control | `bridgeSessionId` `session_01Kwmr8XjoznnQsHUnkmfcnV` (sessions-registry form) → `https://claude.ai/code/session_01Kwmr8XjoznnQsHUnkmfcnV` |
| PID / cwd | `520689` / `/home/codex/repos/netscript-007-leaf-ai-mcp-pool` |
| Date | 2026-08-15 |

## Heads (resolved independently)

| Ref | SHA |
| --- | --- |
| Evaluated head (Tier-A sign-off) | `e3c74d7aaf3b7734b5a44a5be248c01f004c21e5` — local `HEAD`, `git ls-remote origin refs/heads/fix/ai-mcp-pool-isolation`, and PR #1661 `head.sha` all agree |
| Reviewed implementation head | `3a4bc66c4832baf8f209e47cc08c3a336e2ff100` — verified ancestor; `git diff --name-only 3a4bc66c4..e3c74d7aa` = `review-tier-a.md` only (artifact-only delta) |
| Immutable base | `284dda90a17a13a7e5e8e9834e5411b58887131b` — `git merge-base` of base and head is the base itself; PR `base.sha` matches |

## Contract integrity (twice-amended surface)

| Check | Result | Evidence |
| --- | --- | --- |
| Product delta is exactly ten files | PASS | `git diff --name-only 284dda90a e3c74d7aa -- . ':(exclude).llm/**'` → the ten authorized `packages/ai` files, nothing else |
| `packages/ai/deno.json` `exports` untouched | PASS | `git diff --stat base..head -- packages/ai/deno.json` empty; `./mcp` reused |
| `deno.lock` unchanged | PASS | `git diff --stat base..head -- deno.lock` empty |
| `packages/fresh` not modified | PASS | `git diff --stat base..head -- packages/fresh` empty; `FakeMcpTransport` still the only foreign implementor (`grep -rn 'implements McpTransportPort'` → 6 hits, 1 in fresh) |
| No `// deno-lint-ignore` / `// quality-allow` / `as any` / `as unknown as` / `@ts-ignore` introduced | PASS | grep over `+` lines of `git diff base..head -- packages` → none |
| Wrapper edits are delegation-only (Ruling 4) | PASS | `stdio-transport.ts` / `streamable-http-transport.ts` diffs add `readResource(uri, options)` forwarding and `stop(options?)` forwarding only |

## Ruling compliance (verified in source, not from the report)

| Ruling | Requirement | Verified |
| --- | --- | --- |
| 2 | snapshot synchronous, I/O-free | `pool.ts:108` `get snapshot(): McpTransportPoolSnapshot` — getter over cached `#transports` state, `#lastErrors`, `#readyServerIds`; no awaits, no I/O |
| 2 | keyed per `serverId`, state **and** last error | `McpServerStatus { serverId; state: McpConnectionState; lastError? }` (`ports/mcp-transport.ts`) |
| 2 | reuse `McpConnectionState` | yes — no parallel vocabulary; `McpConnectionState` union unchanged |
| 2 | ready clients alongside | `McpTransportPoolSnapshot.readyClients: Readonly<Record<string, McpTransportPort>>` |
| 2 | additive only on a published surface | aggregate `state` getter and `onStateChange` signatures unchanged; new exports are 4 `type`s on `mcp.ts`; `close/stop/readResource` widen with optional params; `McpConnectorConfig.fetch?` optional |
| 2 | `pool.stop()` settles per server | `pool.ts` `stop` → `Promise.allSettled(... settleWithSignal(transport.stop(options), signal))`; old `Promise.all` gone |
| 5 | `readResource?` **optional** on `McpTransportPort` | `readResource?(uri, options?)` — required on `McpClientConnection`, `BaseMcpTransport`, both published wrappers |
| 5 | `stop(options?)` widened without breaking implementors | port `stop(options?: McpConnectOptions)`; direct `deno check --unstable-kv packages/fresh/src/runtime/ai/mcp-app-call-handler_test.ts` exit 0; structured `packages/fresh` check green (below) |
| 6 | cancellation proven **through a published transport path** | tests at `mcp_test.ts:513/547/579/609/638` instantiate `StreamableHttpMcpTransport` from `../mcp.ts` and prove: in-flight `readResource` settles `rejected` on abort with the signal reaching the connection; in-flight `stop` settles `rejected` while the underlying close **never settles** (`:638`, the non-cooperative case), state → `closed`, and late close completion is still invoked; default TanStack HTTP connector's in-flight `fetch` receives and honors the abort (`:579`); a connector succeeding after abort is closed (`:609`); pool `stop` settles with a hanging peer (`:367`) |
| 3 | JSR obligations on touched entrypoint | `deno doc --lint packages/ai/mcp.ts` exit 0; `deno publish --dry-run --allow-dirty` (packages/ai) exit 0, no slow-type/unanalyzable-import warning |

## Live #1448 acceptance criteria (against the live issue body, 9 unchecked boxes)

| # | Criterion | Evidence | Verdict |
| --- | --- | --- | --- |
| 1 | RED-first test, healthy + never-settling server | `70f8dc799` committed RED (raw exit 1, `TimeoutError`) → green at `9c07f5951`; `mcp_test.ts:341` | met |
| 2 | per-server startup settlement, healthy exposed | `#collectTools` `Promise.allSettled` + `settleWithSignal`; test `:341` asserts `['healthy__search']`, both `connectCount` 1 | met |
| 3 | degraded state **and error** addressable | `snapshot.statuses.stalled` = `{state:'connecting', lastError:'The operation was aborted due to timeout'}` asserted `:355-359` | met |
| 4 | abort interrupts connect / list / call / **resource-read** / **close** in default connector | connect: `:579` (real fetch abort) + `settleWithSignal(createMCPClient…)`; resource-read/close: `:513/:547/:638` via base `settleOperation`; connector `toConnection` wraps `tools()/callTool()/readResource()/close()` in `settleWithSignal` — list/call at connector level are code-verified, not test-proven (see O-2) | met (behavioral bar of Ruling 6 satisfied) |
| 5 | late success after timeout closed, no leak | `settleConnection` → `closeLateConnection`; connector `closeClient` on late `createMCPClient`; pool late `transport.stop()`; tests `:609`, `:638` | met |
| 6 | `registerMcpTools` accepts/propagates cancellation | third `options` param forwarded to `listTools`, registered `callTool`, and stop; tests `:284/:300` | met literally — **but see F-1**: propagation to registered calls reuses the *registration* signal for the lifetime of every later tool call |
| 7 | per-server retry/reconnect, peers survive | `pool.reconnect` per-server settlement; `pool.server(id).reconnect(...)`; `:457` backoff test | met |
| 8 | immediate snapshot of ready clients + status, no live I/O | `pool.snapshot` sync getter (above) | met |
| 9 | documentation of optional/degraded MCP + failure-isolated pattern | `README.md` +37 lines — present, **but the shown pattern is defective (F-1)** | not met as delivered |

## Process verification

| Check | Result | Evidence |
| --- | --- | --- |
| Plan-Gate | PASS | `PLAN-EVAL: N/A` recorded *before* implementation at `53ae2395d` and re-justified at `0bef77e3f`, each after a ruling that fixed the design; justified for a mechanical, contract-fixed leaf |
| Design section in worklog | PASS | `worklog.md` `## Design` + `### Amended Commit Slices` |
| Commit slices match design | PASS | 15 commits: 2 stops (artifact-only, red-first proof), 5 RED/GREEN slice pairs, docs, sign-off; RED commits precede their GREEN in every pair |
| Each slice has a named gate | PASS | per-slice PR comments carry exact structured-wrapper commands + raw exit codes; RED slices report expected exit 1 |
| Generator ≠ evaluator; no self-certification | PASS | Codex thread implemented; Opus topic orchestrator reviewed Tier-A in a separate session; this IMPL-EVAL is a third, fresh session |
| Tier-D mobile-visibility proof | PASS | `codex-thread-ids.md`: thread id, rollout path, worktree, route matched, steering command |
| SKILL chapter in briefs | PASS (as far as visible) | brief staged at `/home/codex/ai-mcp-pool-brief.md` per thread-ids; not re-read (outside repo) |
| Expensive gates | NOT_RUN by design | no lease; `docker ps -a` empty after this evaluation |

## Static gates — re-executed by this evaluator at `e3c74d7aa`

| Gate | Command | Result |
| --- | --- | --- |
| MCP focused tests | `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all packages/ai/tests/mcp_test.ts` | exit 0 · **20 passed / 0 failed** |
| `packages/ai` check | `run-deno-check.ts --root packages/ai --ext ts,tsx` (`--unstable-kv`) | exit 0 · 98 files · 0 failed batches |
| **`packages/fresh` cross-package check** (Ruling 5's point) | `run-deno-check.ts --root packages/fresh --ext ts,tsx` | exit 0 · 197 files · 2 batches · 0 failed |
| direct check of the foreign double | `deno check --unstable-kv packages/fresh/src/runtime/ai/mcp-app-call-handler_test.ts` | exit 0 |
| `packages/ai` lint | `run-deno-lint.ts --root packages/ai --ext ts,tsx` | exit 0 · 0 occurrences |
| `packages/ai` fmt | `run-deno-fmt.ts --root packages/ai --ext ts,tsx` | exit 0 · 0 findings |
| doc lint | `deno doc --lint packages/ai/mcp.ts` | exit 0 |
| quality scan | `deno task quality:scan` | exit 0 · `ok:true` · `findings:[]` · 0 allowances in `packages/ai` |
| arch check | `deno task arch:check` | exit 0 · baseline `export default` warnings only (cli) |
| publish dry-run | `deno publish --dry-run --allow-dirty` in `packages/ai` | exit 0 · no warnings |
| runtime/E2E/Aspire/Docker | — | NOT_RUN (no lease; correct for this leaf) |

## Findings

| ID | Severity | Finding | Evidence | Required action |
| --- | --- | --- | --- | --- |
| **F-1** | **high (blocking)** | The registration signal is reused as the per-call signal for every tool the registry surfaces, so a startup deadline kills all later MCP tool calls. `register-tools.ts:40` registers `(call) => transport.callTool(tool.name, args, options)` where `options` is the `registerMcpTools` argument. The README (criterion 9) documents exactly this as the failure-isolated pattern: `registerMcpTools(registry, pool, { signal: AbortSignal.timeout(1_500) })`. Following it, **every registered tool call made more than 1.5 s after startup rejects with `TimeoutError`**. Test `:300` (`propagates cancellation to registered calls`) encodes this behavior as desired, so the suite cannot catch it. | Read-only repro (this session, `StreamableHttpMcpTransport` + `createToolRegistry`, registration signal `AbortSignal.timeout(50)`): `call-before-deadline: ok` → `call-after-deadline: ERR TimeoutError`. Script: job tmp `repro.ts`; code path `register-tools.ts:34-45`, `base-transport.ts` `callTool` → `settleOperation` rejects immediately on an already-aborted combined signal. | **fix** within the authorized surface (`register-tools.ts`, `mcp_test.ts`, `README.md`): decouple discovery/registration cancellation from per-call cancellation — the registration `signal` must bound discovery (and re-sync/stop as designed) but must **not** be attached to registered tool-call handlers (either pass no signal, as before, or a per-call source distinct from the registration signal). Replace test `:300` with a regression proving a registered call succeeds after the registration signal has aborted, and keep a discovery-abort test. Update the README so the documented pattern is safe, or state explicitly that the registration signal bounds the whole registration lifetime and must not be a startup timeout — the two currently contradict each other. |

### Non-blocking observations (report only)

| ID | Observation | Evidence | Suggested disposition |
| --- | --- | --- | --- |
| O-1 | Tests reach members via `Reflect.get`/`Reflect.apply` (`:290`, `:378`, `:531-538`, `:568`) — residue from the RED phase when the members did not exist. They still exercise the published instances, but they step around the static type surface. | `mcp_test.ts` | tidy to direct calls in the F-1 fix slice; not required for PASS |
| O-2 | Criterion 4 list/call cancellation on the **default TanStack connector** (`toConnection.listTools/callTool`) is code-verified (`settleWithSignal`) but not test-proven at connector level; only connect (`:579`) is. Ruling 6's explicit bar (resource-read + stop through a published transport) **is** met. | `tanstack-connector.ts:92-104` | optional follow-up coverage |
| O-3 | Slice 5 replaced the connector's computed specifiers `['@tanstack','/ai-mcp'].join('')` with literal `import('@tanstack/ai-mcp')` / `import('@tanstack/ai-mcp/stdio')`. Inside an authorized file and `@tanstack/ai-mcp@0.2.1` is already declared in `packages/ai/deno.json` `imports`, so JSR now rewrites it correctly (dry-run clean). It is nonetheless a publish-graph change not named in either ruling and not logged in `drift.md`. `TanstackClient.readResource` matches the real `0.2.1` `client.d.ts:24`. | diff `tanstack-connector.ts:8-9`, worklog slice 5 | coordinator awareness; a one-line drift entry would make the record complete |
| O-4 | With per-server settlement, `pool.connect(...)` **resolves** (partial tools) rather than rejecting when the caller's signal aborts, and transitions the aggregate to `connected` even if every peer failed (member events then re-derive via `#refreshState`). This is inherent to failure isolation and consistent with Ruling 2's "settle per server", but it is a semantic change consumers of the aggregate `state` should know; README does not say it. | `pool.ts:125-130`, test `:341` | doc note, optional |
| O-5 | Aggregate `connect` still throws `AiError` on a duplicate prefixed tool name mid-loop after `allSettled` (pre-existing rule), leaving `#readyServerIds` partially updated for that call. | `pool.ts:212` | pre-existing; no action |

### Tier-A non-blocking items — judged

- **N-1** (PR `status:plan` lags the phase): non-blocking. Relabel is coordinator-only in this lane; the harness board reads a stale column but no gate keys off it before ready-merge. Should be moved to `status:impl` (or `status:impl-eval` for the re-run) in the same action as the coordinator's next phase comment.
- **N-2** (attribution): non-blocking and already corrected in `scope-ruling.md`; `drift.md` carries an append-only correction entry. Record is accurate.

## Anti-pattern check (scope-relevant only)

| AP | Status | Notes |
| --- | --- | --- |
| AP-9 (flag-heavy helper) | CLEAR | three small `settle*` helpers, no option flags; slight duplication across pool/base/connector, acceptable |
| AP-10 (swallowed failure) | CLEAR | per-server rejection retained in `lastError`; late-close failure retained via `.catch → #lastErrors` |
| AP-19 (undocumented network behavior) | **VIOLATION (F-1)** | README documents a pattern that fails after its own deadline |
| AP-25 (effects leak out of adapter) | CLEAR | TanStack/fetch stays in `tanstack-connector.ts` |

## Arch-debt delta

| Metric | Count |
| --- | --- |
| New / resolved / deepened / unrecorded | 0 / 0 / 0 / 0 — no doctrine violation requiring a debt entry; F-1 is an implementation/doc defect, not debt |

## Verdict

| Field | Value |
| --- | --- |
| Verdict | **`FAIL_FIX`** |
| Rationale | The plan and both amendments remain valid and the twice-amended contract is honored precisely (ten files, additive public surface, optional-port/required-published `readResource`, cross-package Fresh check green, behavioral cancellation proven through `StreamableHttpMcpTransport`, all cheap gates re-executed green). One implementation+documentation defect blocks: the registration signal is bound to every later registered tool call, and the delivered README pattern (criterion 9) therefore makes MCP tool calls fail once the startup deadline passes — reproduced in this session. Fix is inside the authorized surface; no rescope, no debt. |

## Residual decisions for the coordinator (not taken here)

1. Dispatch the F-1 fix to the same Codex thread (`codex exec resume 01a0048d-…`) as a RED→GREEN slice on `register-tools.ts` / `mcp_test.ts` / `README.md`; then a fresh IMPL-EVAL cycle 2.
2. PR #1661 stays draft; `status:` relabel (N-1) is coordinator-only.
3. Before any `status:ready-merge`: the PR body carries `Closes #1448` while all nine issue acceptance boxes and the two remaining DoD boxes are unchecked — the acceptance-evidence mirror / close-gate must run after cycle-2 PASS. No box was ticked and no keyword changed by this evaluator.
4. Optionally log O-3 as a one-line drift entry.

---

# IMPL-EVAL — cycle 2 (final)

Fresh separate session. Not the Codex author (`01a0048d-61b0-76a2-8117-5f8ce0466495`), not the
topic orchestrator that ruled the amendments and signed Tier-A twice, not the cycle-1 evaluator
session. The orchestrator's Tier-A re-review `PASS_TO_IMPL_EVAL`, both rulings, and the cycle-1
record were treated as inputs to verify; every row below was re-executed here at the evaluated head.

## Metadata

| Field | Value |
| --- | --- |
| Evaluator route (requested) | Native Claude `claude-fable-5` · effort `medium` · `/remote-control` on — canonical `formal_impl_evaluation` lane (`lane-policy.md:46`) |
| Observed route | job `eb7149da` `state.json` `respawnFlags`: `--effort medium --permission-mode bypassPermissions --remote-control --name "NetScript 0.0.7 #1661 IMPL-EVAL c2" --model claude-fable-5` — matched |
| Session id | `eb7149da-1689-44af-970e-ddd6e78022fa` (`~/.claude/sessions/608782.json`) |
| Remote Control | `bridgeSessionId` `session_01CaAEKsH35CP2QgfNUVdXK1` (registry form) → `https://claude.ai/code/session_01CaAEKsH35CP2QgfNUVdXK1` |
| PID / cwd | `608782` / `/home/codex/repos/netscript-007-leaf-ai-mcp-pool` (branch `fix/ai-mcp-pool-isolation`) |
| Date | 2026-08-15 |

## Heads (resolved independently)

| Ref | SHA |
| --- | --- |
| Evaluated head (Tier-A re-review sign-off) | `df05344166adaeb2b8e2f2f6ec741e1032d29045` — local `HEAD`, fetched `origin/fix/ai-mcp-pool-isolation`, and PR #1661 `headRefOid` all agree; PR draft, base `main` |
| Repair head | `e4944309361fe18efea20be8a3df364bb8754d82` — verified ancestor; `git diff --name-only e4944309 df05344` = `review-tier-a.md` only |
| Cycle-1 evaluated head / verdict | `e3c74d7aa` / `8d6b4726c` |
| Immutable base | `284dda90a17a13a7e5e8e9834e5411b58887131b` — `git merge-base` of base and head is the base |

## F-1 closure — verified behaviorally, not from the diff

Read-only repro outside the repo (`$CLAUDE_JOB_DIR/tmp/repro-c2.ts`), through the **published**
`StreamableHttpMcpTransport` from `packages/ai/mcp.ts` + `createToolRegistry` from `tools.ts`,
using the README's *old* pattern (`registerMcpTools(registry, transport, { signal: AbortSignal.timeout(50) })`):

```
call-before-deadline: complete ok
startup signal aborted? true TimeoutError          ← the deadline genuinely fired
call-after-deadline: complete ok                   ← was ERR TimeoutError at e3c74d7aa
signals seen by callTool (per call): [ signal(aborted=false), signal(aborted=false) ]
discovery under aborted registration signal: rejected:AbortError | listTools saw aborted signal? true
```

- The signal that reaches the connection's `callTool` is the transport's own stop-controller
  combined signal (`base-transport.ts:108`, `combineSignals(this.#stopController.signal, options.signal)`
  with `options.signal === undefined`) — **not** the registration signal; it is unaborted after the
  deadline. Per-call cancellation via a caller-supplied per-call signal remains available on the
  transport itself.
- **Discovery cancellation was not dropped:** `addCurrent` still calls `transport.listTools(options)`
  (`register-tools.ts:35`); the repro shows registration rejecting `AbortError` with the aborted
  signal reaching `listTools`. Re-sync on `connected` re-uses the same path (matches README text).
- **RED independently re-established:** temporary detached worktree at RED commit `59eca0647`
  (removed afterwards): focused test → `0 passed | 1 failed`, raw exit **1**; at the evaluated head
  the same test is green (suite 20/20).

## The test set

| Requirement | Result |
| --- | --- |
| Old defect-asserting test `registerMcpTools propagates cancellation to registered calls` gone | PASS — 0 occurrences in `mcp_test.ts` |
| Replacement asserts success-after-abort | PASS — `mcp_test.ts:300` `registered calls outlive the registration discovery signal`: aborts the registration controller, then asserts the handler resolves `{toolCallId:'demo:demo_search', content:'{}', state:'complete'}` and `transport.callSignal === undefined` |
| Discovery-abort test retained | PASS — `mcp_test.ts:284` `registerMcpTools settles discovery when its caller aborts` unchanged, green |

## Docs/code agreement (criterion 9)

`README.md:194-195` now puts the startup deadline on `pool.connect({ signal: startup })`; `:182`
registers with no deadline; `:211-214` states the `registerMcpTools` signal bounds discovery and
later automatic re-sync and "is not reused by registered tool calls". Verified against
`register-tools.ts` (`listTools(options)` on discovery and on the `connected` re-sync; no options on
the call handler; `stop(stopOptions)` separate). Criterion 9 is **true now**: the documented pattern
is the safe one and describes the signal's real scope. AP-19 cleared.

## Everything cycle 1 checked — re-checked at `df05344`

| Check | Result | Evidence |
| --- | --- | --- |
| Product delta is exactly the ten authorized files | PASS | `git diff --name-only 284dda90a df05344 -- . ':(exclude).llm/**'` → the same ten `packages/ai` files |
| Repair delta (`e3c74d7aa..e4944309`) | PASS | exactly `register-tools.ts`, `mcp_test.ts`, `README.md` (+ artifacts) |
| `packages/ai/deno.json` exports, `deno.lock`, `packages/fresh` | PASS | `git diff --stat base..head` on all three → empty |
| No suppressions introduced | PASS | grep of `+` lines for `deno-lint-ignore` / `quality-allow` / `as any` / `as unknown as` / `@ts-ignore` / `@ts-expect-error` → none |
| Ruling 2 (sync, I/O-free, per-`serverId`, state + `lastError`, `McpConnectionState`, additive) | PASS | `pool.ts:108` `get snapshot()` getter over `#transports`/`#lastErrors`, no `await`/`fetch` in body; `McpServerStatus`/`McpTransportPoolSnapshot` exported as types from `mcp.ts:63,69` |
| Ruling 5 — cross-package `packages/fresh` check | PASS | `run-deno-check.ts --root packages/fresh --ext ts,tsx` → 197 files, 2 batches, 0 failed, exit 0; direct `deno check --unstable-kv packages/fresh/src/runtime/ai/mcp-app-call-handler_test.ts` exit 0 |
| Ruling 6 — published-transport cancellation | PASS | tests `:517/:551/:583/:613/:642` unchanged and green in the 20/20 run; repro above adds registration-through-published-transport evidence |
| Live #1448 criteria 1–8 | met | unchanged from cycle 1 (source unchanged outside the three repair files); criterion 6 still met — options accepted and propagated to discovery, re-sync, and `stop`, no longer to registered calls |
| Live #1448 criterion 9 | **met** | see docs/code agreement above |
| Process: RED→GREEN pair, named gates, per-slice PR comment with raw exit codes | PASS | PR comment `[PHASE: IMPL]` for `59eca0647`/`e49443093`; RED exit 1 independently reproduced |
| Generator ≠ evaluator; no self-certification | PASS | Codex authored; Opus orchestrator re-reviewed; this is a third, fresh session |
| Close-gate (rule 12) | not yet applicable | PR draft; nine issue boxes and two DoD boxes unchecked; `Closes #1448` present — coordinator must run the acceptance mirror before any `status:ready-merge`; nothing ticked here |

## Static gates — re-executed by this evaluator at `df05344`

| Gate | Command | Result |
| --- | --- | --- |
| MCP focused tests | `run-deno-test.ts -- --allow-all packages/ai/tests/mcp_test.ts` | exit 0 · **20 passed / 0 failed** |
| `packages/ai` check | `run-deno-check.ts --root packages/ai --ext ts,tsx` (`--unstable-kv`) | exit 0 · 98 files · 0 failed |
| `packages/fresh` check | `run-deno-check.ts --root packages/fresh --ext ts,tsx` | exit 0 · 197 files · 0 failed |
| `packages/ai` lint / fmt | `run-deno-lint.ts` / `run-deno-fmt.ts --root packages/ai --ext ts,tsx` | exit 0 / exit 0 · 0 findings |
| doc lint | `deno doc --lint packages/ai/mcp.ts` | exit 0 |
| quality scan | `deno task quality:scan` | exit 0 · `ok:true` · `findings:[]` · 0 allowances in `packages/ai` |
| arch check | `deno task arch:check` | exit 0 · baseline `export default` warnings only |
| publish dry-run | `deno publish --dry-run --allow-dirty` in `packages/ai` | exit 0 · Success |
| Aspire / Docker / `scaffold.runtime` / `e2e:cli` / browser | — | NOT_RUN by constraint; no lease; `docker ps -a` empty after this evaluation |

## Cycle-1 observations — disposition

| ID | Status now | Blocking? |
| --- | --- | --- |
| O-3 | closed — `drift.md` carries the "Slice 5 publish graph" entry (a trailing bullet under the attribution entry rather than its own dated heading; record is complete, form is cosmetic) | no |
| O-1 (`Reflect.*` in tests) | deferred as instructed | no — published instances still exercised |
| O-2 (connector-level list/call abort not test-proven) | deferred | no — Ruling 6's bar met; code-verified |
| O-4 (`pool.connect` resolves partial on abort) | deferred; README's new `pool.connect({signal})` + snapshot pattern is consistent with it | no |
| O-5 (duplicate-name throw mid-loop) | pre-existing | no |

## Findings

None blocking. No new findings.

## Verdict (cycle 2 — final)

| Field | Value |
| --- | --- |
| Verdict | **`PASS`** |
| Rationale | F-1 is closed and proven at runtime through a published transport: the startup deadline fires, later registered calls succeed, no registration signal reaches `callTool`, and discovery cancellation is intact. The defect-encoding test is gone and replaced by a success-after-abort regression that was independently red at `59eca0647`; the discovery-abort test remains. README and code agree, making criterion 9 true. The twice-amended ten-file contract, Rulings 2/5/6, lock/export/`packages/fresh` hygiene, and every cheap structured gate re-verify green at `df05344`. No doctrine violation, no debt entry needed. |

## Stops here — coordinator readiness disposition (not taken)

- PR #1661 remains **draft**; `status:plan` label still lags (N-1) — relabel is coordinator-only.
- Before `status:ready-merge`: acceptance-evidence mirror / close-gate for the nine #1448 boxes and
  the two DoD boxes; no box ticked and no keyword changed by this evaluator.
- No further IMPL-EVAL cycle; no PLAN-EVAL.

---

# IMPL-EVAL — repair-delta evaluation (O-3 check-test repair, bounded)

Cycle-2 `PASS` at `df05344166` (verdict `4766b258f`) stands and is not re-audited here. This is a
fresh, separate, proportionate evaluation of the one-file repair delta and its blast radius.

## Metadata

| Field | Value |
| --- | --- |
| Evaluator route (requested) | Native Claude `claude-fable-5` · effort `medium` · `/remote-control` on — canonical `formal_impl_evaluation` lane |
| Observed route | job `8a0ff845` `state.json` `respawnFlags`: `--effort medium --permission-mode bypassPermissions --remote-control --name "NetScript 0.0.7 #1661 EVAL repair-delta" --model claude-fable-5` — matched |
| Session id | `8a0ff845-1d0a-43d6-ae3c-03b4158f7943` (`~/.claude/sessions/714835.json`) |
| Remote Control | `bridgeSessionId` `session_013K3BZ2ydVkYzXt6vgcxTJX` → `https://claude.ai/code/session_013K3BZ2ydVkYzXt6vgcxTJX` |
| PID / cwd | `714835` / `/home/codex/repos/netscript-007-leaf-ai-mcp-pool` (branch `fix/ai-mcp-pool-isolation`) |
| Date | 2026-08-15 |

## Heads (resolved independently)

| Ref | SHA |
| --- | --- |
| Evaluated head (Tier-A sign-off on repair) | `de89440119ba45822f0bdc8350838088a6f04140` — local `HEAD`, `git ls-remote origin`, and PR #1661 `headRefOid` all agree; PR **non-draft**, OPEN |
| Repair product commit | `45aca4adcd35dd6a9b825db449284e400171a533` — ancestor; `git diff --name-only 45aca4adc de8944011` = `review-tier-a.md` only |
| Cycle-2 PASS head / verdict | `df05344166` / `4766b258f` |
| Immutable base | `284dda90a` — `git merge-base` = base |

## Judgments

| # | Question | Evidence | Result |
| --- | --- | --- | --- |
| 1 | Invariant restored, not just the test | Head `tanstack-connector.ts:11-12` defines `TANSTACK_MCP_SPECIFIER` / `TANSTACK_MCP_STDIO_SPECIFIER` as `['@tanstack','/ai-mcp(/stdio)'].join('')`, byte-identical to base `284dda90a:10-11`; used at all three dynamic-import sites (`:46`, `:71`, `:72`), matching base `:31,:50,:51`. `grep '@tanstack/ai-mcp' packages/ai/src` non-test → only a doc comment in `ports/mcp-transport.ts:6`; no static literal specifier remains in `packages/ai/src`. | ✅ |
| 2 | CLI test not weakened; untouched files | `git diff --stat 284dda90a..HEAD -- packages/cli packages/fresh deno.lock packages/ai/deno.json` → empty. `workspace-mutator_test.ts:261-318` unchanged: still scans connector source with the `[…].join('')` regex and asserts both `@tanstack/ai-mcp` and `@tanstack/ai-mcp/stdio`. | ✅ |
| 3 | Failure gone — failing test + repo-wide | `deno test --allow-all --unstable-kv packages/cli/src/kernel/adapters/plugin/workspace-mutator_test.ts` → 19 passed / 0 failed, exit 0. **Repo-wide `deno task test`** (structured wrapper) → `passed 4152, failed 0, ignored 19, exitCode 0, 403.6s` vs CI's 4151/1. | ✅ |
| 4 | Publish invariant | `deno publish --dry-run --allow-dirty` in `packages/ai` → `Success Dry run complete`, exit 0. | ✅ |
| 5 | No regression to cycle-2 certification | `packages/ai/tests/mcp_test.ts` → 20 passed / 0 failed, including `registered calls outlive the registration discovery signal` (F-1). Delta touches no MCP runtime behaviour — only import specifier form. | ✅ |
| 6 | O-3 drift correction states the truth | `drift.md:77-87` now records the prior disposition as wrong, names the cross-package packaging invariant, the observed `check-test` regression, the restoration, and before/after raw exit codes. Matches what I observed. | ✅ |

Constraints honored: no Aspire/Docker/`scaffold.runtime`/`e2e:cli`/browser; `docker ps -a` empty
before and after; read-only over source.

## Findings

None. No new findings; no debt entry needed.

## Verdict (repair delta — final)

| Field | Value |
| --- | --- |
| Verdict | **`PASS`** |
| Rationale | The repair restores the computed optional-runtime invariant to base form at every site, the CLI test is unweakened and green, the repo-wide gate CI failed on is now 4152/0, the `packages/ai` publish dry-run is green, the F-1 lifetime separation and MCP suite are intact, and the O-3 drift entry now records the regression truthfully. |

## Stops here

Single bounded evaluation, no loop. No merge, relabel, box-tick, keyword or draft-state change,
central-state mutation, or next leaf by this evaluator — readiness and merge are the coordinator's.
