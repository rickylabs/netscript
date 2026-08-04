use harness

# Slice (owner-priority, next canary): randomize scaffold default ports — #1202 (p1)

Implementation supervisor for the PR resolving #1202's implementable boxes. Read the issue +
its three comments first — the evidence trail matters: the `users` service's DB health fails
on **fixed port 3001** in every local reproduction while dynamically-allocated siblings stay
healthy; owner diagnosis is a Windows autostart service squatting that range (WSL2 localhost
forwarding); cloud CI never fails this (no such service on runners) and is the documented
source of truth for the gate.

## SKILL

- `.agents/skills/netscript-harness`
- `.agents/skills/netscript-pr`
- `.agents/skills/netscript-cli` (scaffold emission)
- `.agents/skills/netscript-doctrine` (if any packages/** surface moves)

## Milestone-run evaluator rule

Per milestone-run.md § Evaluator protocol + orchestrator ruling D6: no local formal PLAN-EVAL;
composed evaluation; mark your PLAN-EVAL row accordingly; plan then implement in one run.

## Deliverable

1. **No generated service binds a fixed low/common port by default** (3001 and any siblings —
   sweep the scaffold templates/command emission for every hardcoded listen port). Defaults
   move to a randomized high-range allocation at scaffold time (seeded per-project so a
   scaffold is stable across restarts), or to fully dynamic allocation with discovery through
   the `ServiceEndpointDirectoryPort` (#1194) where the consuming path supports it. Record the
   chosen design + rationale in your plan.
2. Generated-output test: no emitted config/command contains a port below the chosen floor —
   RED on today's generator, GREEN after.
3. Prisma/DB endpoint wiring re-verified: a clean local `scaffold.runtime` one-pass after the
   change (the local 3001 collision should vanish with the port move even with the Windows
   service present — but treat cloud CI as the verdict source per owner ruling; a residual
   local red on unrelated fixed ports is evidence to record, not to chase).
4. The Windows-service identification box is OWNER-owned (tonight) — your PR carries
   `Refs #1202`-style evidence-gating for that box only if the issue's box structure requires
   it; otherwise `Closes #1202` with the owner box explicitly routed on the issue. Mirror the
   live issue body truthfully.

## Gates

Framework-wave law if `packages/**` moves; scoped wrappers; generated-output tests; no new
lint-ignores; no `deno.lock` churn. scaffold.runtime: coordinate the expensive slot — the
sagas slice may hold it; queue behind.

## PR contract

Branch `fix/scaffold-random-default-ports` (worktree provided), target `main`. Labels:
`type:fix`, `area:cli`, `area:database`, `priority:p1`, exactly one `status:`; milestone
`0.0.5`. Authoritative `## Definition of Done`, all truthful template boxes ticked; no
keyword-adjacent issue references in prose (in any encoding). Slice worklog/drift here;
explicit-refspec push; open draft, mark ready when gates are green.
