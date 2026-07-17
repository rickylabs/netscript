# D3 board-mechanics — open questions (owner forks)

> DRAFT — Stage-D. These are D3's own numbered forks; they are folded into the consolidated sweep
> in `decision-brief.md` §A and resolved at Stage-E/H by the owner in-turn. No fork is silently
> decided; each carries a default the plan-lock will adopt only if the owner does not override.

1. **OF-1 Milestone anchor.** Marquee UR set at `0.0.1-beta.13` (after PM #510 at beta.12)? Default: yes.
2. **OF-2 Handle namespace.** `UR-<n>` for #823 children instead of the legacy `E-desktop` handles
   carried on #451/#453/#454/#455? Default: yes.
3. **OF-3 Desktop boundary.** UR-10 (re-scoped #454) on #823; desktop consumer stays on #830
   (beta.14). D3 does not re-file desktop cards. Confirm? Default: yes.
4. **OF-4 Tier-3 cell placement.** UR-6 isolate/serverless (Vercel/CF/Netlify, old #349 scope) at
   beta.13, or deferred to beta.14/stable given the still-`--unstable` preset (D-01/D-04)? Default:
   defer to stable; ship deno_server + deno_deploy + Node cell at beta.13.
5. **OF-5 Offline-sync home.** #455/UR-8 at `0.0.1-stable` vs `Backlog / Triage` (p3; D-09 profile)?
   Default: `0.0.1-stable`.
6. **OF-6 Milestone inventory.** Create no new milestone; verify `0.0.1-stable` exists live (create
   only if absent)? Default: create none beyond a possibly-missing `0.0.1-stable`.
7. **OF-7 Label parity.** File the one-line `.github/labels.yml` parity PR adding `epic:unified-runtime`
   (live but not in the file) before Stage-H relies on it? Default: yes, parity PR first.
8. **OF-8 UR-6 granularity.** UR-6 as a single matrix issue with per-cell acceptance (D3 default),
   or one issue per runtime cell (four cards)? Default: single matrix issue — keeps the "one deploy
   output" story to one acceptance surface. (Escalate to D2 if it prefers per-cell cards.)
9. **OF-9 #454 body edit authorization.** The re-scope (D-02) is the only Stage-H **content edit**
   on a re-homed issue (all others are label/milestone/`Part of` only). Explicit owner OK to edit
   #454's acceptance text at filing? Default: yes (edit, not close).

## Cross-pack dependency notes (not forks — for Stage-E integration)

- D3's DAG assumes D1 owns UR-1…UR-4/UR-10 text and D2 owns UR-5…UR-10 text. If either pack renames
  or splits a slot, Stage-E must re-map the slot table before filing.
- The legacy live dependency chain (#451→#454, #453→#454, #454→#455) is preserved as
  UR-4→UR-10, UR-7→UR-10, UR-10→UR-8; if D1/D2 propose a different ordering, the fold wiring in the
  supersession map must be revisited.
