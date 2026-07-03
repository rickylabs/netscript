# Deploy port-expansion ownership (epic #327 supervisor decision)

Follows `contract-reconciliation.md` (deploy-s2 run dir). Three deployment slices touch the
shared deploy port; this note designates a single owner so they do not collide. Internal
architecture/sequencing decision by the #327 supervisor — not a user decision.

## Facts (from the #339/#340 + #343 planning passes)

- Main ships **two seams at different levels**: (a) the 3-op stub `DeployTargetPort` +
  `WindowsServiceDeployTarget` + registry (commit `3137e455`), and (b) a **real**
  `WindowsServicePort` + `ServyCliAdapter` (actual servy implementation), with `start/stop/status`
  today bypassing the port via a `runServy()` helper.
- Doctrine (Archetype 7, PR #357) mandates the canonical **7-op** contract
  (`plan`/`emit` · `up` · `down` · `status` · `logs` · `rollback` · `secrets`).
- #339/#340 (bare-metal), #342 (Deno Deploy), #343 (Aspire) all initially claimed to "own"
  expanding the 3-op port → 7-op.

## Decision

1. **#339/#340 (Deploy-S3, bare-metal) OWNS the port contract.** It expands the 3-op
   `DeployTargetPort` → the canonical 7-op contract, defines `OsServicePort`, unifies the two
   shipped seams (stub + real `WindowsServicePort`/`ServyCliAdapter`, folding the `runServy()`
   bypass behind the port), and performs the verb-vocabulary lock (canonical 7 op names, existing
   CLI verbs kept as aliases). This is the natural home: it is the reference adapter and already
   evolves the stub. (Ratifies its LD-1 two-layer design + LD-3 verb-lock.)
2. **#342 (Deno Deploy) and #343 (Aspire) CONSUME the expanded port.** They implement adapters
   against the 7-op port; they MUST NOT redefine the port or the op contract. Their plans are
   rescoped so the port-expansion is an inbound dependency, not owned work.
3. **Front-load the port-expansion.** #339/#340 must land its port-contract commit EARLY in its
   S0→S10 order as an independently-mergeable unit, so #342/#343 can rebase onto it quickly and the
   p0 Deno Deploy marquee is not serialized behind the full bare-metal slice. Merge order:
   #357 (doctrine) → #339/#340 port-expansion commit → sibling adapters rebase.
4. **Verb-lock now resolved.** The reconciliation's "final verb names lock at first real adapter"
   is discharged here: canonical = the 7 doctrine op names; CLI verbs (`build/install/uninstall`)
   remain user-facing aliases. #342/#343 use the canonical names.

## Dispatch-lane correction (applies to all deployment slices)

The planners' "implement via WSL Codex / PLAN-EVAL via OpenHands-minimax" next-steps echo generic
harness doctrine. For THIS epic the lane is: **implementers = Opus 4.8 sub-agents only**;
**evaluators = separate Opus session (or Codex GPT-5.5 when the conduit is reachable)**. WSL Codex
is dropped for the deployment epic. This is a dispatch-lane override, not a plan defect.
