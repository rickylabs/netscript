# Topic-orchestrator ruling — #1448 / PR #1661 S0 scope boundary

Ruled by `topic-fixes-0.0.7` (native Claude Opus 5 / high, session
`c7597d28-6774-44c9-aa00-b8b40b776165`) on delegated coordinator authority, at S0 head
`1d4533462a088ad902ac7dd71be88764463fcd5d`. Base `284dda90a17a13a7e5e8e9834e5411b58887131b`.

The S0 stop was **correct**. The leaf proved the blocker red-first, committed artifact-only, and
refused to widen its own contract. That is the fourth leaf in this lane to hold that boundary, and
it is the behavior the run wants.

## Finding upheld — the 3-file surface cannot satisfy the live acceptance

Verified against the live issue and the code, not the report:

| Live criterion | Frozen surface reaches it? |
| --- | --- |
| 1 — committed RED-first test | **no** — no test file authorized |
| 2 — per-server settlement | yes — `pool.ts` |
| 3 — addressable degraded state **and error** | **no** — the status type belongs in the port |
| 4 — cancellation on connect/list/call/**resource-read**/**close** | **partly** — connector yes; resource-read and close plumb through the shared base transport |
| 5 — late-success cleanup | yes — connector |
| 6 — `registerMcpTools` cancellation | yes — `register-tools.ts` |
| 7 — per-server retry/reconnect | yes — `pool.ts` |
| 8 — **public** snapshot of ready clients + per-server status, no live I/O | **no** — must be exported from the `./mcp` entrypoint |
| 9 — documentation | **no** — no docs surface authorized |

## Ruling 1 — writable-surface amendment (authorized)

Added to the frozen contract, **exactly these five**:

1. `packages/ai/tests/mcp_test.ts` — criterion 1, and the harness requires committed regression
   coverage regardless.
2. `packages/ai/src/ports/mcp-transport.ts` — criteria 3, 4, 8. The per-server status type and the
   cancellable resource-read/close option types belong in the **port**, not an adapter. Precedent is
   already there: `McpConnectOptions.signal` lives in this file.
3. `packages/ai/src/mcp/adapters/base-transport.ts` — criterion 4. Resource-read and close signal
   plumbing is shared transport behavior; confining it to the TanStack connector would leave the
   other transport uncancellable.
4. `packages/ai/mcp.ts` — criterion 8 says **public**. The snapshot type and accessor must be
   exported from the existing `./mcp` entrypoint.
5. `packages/ai/README.md` — criterion 9.

**Explicitly NOT authorized**, and each is a stop-and-report if the work seems to need it:

- Any file outside `packages/ai/**`.
- A **new** entry in `packages/ai/deno.json` `exports`. Reuse the existing `./mcp` entrypoint; a new
  export path is a public-surface expansion that needs its own decision.
- Consumer-side work. The issue's "EIS-Chat disposition" is guidance **for the consumer**, not scope
  for this leaf.
- Any other package's port, adapter, or docs.

## Ruling 2 — the public per-server status / cancellable-close contract

This is a **published JSR surface** under `isolatedDeclarations`. Every new exported symbol needs an
explicit declared type or the publish dry-run rejects it.

**Status snapshot:**

- **Synchronous and I/O-free.** Criterion 8 says *immediate … without performing live network I/O*.
  Expose it as a **synchronous** accessor returning a plain readonly structure — **not** `async`, and
  not something that can later acquire a round-trip. This is the load-bearing property of the
  criterion; an async signature invites exactly the defect the issue is about.
- **Keyed per `serverId`**, each entry carrying at minimum the `serverId`, its lifecycle state, and
  the **last error** for degraded servers (criterion 3 requires the error, not just the state).
- **Reuse `McpConnectionState`.** Do not introduce a parallel status vocabulary. If a genuinely new
  state is unavoidable, extend that union and record it as drift with the reason.
- **Ready clients exposed alongside status**, so a consumer can select healthy servers without
  touching failed peers.
- **Additive only.** The existing aggregate `state` getter and `onStateChange` keep their current
  behavior and signatures; this is a published surface and the change must not break consumers.

**Cancellable close:**

- `close`/`stop` accepts an options bag carrying `signal`, mirroring `McpConnectOptions` rather than
  inventing a second convention.
- **`pool.stop()` must settle per server.** Today `pool.ts:149` is
  `await Promise.all([...].map((t) => t.stop()))` — one hanging close blocks every other server's
  teardown. That is the *same* all-or-nothing defect as startup, and criterion 4 is not met while it
  stands. Settle each server independently.
- Late success after an abort must still close and must not leak a client or session (criterion 5),
  on the close path as well as the connect path.

## Ruling 3 — archetype conflict (the minor drift)

The coordinator's Archetype-2 override **stands** for gate selection on this narrow adapter/pool
leaf. But the amendment now touches the **public** `mcp.ts` entrypoint and the port, so the
Archetype-4 / JSR obligations on `packages/ai` are **not waived** by that override: `deno doc --lint`
on the touched entrypoint, `isolatedDeclarations` compliance, and the publish dry-run all apply to
the exported surface. Accepting the archetype override is not accepting a lighter public-surface bar.

## Gates

Contract gates `check`, `test`, `publish-dry-run`, `arch-check` stand, plus `quality:scan` for
`packages/**`, the JSR audit, and `deno doc --lint` on the touched entrypoint per Ruling 3.

**No expensive-gate lease is granted.** No Aspire, Docker, `scaffold.runtime`, or `e2e:cli`.
