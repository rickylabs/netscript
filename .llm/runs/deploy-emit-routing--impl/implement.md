use harness

## SKILL

Read `.agents/skills/netscript-harness/SKILL.md`, `.agents/skills/netscript-cli/SKILL.md`, and
`.agents/skills/netscript-pr/SKILL.md`.

You are the lane (Codex · OpenAI · GPT-5.6 Sol · medium, `normal_implementation`) for **#1544**.
Read it in full: `gh issue view 1544 --repo rickylabs/netscript`.

Worktree `/home/agent/projects/netscript/worktrees/007-leaf-1544`, branch `fix/deploy-emit-routing`,
based on current `origin/main`. Scope: `packages/cli/**` plus the run-dir worklog. Nothing else.

## The defect

`emit` is **advertised**, **implemented**, and **described**, but not **routed** — so
`netscript deploy <target> emit` does not exist while `netscript deploy list` reports it.

- advertised: `packages/cli/src/kernel/adapters/aspire/aspire-compose-deploy-target.ts:64-71`
  (`operations = ['plan','emit','up','down','status','logs']`); the cloud and service adapters too;
- implemented: same file, `:95-97`;
- described: `target-deploy-command.ts` `OPERATION_DESCRIPTIONS` carries `emit`;
- **not routed**: `target-deploy-command.ts:15-23` `ROUTED_OPERATIONS` omits it, and subcommands are
  generated from `ROUTED_OPERATIONS` ∩ the adapter's advertised set (`:42`, `:59`).

The public verb surface is that intersection, so an operation missing from `ROUTED_OPERATIONS` can
never become a command regardless of what any adapter advertises.

## The supervisor ruling you are implementing

**Route `emit` — do not un-advertise it.** Three adapters implement it and it is user-meaningful
(emit deployment artifacts without applying them). Deleting the advertisement to make the surface
consistent would remove working capability; routing it exposes capability that already exists.

Verify that ruling still holds against the code before implementing. If any of the three adapters
turns out **not** to implement `emit` meaningfully, stop and report it — do not route a verb into a
stub.

## The deeper issue — address it, don't just add a string

Adding `'emit'` to a literal array fixes this instance and leaves the class intact: the next verb
advertised-but-unrouted fails exactly the same way, silently. Make the divergence **detectable**:
a test that fails when any adapter advertises an operation the router cannot route, or has a
description with no route. Prove it non-vacuous by planting a synthetic advertised-unrouted verb and
showing the guard fires, then removing it.

That guard is the durable part of this slice.

## Gates

- `run-deno-check.ts --root packages/cli/src --ext ts` and the touched test roots
- `deno test` over the affected `packages/cli` test paths
- `run-deno-lint.ts` and `run-deno-fmt.ts` over touched roots
- Do **not** run the full `e2e:cli` suite; this is a routing/table change with unit coverage.

RED-then-GREEN: a failing test proving `emit` is unroutable, then the fix. Record both SHAs.

## PR rules

Draft PR on the first commit — a draft skips every runtime job, so mark it ready when you want CI.
`Closes #1544` only if every acceptance box is genuinely satisfied, else `Refs #1544` with remaining
scope. Labels `type:fix`, `area:cli`, `priority:p2`, `status:impl`, `orchestrator:fixes`; milestone
`0.0.7`. Progress in `.llm/runs/deploy-emit-routing--impl/worklog.md`.
