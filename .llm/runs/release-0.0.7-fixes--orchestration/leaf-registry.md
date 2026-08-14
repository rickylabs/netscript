# Wave 0 leaf registry — fixes topic

| Leaf | Issues | Worktree | Branch | Base | Route | Thread | Draft PR | State |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `legacy-port-pin-sweep` | #1243 | `/home/codex/repos/netscript-007-leaf-legacy-port-pin-sweep` | `fix/legacy-port-pin-sweep` | `e6ba15ec6` | requested/observed Codex · OpenAI · `gpt-5.6-sol` · low (matched) | `019ffcca-8bdc-7fb3-98c5-df90e2ae3b1f` (idle at `task_complete`) | [#1643](https://github.com/rickylabs/netscript/pull/1643) draft → `main`, `status:impl`, `MERGEABLE` | **order 2 terminal — IMPL-EVAL `PASS`** at evaluated head `e6ba15ec6`, verdict commit `a949a6cd1` (branch now at `a949a6cd1`, pushed). Awaiting coordinator disposition; this lane grants no ready/merge/close. |
| `scaffold-generated-output-correctness` | #1262, #1263, #1588 | `/home/codex/repos/netscript-007-leaf-scaffold-generated-output-correctness` | `fix/scaffold-generated-output-correctness` | `14d8b38b4` | requested/observed Codex · OpenAI · `gpt-5.6-sol` · high (matched) | `019ffcca-8be0-74c2-bb0e-c82cf5ce3c85` (idle at `task_complete`) | [#1654](https://github.com/rickylabs/netscript/pull/1654) draft → `main`, `status:plan-eval`, `MERGEABLE` | **order 5 terminal — PLAN-EVAL cycle 1 `FAIL_PLAN`** at evaluated head `14d8b38b4`, verdict commit `13008abf8` (branch now `13008abf8`, pushed); evaluator session `bd703a7d…` retired. Plan repair dispatched to the **existing** Codex thread `019ffcca-8be0…` — plan-text only, no implementation. Stops at the cycle-2 handoff; cycle 2 needs an updated immutable source brief and a fresh coordinator grant. |

Every branch has no upstream by design. Pushes must use an explicit refspec. Exact observed route,
thread id, current head, and same-thread resume command are filled from the agentic launch records.

## Same-thread steering through the agentic suite

```bash
deno task agentic:codex-resume --thread-id 019ffcca-8bdc-7fb3-98c5-df90e2ae3b1f --worktree /home/codex/repos/netscript-007-leaf-legacy-port-pin-sweep --message "<follow-up>"

deno task agentic:codex-resume --thread-id 019ffcca-8be0-74c2-bb0e-c82cf5ce3c85 --worktree /home/codex/repos/netscript-007-leaf-scaffold-generated-output-correctness --message "<follow-up>"
```

Do not send a second launch to either worktree. The agentic sender registry owns both worktrees for
the lifetime of these threads.
