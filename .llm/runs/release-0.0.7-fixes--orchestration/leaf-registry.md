# Wave 0 leaf registry — fixes topic

| Leaf | Issues | Worktree | Branch | Base | Route | Thread | Draft PR | State |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `legacy-port-pin-sweep` | #1243 | `/home/codex/repos/netscript-007-leaf-legacy-port-pin-sweep` | `fix/legacy-port-pin-sweep` | `e6ba15ec6` | Codex · `gpt-5.6-sol` · low | `019ffcca-8bdc-7fb3-98c5-df90e2ae3b1f` (idle) | [#1643](https://github.com/rickylabs/netscript/pull/1643) **MERGED** `0b3ed5d5a` @ 2026-08-14T23:39:37Z | **TERMINAL** — IMPL-EVAL `PASS` at `e6ba15ec6`; #1243 `CLOSED/COMPLETED`. ⚠ lifecycle-label gap: PR still `status:ready-merge`, issue still `status:triage` (both should be terminal `status:shipped`) — coordinator-only relabel. |
| `scaffold-generated-output-correctness` | #1262, #1263, #1588 | `/home/codex/repos/netscript-007-leaf-scaffold-generated-output-correctness` | `fix/scaffold-generated-output-correctness` | `14d8b38b4` | Codex · `gpt-5.6-sol` · high | `019ffcca-8be0-74c2-bb0e-c82cf5ce3c85` (idle) | [#1654](https://github.com/rickylabs/netscript/pull/1654) **MERGED** `da574111a` @ 2026-08-15T05:36:48Z | **TERMINAL** — Tier-A `PASS` + IMPL-EVAL `PASS` at `f178ac663`; leased `scaffold.runtime` `suite-end` `ok:true` 88/0; all three issues `CLOSED/COMPLETED` at `status:shipped`. Receipts preserved in-tree on `main`. |
| `design-registry-catalog-drift-gate` | #1358 | `/home/codex/repos/netscript-007-leaf-design-registry-drift` | `fix/design-registry-catalog-drift-gate` | `da574111a` | Codex · `gpt-5.6-sol` · medium | `01a003f0-7821-7a10-a555-e619a9280479` (idle) | [#1657](https://github.com/rickylabs/netscript/pull/1657) **MERGED** `6917c656e` @ 2026-08-15T08:27:20Z | **TERMINAL/SHIPPED** — squash-merged from exact head `b71c1ee72`; #1358 `CLOSED`/`COMPLETED` with **7/7** acceptance boxes checked; PR and issue both exactly `status:shipped`; `impl-eval:skip` removed. IMPL-EVAL cycle 2 `PASS` at `3d7819203`; body recheck `PASS` at `b71c1ee72`. |
| `ai-mcp-pool-isolation` | #1448 | `/home/codex/repos/netscript-007-leaf-ai-mcp-pool` | `fix/ai-mcp-pool-isolation` | `284dda90a` | Codex · `gpt-5.6-sol` · medium | `01a0048d-61b0-76a2-8117-5f8ce0466495` (idle) | [#1661](https://github.com/rickylabs/netscript/pull/1661) **non-draft** @ `4766b258f`, `MERGEABLE`/**`BLOCKED`**, label **`status:impl-eval`** | IMPL-EVAL cycle 2 `PASS` (final). PR **0 unchecked**, #1448 **9/9 checked**, threads 0/0. `close-gate`, `quality`, `code-quality` **pass**; **`check-test` pending** → `BLOCKED`. ⚠ **`status:ready-merge` is NOT set** (see drift) — merge precondition unmet. Merge decision is the coordinator's. |
| `sdk-cache-surface-and-telemetry` | #1598, #1619, #1620, #1623, #1637 | — | — | — | — | — | — | **Wave 3 ELIGIBLE, queued** — zero incoming DAG edges, all five issues open in `0.0.7`, no `epic:sdk-client-contrib`. Held inside the 2-leaf WIP bound. |

Every branch has no upstream by design. Pushes must use an explicit refspec. Exact observed route,
thread id, current head, and same-thread resume command are filled from the agentic launch records.

## Same-thread steering through the agentic suite

```bash
deno task agentic:codex-resume --thread-id 01a0048d-61b0-76a2-8117-5f8ce0466495 --worktree /home/codex/repos/netscript-007-leaf-ai-mcp-pool --message "<follow-up>"

deno task agentic:codex-resume --thread-id 01a003f0-7821-7a10-a555-e619a9280479 --worktree /home/codex/repos/netscript-007-leaf-design-registry-drift --message "<follow-up>"

deno task agentic:codex-resume --thread-id 019ffcca-8bdc-7fb3-98c5-df90e2ae3b1f --worktree /home/codex/repos/netscript-007-leaf-legacy-port-pin-sweep --message "<follow-up>"

deno task agentic:codex-resume --thread-id 019ffcca-8be0-74c2-bb0e-c82cf5ce3c85 --worktree /home/codex/repos/netscript-007-leaf-scaffold-generated-output-correctness --message "<follow-up>"
```

Do not send a second launch to either worktree. The agentic sender registry owns both worktrees for
the lifetime of these threads.
