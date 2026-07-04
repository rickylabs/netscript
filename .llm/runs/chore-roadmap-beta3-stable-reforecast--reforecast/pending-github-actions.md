# Pending GitHub actions (issue surface — denied to the fold session)

The ratification-fold session's permission grant covered the PR #392 surface only. These
R1/R4-directed issue-surface actions are recorded here for the owner or a granted session.
All are reversible.

## 1. Apply the R1 milestone move

```bash
gh issue edit 302 --repo rickylabs/netscript --milestone "Backlog / Triage"
```

Post-move distribution: beta.3=9 · beta.4=9 · beta.5=10 · stable=8 · Backlog=15.

## 2. Comment on #302 (R1 — fast-follow)

> Owner ratification (2026-07-04, recorded on PR #392, R1): bench leadership is a **post-stable
> fast-follow**, not a hard `0.0.1-stable` gate — the stable cut must not block on it. Milestone
> moved `0.0.1-stable` -> `Backlog / Triage` (reversible) so the stable milestone reflects the
> cut's true gate set; work may proceed in parallel and publishes after the cut.
>
> Ratification record: `.llm/runs/chore-roadmap-beta3-stable-reforecast--reforecast/roadmap-0.0.1.md`
> §5 (PR #392). Follow-up for owner: loosen the "hard gate" framing in #301's body accordingly.

## 3. Comment on #394 (R4 — bare-metal-first)

> Owner ratification (2026-07-04, recorded on PR #392, R4): the stable "verified production
> deployment path" gate is **bare-metal (`systemd` + `deno compile`)**, not Deno Deploy. This
> deploy e2e is therefore reprioritized **bare-metal-first** — the bare-metal target is the gating
> path the beta.5 -> stable deployability gate must prove. Deno Deploy remains a supported tier
> but is not the stable gate.
>
> Milestone unchanged (`0.0.1-beta.3`). Ratification record:
> `.llm/runs/chore-roadmap-beta3-stable-reforecast--reforecast/roadmap-0.0.1.md` §5 (PR #392).

## 4. Loosen #301's "hard gate" bench framing (owner follow-up per R1)

Amend the epic body so bench leadership (#302) reads as a post-stable fast-follow, not a stable
gate. Owner-authored — the epic body is the program's charter.
